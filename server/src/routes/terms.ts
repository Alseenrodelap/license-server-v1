import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { getSetting } from '../services/emailService';

const router = Router();

router.get('/', requireAuth, requireRole(['SUPER_ADMIN', 'SUB_ADMIN', 'READ_ONLY']), async (_req, res) => {
	const items = await prisma.termsOfService.findMany({ orderBy: { updatedAt: 'desc' } });
	res.json({ items });
});

router.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'SUB_ADMIN']), async (req, res) => {
	const { slug, title, contentHtml, isPublished = true } = req.body ?? {};
	const latest = await prisma.termsOfService.findFirst({ where: { slug }, orderBy: { version: 'desc' } });
	const version = (latest?.version ?? 0) + 1;
	const item = await prisma.termsOfService.create({ data: { slug, title, contentHtml, isPublished, version } });
	res.json({ item });
});

router.put('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'SUB_ADMIN']), async (req, res) => {
	const { id } = req.params;
	const { title, contentHtml, isPublished } = req.body ?? {};
	const item = await prisma.termsOfService.update({ where: { id }, data: { title, contentHtml, isPublished } });
	res.json({ item });
});

router.get('/public/latest', async (_req, res) => {
	const slug = (await getSetting('TERMS_SLUG')) || 'license-terms';
	const item = await prisma.termsOfService.findFirst({ where: { slug, isPublished: true }, orderBy: { version: 'desc' } });
	if (!item) return res.status(404).send('Not found');
	res.send(item.contentHtml);
});

router.get('/public/:slug/latest', async (req, res) => {
	const { slug } = req.params;
	const item = await prisma.termsOfService.findFirst({ where: { slug, isPublished: true }, orderBy: { version: 'desc' } });
	if (!item) return res.status(404).send('Not found');
	res.send(item.contentHtml);
});

router.get('/public/:slug/:version', async (req, res) => {
	const { slug, version } = req.params as any;
	const item = await prisma.termsOfService.findFirst({ where: { slug, version: Number(version), isPublished: true } });
	if (!item) return res.status(404).send('Not found');
	res.send(item.contentHtml);
});

export default router;
