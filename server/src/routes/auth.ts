import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

router.get('/initialized', async (_req, res) => {
	const count = await prisma.user.count();
	res.json({ initialized: count > 0 });
});

router.post('/setup', async (req, res) => {
	const { name, email, password } = req.body ?? {};
	const existing = await prisma.user.findFirst();
	if (existing) return res.status(400).json({ error: 'Already initialized' });
	if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
	const passwordHash = await bcrypt.hash(password, 10);
	const user = await prisma.user.create({ data: { name, email, passwordHash, role: 'SUPER_ADMIN' } });
	const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
	res.json({ token });
});

router.post('/login', async (req, res) => {
	const { email, password } = req.body ?? {};
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) return res.status(401).json({ error: 'Invalid credentials' });
	const ok = await bcrypt.compare(password, user.passwordHash);
	if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
	const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
	res.json({ token });
});

router.post('/forgot-password', async (req, res) => {
	const { email } = req.body ?? {};
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) return res.json({ ok: true });
	const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
	const exp = new Date(Date.now() + 1000 * 60 * 30);
	await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExp: exp } });
	const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
	res.json({ ok: true, resetUrl });
});

router.post('/reset-password', async (req, res) => {
	const { token, password } = req.body ?? {};
	const user = await prisma.user.findFirst({ where: { resetToken: token } });
	if (!user || !user.resetTokenExp || user.resetTokenExp < new Date()) return res.status(400).json({ error: 'Invalid token' });
	const passwordHash = await bcrypt.hash(password, 10);
	await prisma.user.update({ where: { id: user.id }, data: { passwordHash, resetToken: null, resetTokenExp: null } });
	res.json({ ok: true });
});

router.get('/users', requireAuth, requireRole(['SUPER_ADMIN', 'SUB_ADMIN']), async (_req, res) => {
	const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
	res.json({ users });
});

router.post('/users', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
	const { name, email, password, role } = req.body ?? {};
	const passwordHash = await bcrypt.hash(password, 10);
	const user = await prisma.user.create({ data: { name, email, passwordHash, role } });
	res.json({ user });
});

router.put('/users/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
	const { id } = req.params;
	const { name, email, role, password } = req.body ?? {};
	const data: any = { name, email, role };
	if (password) data.passwordHash = await bcrypt.hash(password, 10);
	const user = await prisma.user.update({ where: { id }, data });
	res.json({ user });
});

router.delete('/users/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
	const { id } = req.params;
	await prisma.user.delete({ where: { id } });
	res.json({ ok: true });
});

export default router;
