import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { 
	generateLicenseCode, 
	generateCryptographicLicenseCode, 
	verifyCryptographicLicenseCode,
	generateVerificationToken,
	isLicenseCodeCryptographic
} from '../utils/license';
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
		// Nieuwe opties
		isCryptographic = false,
		requiresEmailVerification = false,
	} = req.body ?? {};

	let generatedCode: string;
	let isCryptographicGenerated = false;

	if (code) {
		generatedCode = code;
	} else if (isCryptographic) {
		// Cryptografische sleutel genereren
		const now = new Date();
		generatedCode = generateCryptographicLicenseCode(customerEmail, now);
		isCryptographicGenerated = true;
	} else {
		// Random sleutel genereren
		generatedCode = generateLicenseCode();
	}

	const license = await prisma.license.create({
		data: {
			code: generatedCode,
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
			isCryptographic: isCryptographicGenerated,
			requiresEmailVerification,
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

// Nieuwe endpoint voor licentie verificatie met e-mail verificatie
router.post('/verify', async (req, res) => {
	const { licenseCode, customerEmail } = req.body ?? {};

	if (!licenseCode) {
		return res.status(400).json({ error: 'License code required' });
	}

	// Rate limiting: 10 seconden tussen verzoeken per IP
	const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
	const rateLimitKey = `license_verify_${clientIP}`;
	
	// Check rate limiting (simpele in-memory implementatie)
	// In productie zou je Redis of een database gebruiken
	const now = Date.now();
	const lastRequest = global.rateLimitStore?.[rateLimitKey] || 0;
	const timeSinceLastRequest = now - lastRequest;
	
	if (timeSinceLastRequest < 10000) { // 10 seconden
		return res.status(429).json({ 
			error: 'Rate limit exceeded. Please wait 10 seconds between requests.' 
		});
	}
	
	// Update last request time
	if (!global.rateLimitStore) global.rateLimitStore = {};
	global.rateLimitStore[rateLimitKey] = now;

	try {
		// Zoek licentie in database
		const license = await prisma.license.findUnique({
			where: { code: licenseCode },
			include: { type: true }
		});

		if (!license) {
			return res.json({ valid: false, reason: 'License not found' });
		}

		// Check of licentie cryptografisch is en e-mail verificatie vereist
		if (license.isCryptographic) {
			if (!customerEmail) {
				return res.status(400).json({ error: 'Customer email required for cryptographic license' });
			}

			// Verificeer cryptografische sleutel
			const isCryptographicValid = verifyCryptographicLicenseCode(
				licenseCode, 
				customerEmail, 
				license.createdAt
			);

			if (!isCryptographicValid) {
				return res.json({ 
					valid: false, 
					reason: 'Invalid license code for this email address' 
				});
			}

			// Check of e-mail overeenkomt
			if (license.customerEmail.toLowerCase() !== customerEmail.toLowerCase()) {
				return res.json({ 
					valid: false, 
					reason: 'License code does not match this email address' 
				});
			}
		}

		// Check e-mail verificatie status
		if (license.requiresEmailVerification && !license.emailVerifiedAt) {
			// Rate limiting: check of er recent al een verificatie e-mail is verzonden
			const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
			if (license.verificationExpiresAt && license.verificationExpiresAt > fiveMinutesAgo) {
				return res.json({ 
					valid: false, 
					reason: 'Email verification required',
					requiresVerification: true,
					licenseId: license.id,
					message: 'Verification email already sent. Please check your inbox or wait 5 minutes before requesting a new one.'
				});
			}

			// Genereer nieuwe verificatie token (5 minuten geldig)
			const verificationToken = generateVerificationToken();
			const verificationExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minuten

			await prisma.license.update({
				where: { id: license.id },
				data: {
					verificationToken,
					verificationExpiresAt
				}
			});

			// Verstuur verificatie e-mail
			try {
				const appName = (await getSetting('APP_NAME')) || 'License Server';
				const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-license/${verificationToken}`;
				
				const template = (await getSetting('EMAIL_TEMPLATE_VERIFICATION')) ||
					`<p>Beste {{customer_name}},</p>
<p>Er is een verzoek gedaan om uw licentie te verifiëren.</p>
<p><b>Code:</b> {{license_code}}<br/>
<b>Type:</b> {{license_type}}<br/>
<b>Domein:</b> {{domain}}</p>
<p>Klik op de onderstaande link om uw licentie te verifiëren:</p>
<p><a href="{{verification_url}}">Verificeer Licentie</a></p>
<p>Deze link is 5 minuten geldig.</p>
<p>Groet,<br/>${appName}</p>`;

				const html = template
					.replaceAll('{{customer_name}}', license.customerName)
					.replaceAll('{{license_code}}', license.code)
					.replaceAll('{{license_type}}', license.type.name)
					.replaceAll('{{domain}}', license.domain)
					.replaceAll('{{verification_url}}', verificationUrl);

				await sendMail({ 
					to: license.customerEmail, 
					subject: `Verificeer uw licentie - ${appName}`, 
					html 
				});

				logger.info(`Verification email sent to ${license.customerEmail} for license ${license.code}`);
			} catch (error) {
				logger.error(`Failed to send verification email: ${error}`);
			}

			return res.json({ 
				valid: false, 
				reason: 'Email verification required',
				requiresVerification: true,
				licenseId: license.id,
				message: 'Verification email sent'
			});
		}

		// Als e-mail verificatie niet vereist is OF al geverifieerd is, toon licentie informatie
		// Check licentie status
		if (license.status !== 'ACTIVE') {
			return res.json({ 
				valid: false, 
				reason: `License is ${license.status.toLowerCase()}` 
			});
		}

		// Check vervaldatum
		if (license.expiresAt && license.expiresAt < new Date()) {
			return res.json({ 
				valid: false, 
				reason: 'License has expired' 
			});
		}

		// Update laatste API toegang
		await prisma.license.update({
			where: { id: license.id },
			data: { lastApiAccessAt: new Date() }
		});

		return res.json({
			valid: true,
			license: {
				id: license.id,
				code: license.code,
				customerName: license.customerName,
				customerEmail: license.customerEmail,
				domain: license.domain,
				type: license.type.name,
				status: license.status,
				expiresAt: license.expiresAt,
				isCryptographic: license.isCryptographic,
				requiresEmailVerification: license.requiresEmailVerification,
				emailVerifiedAt: license.emailVerifiedAt
			}
		});

	} catch (error) {
		logger.error(`License verification error: ${error}`);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// E-mail verificatie endpoint
router.post('/verify-email/:token', async (req, res) => {
	const { token } = req.params;

	try {
		const license = await prisma.license.findFirst({
			where: { 
				verificationToken: token,
				verificationExpiresAt: { gt: new Date() }
			},
			include: { type: true }
		});

		if (!license) {
			return res.status(400).json({ error: 'Invalid or expired verification token' });
		}

		// Markeer e-mail als geverifieerd (verander de licentie status NIET)
		await prisma.license.update({
			where: { id: license.id },
			data: {
				emailVerifiedAt: new Date(),
				verificationToken: null,
				verificationExpiresAt: null
			}
		});

		return res.json({
			success: true,
			message: 'Email verified successfully. You can now verify your license.',
			license: {
				id: license.id,
				code: license.code,
				customerName: license.customerName,
				customerEmail: license.customerEmail,
				domain: license.domain,
				type: license.type.name,
				status: license.status,
				expiresAt: license.expiresAt
			}
		});

	} catch (error) {
		logger.error(`Email verification error: ${error}`);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Resend verification email
router.post('/resend-verification/:id', requireAuth, requireRole(['SUPER_ADMIN', 'SUB_ADMIN']), async (req, res) => {
	const { id } = req.params;

	try {
		const license = await prisma.license.findUnique({
			where: { id },
			include: { type: true }
		});

		if (!license) {
			return res.status(404).json({ error: 'License not found' });
		}

		if (!license.requiresEmailVerification) {
			return res.status(400).json({ error: 'License does not require email verification' });
		}

		if (license.emailVerifiedAt) {
			return res.status(400).json({ error: 'Email already verified' });
		}

		// Rate limiting: check of er recent al een verificatie e-mail is verzonden
		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
		if (license.verificationExpiresAt && license.verificationExpiresAt > fiveMinutesAgo) {
			return res.status(429).json({ 
				error: 'Please wait 5 minutes before requesting a new verification email' 
			});
		}

		// Genereer nieuwe verificatie token (5 minuten geldig)
		const verificationToken = generateVerificationToken();
		const verificationExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minuten

		await prisma.license.update({
			where: { id },
			data: {
				verificationToken,
				verificationExpiresAt
			}
		});

		// Verstuur verificatie e-mail
		const appName = (await getSetting('APP_NAME')) || 'License Server';
		const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-license/${verificationToken}`;
		
		const template = (await getSetting('EMAIL_TEMPLATE_VERIFICATION')) ||
			`<p>Beste {{customer_name}},</p>
<p>Er is een verzoek gedaan om uw licentie te verifiëren.</p>
<p><b>Code:</b> {{license_code}}<br/>
<b>Type:</b> {{license_type}}<br/>
<b>Domein:</b> {{domain}}</p>
<p>Klik op de onderstaande link om uw licentie te verifiëren:</p>
<p><a href="{{verification_url}}">Verificeer Licentie</a></p>
<p>Deze link is 5 minuten geldig.</p>
<p>Groet,<br/>${appName}</p>`;

		const html = template
			.replaceAll('{{customer_name}}', license.customerName)
			.replaceAll('{{license_code}}', license.code)
			.replaceAll('{{license_type}}', license.type.name)
			.replaceAll('{{domain}}', license.domain)
			.replaceAll('{{verification_url}}', verificationUrl);

		await sendMail({ 
			to: license.customerEmail, 
			subject: `Verificeer uw licentie - ${appName}`, 
			html 
		});

		res.json({ success: true, message: 'Verification email sent' });

	} catch (error) {
		logger.error(`Resend verification error: ${error}`);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Update licentie (inclusief nieuwe opties)
router.put('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'SUB_ADMIN']), async (req, res) => {
	const { id } = req.params;
	const {
		customerName,
		customerEmail,
		customerNumber,
		domain,
		typeId,
		status,
		notes,
		priceCents,
		priceInterval,
		expiresAt,
		requiresEmailVerification,
	} = req.body ?? {};

	try {
		const license = await prisma.license.findUnique({ where: { id } });
		if (!license) {
			return res.status(404).json({ error: 'License not found' });
		}

		const updateData: any = {
			customerName,
			customerEmail,
			customerNumber,
			domain,
			typeId,
			status,
			notes,
			priceCents,
			priceInterval,
			expiresAt: expiresAt ? new Date(expiresAt) : null,
		};

		// Als e-mail verificatie wordt ingeschakeld en nog niet geverifieerd
		if (requiresEmailVerification && !license.emailVerifiedAt) {
			updateData.requiresEmailVerification = true;
			updateData.verificationToken = generateVerificationToken();
			updateData.verificationExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minuten
		}

		const updatedLicense = await prisma.license.update({
			where: { id },
			data: updateData,
			include: { type: true }
		});

		// Verstuur verificatie e-mail als deze wordt ingeschakeld
		if (requiresEmailVerification && !license.emailVerifiedAt) {
			try {
				const appName = (await getSetting('APP_NAME')) || 'License Server';
				const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-license/${updatedLicense.verificationToken}`;
				
				const template = (await getSetting('EMAIL_TEMPLATE_VERIFICATION')) ||
					`<p>Beste {{customer_name}},</p>
<p>Er is een verzoek gedaan om uw licentie te verifiëren.</p>
<p><b>Code:</b> {{license_code}}<br/>
<b>Type:</b> {{license_type}}<br/>
<b>Domein:</b> {{domain}}</p>
<p>Klik op de onderstaande link om uw licentie te verifiëren:</p>
<p><a href="{{verification_url}}">Verificeer Licentie</a></p>
<p>Deze link is 5 minuten geldig.</p>
<p>Groet,<br/>${appName}</p>`;

				const html = template
					.replaceAll('{{customer_name}}', updatedLicense.customerName)
					.replaceAll('{{license_code}}', updatedLicense.code)
					.replaceAll('{{license_type}}', updatedLicense.type.name)
					.replaceAll('{{domain}}', updatedLicense.domain)
					.replaceAll('{{verification_url}}', verificationUrl);

				await sendMail({ 
					to: updatedLicense.customerEmail, 
					subject: `Verificeer uw licentie - ${appName}`, 
					html 
				});
			} catch (error) {
				logger.error(`Failed to send verification email: ${error}`);
			}
		}

		res.json(updatedLicense);
	} catch (error) {
		logger.error(`Update license error: ${error}`);
		res.status(500).json({ error: 'Internal server error' });
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
