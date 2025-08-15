import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getSetting, setSetting, sendMail } from '../services/emailService';

const router = Router();

router.get('/', requireAuth, requireRole(['SUPER_ADMIN', 'SUB_ADMIN', 'READ_ONLY']), async (_req, res) => {
	const keys = ['APP_NAME', 'EMAIL_TEMPLATE_LICENSE', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_FROM', 'SMTP_TEST_TO'];
	const entries = await Promise.all(keys.map(async (k) => [k, await getSetting(k)] as const));
	res.json(Object.fromEntries(entries));
});

router.post('/', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
	const body = req.body ?? {};
	await Promise.all(Object.entries(body).map(([k, v]) => setSetting(k, String(v ?? ''))));
	res.json({ ok: true });
});

router.post('/test-email', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
	const { to } = req.body ?? {};
	await sendMail({ to, subject: 'Test email', html: '<p>Test</p>' });
	await setSetting('SMTP_TEST_TO', to);
	res.json({ ok: true });
});

export default router;
