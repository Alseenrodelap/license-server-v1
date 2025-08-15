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
	
	try {
		// Get current SMTP settings for logging
		const host = await getSetting('SMTP_HOST');
		const port = await getSetting('SMTP_PORT');
		const secure = await getSetting('SMTP_SECURE');
		const user = await getSetting('SMTP_USER');
		const from = await getSetting('SMTP_FROM');
		
		// Test connection and send email
		await sendMail({ to, subject: 'Test email', html: '<p>Test</p>' });
		await setSetting('SMTP_TEST_TO', to);
		
		res.json({ 
			ok: true, 
			message: 'Test e-mail succesvol verstuurd!',
			details: {
				host,
				port,
				secure,
				user,
				from,
				to
			}
		});
	} catch (error: any) {
		console.error('SMTP Test Error:', error);
		
		// Get detailed error information
		const errorDetails = {
			message: error.message || 'Onbekende fout',
			code: error.code || 'UNKNOWN',
			response: error.response || null,
			command: error.command || null,
			responseCode: error.responseCode || null,
			stack: error.stack || null,
			smtpSettings: {
				host: await getSetting('SMTP_HOST'),
				port: await getSetting('SMTP_PORT'),
				secure: await getSetting('SMTP_SECURE'),
				user: await getSetting('SMTP_USER'),
				from: await getSetting('SMTP_FROM'),
				to
			}
		};
		
		res.status(500).json({ 
			ok: false, 
			error: 'SMTP Test mislukt',
			details: errorDetails
		});
	}
});

export default router;
