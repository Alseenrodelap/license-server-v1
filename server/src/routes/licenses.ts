import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { generateLicenseCode } from '../utils/license';
import { getSetting, sendMail } from '../services/emailService';
import logger from '../utils/logger';

const router = Router();

// List with search, sort, filter, pagination
router.get('/', requireAuth, requireRole(['SUPER_ADMIN', 'SUB_ADMIN', 'READ_ONLY']), async (req, res) => {
	const {
		q,
		status,
		typeId,
		sort = 'createdAt',
		order = 'desc',
		pageSize = '25',
		page = '1',
	} = req.query as Record<string, string>;

	const take = pageSize === 'all' ? undefined : Math.min(Number(pageSize || '25'), 1000);
	const skip = take ? (Math.max(Number(page || '1'), 1) - 1) * take : undefined;

	const where = {
		AND: [
			status ? { status } : {},
			typeId ? { typeId } : {},
			q
				? {
					OR: [
						{ code: { contains: q } },
						{ customerName: { contains: q } },
						{ customerEmail: { contains: q } },
						{ customerNumber: { contains: q } },
						{ domain: { contains: q } },
						{ notes: { contains: q } },
					],
				}
			: {},
		],
	};

	const [items, total] = await Promise.all([
		prisma.license.findMany({ where, orderBy: { [sort]: order as any }, skip, take, include: { type: true } }),
		prisma.license.count({ where }),
	]);

	res.json({ items, total });
});

router.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'SUB_ADMIN']), async (req, res) => {
	const {
		code,
		customerName,
		customerEmail,
		customerNumber,
		domain,
		typeId,
		licenseTypeId,
		status = 'ACTIVE',
		notes,
		priceCents = 0,
		priceInterval = 'ONE_TIME',
		expiresAt,
		sendEmail = false,
	} = req.body ?? {};

	const license = await prisma.license.create({
		data: {
			code: code || generateLicenseCode(),
			customerName,
			customerEmail,
			customerNumber,
			domain,
			typeId: licenseTypeId || typeId,
			status,
			notes,
			priceCents,
			priceInterval,
			expiresAt: expiresAt ? new Date(expiresAt) : null,
		},
		include: { type: true },
	});

	if (sendEmail) {
		const appName = (await getSetting('APP_NAME')) || 'License Server';
		const template = (await getSetting('EMAIL_TEMPLATE_LICENSE')) ||
			`<p>Beste {{customer_name}},</p>
<p>Hierbij uw licentie:</p>
<p><b>Code:</b> {{license_code}}<br/>
<b>Type:</b> {{license_type}}<br/>
<b>Domein:</b> {{domain}}<br/>
<b>Status:</b> {{status}}<br/>
<b>Vervaldatum:</b> {{expires_at}}</p>
<p>Voorwaarden: <a href="{{terms_url}}">{{terms_url}}</a></p>
<p>Groet,<br/>${appName}</p>`;
		const termsUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/terms/latest`;
		const html = template
			.replaceAll('{{customer_name}}', license.customerName)
			.replaceAll('{{license_code}}', license.code)
			.replaceAll('{{license_type}}', license.type.name)
			.replaceAll('{{domain}}', license.domain)
			.replaceAll('{{status}}', license.status)
			.replaceAll('{{expires_at}}', license.expiresAt ? new Date(license.expiresAt).toISOString().slice(0, 10) : '—')
			.replaceAll('{{terms_url}}', termsUrl);
		try {
			await sendMail({ to: license.customerEmail, subject: `${appName} licentie`, html });
		} catch (e: any) {
			logger.warn(`Sending license email failed: ${e?.message || e}`);
		}
	}

	res.json({ license });
});

router.put('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'SUB_ADMIN']), async (req, res) => {
	try {
		const { id } = req.params;
		const body = req.body ?? {};
		// Map en filter alleen toegestane velden
		const allowed: any = {};
		if (typeof body.code === 'string' && body.code.trim()) allowed.code = body.code.trim();
		if (typeof body.customerName === 'string') allowed.customerName = body.customerName;
		if (typeof body.customerEmail === 'string') allowed.customerEmail = body.customerEmail;
		if (typeof body.customerNumber === 'string') allowed.customerNumber = body.customerNumber;
		if (typeof body.domain === 'string') allowed.domain = body.domain;
		if (typeof body.status === 'string') allowed.status = body.status;
		if (typeof body.notes === 'string' || body.notes === null) allowed.notes = body.notes;
		if (typeof body.priceCents === 'number') allowed.priceCents = body.priceCents;
		if (typeof body.priceInterval === 'string') allowed.priceInterval = body.priceInterval;
		if (body.expiresAt === null) allowed.expiresAt = null;
		if (typeof body.expiresAt === 'string') allowed.expiresAt = new Date(body.expiresAt);
		const mappedTypeId = body.licenseTypeId || body.typeId;
		if (typeof mappedTypeId === 'string') allowed.typeId = mappedTypeId;

		const license = await prisma.license.update({ where: { id }, data: allowed });
		res.json({ license });
	} catch (e: any) {
		if (e?.code === 'P2002' && e?.meta?.target?.includes('License_code_key')) {
			return res.status(409).json({ error: 'Licentiecode bestaat al' });
		}
		logger.error(`Update license failed: ${e?.message || e}`);
		return res.status(500).json({ error: 'Failed to update license' });
	}
});

router.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
	const { id } = req.params;
	await prisma.license.delete({ where: { id } });
	res.json({ ok: true });
});

// Resend license email
router.post('/:id/resend-email', requireAuth, requireRole(['SUPER_ADMIN', 'SUB_ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const license = await prisma.license.findUnique({ where: { id }, include: { type: true } });
        if (!license) return res.status(404).json({ error: 'Not found' });

        const appName = (await getSetting('APP_NAME')) || 'License Server';
        const template = (await getSetting('EMAIL_TEMPLATE_LICENSE')) ||
            `<p>Beste {{customer_name}},</p>
<p>Hierbij uw licentie:</p>
<p><b>Code:</b> {{license_code}}<br/>
<b>Type:</b> {{license_type}}<br/>
<b>Domein:</b> {{domain}}<br/>
<b>Status:</b> {{status}}<br/>
<b>Vervaldatum:</b> {{expires_at}}</p>
<p>Voorwaarden: <a href="{{terms_url}}">{{terms_url}}</a></p>
<p>Groet,<br/>${appName}</p>`;
        const termsUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/terms/latest`;
        const html = template
            .replaceAll('{{customer_name}}', license.customerName)
            .replaceAll('{{license_code}}', license.code)
            .replaceAll('{{license_type}}', license.type.name)
            .replaceAll('{{domain}}', license.domain)
            .replaceAll('{{status}}', license.status)
            .replaceAll('{{expires_at}}', license.expiresAt ? new Date(license.expiresAt).toISOString().slice(0, 10) : '—')
            .replaceAll('{{terms_url}}', termsUrl);

        await sendMail({ to: license.customerEmail, subject: `${appName} licentie`, html });
        return res.json({ ok: true });
    } catch (e: any) {
        logger.error(`Resend license email failed: ${e?.message || e}`);
        return res.status(500).json({ error: 'Failed to send email' });
    }
});

