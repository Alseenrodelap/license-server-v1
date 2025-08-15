import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, requireRole(['SUPER_ADMIN', 'SUB_ADMIN', 'READ_ONLY']), async (_req, res) => {
	const now = new Date();
	const [active, inactive, expired, total] = await Promise.all([
		prisma.license.count({ where: { status: 'ACTIVE' } }),
		prisma.license.count({ where: { status: 'INACTIVE' } }),
		prisma.license.count({ where: { status: 'ACTIVE', expiresAt: { lt: now } } }),
		prisma.license.count(),
	]);

	const monthlyActive = await prisma.license.findMany({ where: { status: 'ACTIVE', priceInterval: 'MONTHLY' } });
	const monthlyRevenueCents = monthlyActive.reduce((s, l) => s + (l.priceCents || 0), 0);

	const yearlyActive = await prisma.license.findMany({ where: { status: 'ACTIVE', priceInterval: 'YEARLY' } });
	const yearlyRevenueCents = yearlyActive.reduce((s, l) => s + (l.priceCents || 0), 0);

	const startOfYear = new Date(now.getFullYear(), 0, 1);
	const oneTimeThisYear = await prisma.license.findMany({ where: { priceInterval: 'ONE_TIME', createdAt: { gte: startOfYear } } });
	const oneTimeRevenueThisYearCents = oneTimeThisYear.reduce((s, l) => s + (l.priceCents || 0), 0);

	const totalYearRevenueCents = monthlyRevenueCents * 12 + yearlyRevenueCents + oneTimeRevenueThisYearCents;

	const recentApi = await prisma.license.findMany({ where: { lastApiAccessAt: { not: null } }, orderBy: { lastApiAccessAt: 'desc' }, take: 10 });

	res.json({
		active,
		inactive,
		expired,
		total,
		monthlyRevenueCents,
		yearlyRevenueCents,
		oneTimeRevenueThisYearCents,
		totalYearRevenueCents,
		recentApi,
	});
});

export default router;
