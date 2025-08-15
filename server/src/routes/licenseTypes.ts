import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, requireRole(['SUPER_ADMIN', 'SUB_ADMIN', 'READ_ONLY']), async (_req, res) => {
	const items = await prisma.licenseType.findMany({
		orderBy: { name: 'asc' },
		include: { _count: { select: { licenses: true } } as any },
	} as any);
	res.json({ items });
});

router.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'SUB_ADMIN']), async (req, res) => {
	const { name } = req.body ?? {};
	const item = await prisma.licenseType.create({ data: { name } });
	res.json({ item });
});

router.put('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'SUB_ADMIN']), async (req, res) => {
	const { id } = req.params;
	const { name } = req.body ?? {};
	const item = await prisma.licenseType.update({ where: { id }, data: { name } });
	res.json({ item });
});

router.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'SUB_ADMIN']), async (req, res) => {
	const { id } = req.params;
	await prisma.licenseType.delete({ where: { id } });
	res.json({ ok: true });
});

export default router;
