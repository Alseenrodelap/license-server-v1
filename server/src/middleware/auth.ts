import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../utils/jwt';

export type AppRole = 'SUPER_ADMIN' | 'SUB_ADMIN' | 'READ_ONLY';

export interface AuthUser {
	id: string;
	email: string;
	role: AppRole;
}

declare global {
	namespace Express {
		interface Request {
			user?: AuthUser;
		}
	}
}



export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization;
	if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
	const token = authHeader.slice(7);
	try {
		const payload = jwt.verify(token, getJwtSecret()) as AuthUser;
		req.user = payload;
		next();
	} catch {
		return res.status(401).json({ error: 'Unauthorized' });
	}
};

export const requireRole = (roles: AppRole[]) => (req: Request, res: Response, next: NextFunction) => {
	if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
	if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
	next();
};
