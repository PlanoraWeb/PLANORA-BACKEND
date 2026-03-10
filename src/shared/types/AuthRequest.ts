import { Request } from 'express';

/**
 * JWT ile doğrulanmış kullanıcı bilgisini taşıyan genişletilmiş Request tipi.
 * Auth middleware tarafından set edilir.
 */
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        roleId: string;
    };
}