// Public API: verify license (rate limited per license: 5 per hour)
router.get('/verify/:code', async (req, res) => {
	const { code } = req.params;
	const license = await prisma.license.findUnique({ where: { code }, include: { type: true } });
	if (!license) return res.status(404).json({ valid: false });

	// Rate limit logic per hour window key
	const hourKey = new Date();
	hourKey.setMinutes(0, 0, 0);
	const key = hourKey.toISOString().slice(0, 13);
	let { apiAccessHourKey, apiAccessCountHour } = license as any;
	if (apiAccessHourKey !== key) {
		apiAccessHourKey = key;
		apiAccessCountHour = 0;
	}
	if (apiAccessCountHour >= 5) {
		return res.status(429).json({ valid: false, error: 'Rate limit exceeded' });
	}

	// Update counters and last access
	await prisma.license.update({
		where: { id: license.id },
		data: { apiAccessHourKey: key, apiAccessCountHour: apiAccessCountHour + 1, lastApiAccessAt: new Date() },
	});

	const now = new Date();
	const notExpired = !license.expiresAt || license.expiresAt >= now;
	const isActive = license.status === 'ACTIVE';

	res.json({
		valid: isActive && notExpired,
		code: license.code,
		customerName: license.customerName,
		customerEmail: license.customerEmail,
		domain: license.domain,
		type: license.type.name,
		status: license.status,
		expiresAt: license.expiresAt,
		lastApiAccessAt: license.lastApiAccessAt,
		termsUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/terms/latest`,
	});
});

export default router;
