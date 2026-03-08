import prisma from '../../shared/utils/prisma';
import { AppError } from '../../shared/utils/AppError';
import { CreateProjectInput, UpdateProjectInput, AddMemberInput } from './project.validation';

export class ProjectService {
    async create(data: CreateProjectInput, userId: string) {
        // Proje oluştur
        const project = await prisma.project.create({
            data: {
                projectName: data.projectName,
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
            { name: 'Yapılacaklar', position: 0, isDefault: true },
            { name: 'Devam Ediyor', position: 1, isDefault: false },
            { name: 'Tamamlandı', position: 2, isDefault: false },
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
                createdBy: { select: { id: true, name: true, email: true } },
                _count: { select: { members: true, tasks: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string) {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                        role: { select: { id: true, name: true } },
                    },
                },
                statuses: { orderBy: { position: 'asc' } },
                _count: { select: { tasks: true } },
            },
        });

        if (!project) {
            throw new AppError('Proje bulunamadı', 404);
        }

        return project;
    }

    async update(id: string, data: UpdateProjectInput) {
        await this.findById(id); // Var mı kontrol et

        return prisma.project.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        await this.findById(id);
        return prisma.project.delete({ where: { id } });
    }

    async addMember(projectId: string, data: AddMemberInput) {
        await this.findById(projectId);

        const existing = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: data.userId } },
        });

        if (existing) {
            throw new AppError('Kullanıcı zaten bu projenin üyesi', 409);
        }

        return prisma.projectMember.create({
            data: {
                projectId,
                userId: data.userId,
                roleId: data.roleId,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                role: { select: { id: true, name: true } },
            },
        });
    }

    async removeMember(projectId: string, userId: string) {
        const member = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId } },
        });

        if (!member) {
            throw new AppError('Kullanıcı bu projenin üyesi değil', 404);
        }

        return prisma.projectMember.delete({
            where: { id: member.id },
        });
    }
}

export const projectService = new ProjectService();
