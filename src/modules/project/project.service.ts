import prisma from '../../shared/utils/prisma';
import { AppError } from '../../shared/utils/AppError';
import { CreateProjectDto, UpdateProjectDto, AddProjectMemberDto } from './project.validation';

export class ProjectService {
    async create(data: CreateProjectDto, userId: string) {
        // Proje oluştur
        const project = await prisma.project.create({
            data: {
                projectName: data.name,
                description: data.description,
                createdById: userId,
            },
        });

        // Oluşturan kişiyi "Project Admin" olarak ekle
        const projectAdminRole = await prisma.role.findFirst({
            where: { name: 'Project Admin' },
        });

        if (projectAdminRole) {
            await prisma.projectMember.create({
                data: {
                    projectId: project.id,
                    userId: userId,
                    roleId: projectAdminRole.id,
                },
            });
        }

        // Varsayılan kanban kolonlarını oluştur
        const defaultStatuses = [
            { name: 'TODO', position: 0, isDefault: true },
            { name: 'IN_PROGRESS', position: 1, isDefault: false },
            { name: 'DONE', position: 2, isDefault: false },
        ];

        await prisma.taskStatus.createMany({
            data: defaultStatuses.map((s) => ({
                ...s,
                projectId: project.id,
            })),
        });

        return this.findById(project.id);
    }

    async findAll(userId: string) {
        return prisma.project.findMany({
            where: {
                members: { some: { userId } },
            },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
                members: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true } },
                        role: { select: { name: true } },
                    },
                },
                _count: { select: { members: true, tasks: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string) {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
                members: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, email: true } },
                        role: { select: { id: true, name: true } },
                    },
                },
                statuses: { orderBy: { position: 'asc' } },
                _count: { select: { tasks: true } },
            },
        });

        if (!project) {
            throw new AppError('Proje bulunamadı', 404, 'NOT_FOUND');
        }

        return project;
    }

    async update(id: string, data: UpdateProjectDto) {
        await this.findById(id);

        return prisma.project.update({
            where: { id },
            data: {
                ...(data.name && { projectName: data.name }),
                ...(data.description !== undefined && { description: data.description }),
            },
        });
    }

    async delete(id: string) {
        await this.findById(id);
        return prisma.project.delete({ where: { id } });
    }

    async addMember(projectId: string, data: AddProjectMemberDto) {
        await this.findById(projectId);

        const existing = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: data.userId } },
        });

        if (existing) {
            throw new AppError('Kullanıcı zaten bu projenin üyesi', 409, 'CONFLICT');
        }

        // Role name'den roleId'yi bul
        const role = await prisma.role.findFirst({
            where: { name: data.role === 'PROJECT_ADMIN' ? 'Project Admin' : 'Member' },
        });

        if (!role) {
            throw new AppError('Belirtilen rol bulunamadı', 404, 'NOT_FOUND');
        }

        return prisma.projectMember.create({
            data: {
                projectId,
                userId: data.userId,
                roleId: role.id,
            },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
                role: { select: { id: true, name: true } },
            },
        });
    }

    async removeMember(projectId: string, userId: string) {
        const member = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId } },
        });

        if (!member) {
            throw new AppError('Kullanıcı bu projenin üyesi değil', 404, 'NOT_FOUND');
        }

        return prisma.projectMember.delete({
            where: { id: member.id },
        });
    }
}

export const projectService = new ProjectService();
