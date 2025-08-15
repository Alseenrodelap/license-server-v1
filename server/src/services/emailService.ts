import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';
import logger from '../utils/logger';

export type MailParams = {
	to: string;
	subject: string;
	html: string;
};

export const sendMail = async ({ to, subject, html }: MailParams) => {
	const host = (await getSetting('SMTP_HOST')) || process.env.SMTP_HOST || '';
	const portStr = (await getSetting('SMTP_PORT')) || process.env.SMTP_PORT || '587';
	const secureStr = (await getSetting('SMTP_SECURE')) || String(process.env.SMTP_SECURE || 'false');
	const user = (await getSetting('SMTP_USER')) || process.env.SMTP_USER || '';
	const pass = (await getSetting('SMTP_PASS')) || process.env.SMTP_PASS || '';
	const from = (await getSetting('SMTP_FROM')) || process.env.SMTP_FROM || 'Licenses <no-reply@example.com>';

	if (!host) {
		const err = new Error('SMTP not configured: missing SMTP_HOST');
		(err as any).details = { host, portStr, secureStr, userSet: Boolean(user), passSet: Boolean(pass), from };
		throw err;
	}

	const transporter = nodemailer.createTransport({
		host,
		port: Number(portStr),
		secure: secureStr === 'true',
		auth: user && pass ? { user, pass } : undefined,
		connectionTimeout: 5000,
		greetingTimeout: 5000,
		socketTimeout: 5000,
	} as any);

	const hardTimeoutMs = 7000;
	const hardTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP send timeout')), hardTimeoutMs));

	try {
		const result = await Promise.race([
			transporter.sendMail({ from, to, subject, html }),
			hardTimeout,
		]);
		return result as any;
	} catch (e: any) {
		logger.error(`Email send failed: ${e?.message || e}`);
		(e as any).details = (e as any).details || { host, portStr, secureStr, userSet: Boolean(user), passSet: Boolean(pass), from };
		throw e;
	}
};

export const getSetting = async (key: string): Promise<string | null> => {
	const s = await prisma.setting.findUnique({ where: { key } });
	return s?.value ?? null;
};

export const setSetting = async (key: string, value: string): Promise<void> => {
	await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
};
