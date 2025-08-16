import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { getJwtSecret, generateNewJwtSecret, setJwtSecret } from '../utils/jwt';
import CryptoJS from 'crypto-js';
import archiver from 'archiver';
import unzipper from 'unzipper';
import fs from 'fs';
import path from 'path';

const router = Router();



router.get('/initialized', async (_req, res) => {
	const count = await prisma.user.count();
	res.json({ initialized: count > 0 });
});

router.get('/verify', requireAuth, async (req, res) => {
	// If we get here, the token is valid (requireAuth middleware passed)
	res.json({ ok: true, user: req.user });
});

// JWT Secret management endpoints (super admin only)
router.get('/jwt-secret', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
	const currentSecret = getJwtSecret();
	const isFromEnv = Boolean(process.env.JWT_SECRET && 
		process.env.JWT_SECRET !== 'change_me' && 
		process.env.JWT_SECRET !== 'your-super-secret-jwt-key-here-change-this-in-production');
	
	res.json({ 
		secret: currentSecret,
		isFromEnv,
		isGenerated: !isFromEnv
	});
});

router.post('/jwt-secret/regenerate', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
	const newSecret = generateNewJwtSecret();
	console.log('🔐 Regenerated JWT secret by super admin');
	res.json({ 
		secret: newSecret,
		message: 'JWT secret regenerated successfully. All existing tokens will be invalidated.'
	});
});

router.post('/jwt-secret/set', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
	const { secret } = req.body;
	if (!secret || typeof secret !== 'string' || secret.length < 32) {
		return res.status(400).json({ error: 'Invalid secret. Must be at least 32 characters long.' });
	}
	
	setJwtSecret(secret);
	console.log('🔐 JWT secret set by super admin');
	res.json({ 
		secret: getJwtSecret(),
		message: 'JWT secret updated successfully. All existing tokens will be invalidated.'
	});
});

// Backup/Restore endpoints
router.get('/backup', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
	const { securityLevel, dataTypes, encryptionKey } = req.query;
	
	try {
		const backup: any = {
			version: '2.0',
			createdAt: new Date().toISOString(),
			securityLevel: securityLevel || 'medium',
			data: {}
		};

		// Determine which data types to include
		const types = dataTypes ? (Array.isArray(dataTypes) ? dataTypes : [dataTypes]) : ['all'];
		const includeAll = types.includes('all');

		if (includeAll || types.includes('users')) {
			backup.data.users = await prisma.user.findMany({
				select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true }
			});
		}

		if (includeAll || types.includes('licenseTypes')) {
			backup.data.licenseTypes = await prisma.licenseType.findMany();
		}

		if (includeAll || types.includes('licenses')) {
			backup.data.licenses = await prisma.license.findMany({
				include: { type: true }
			});
		}

		if (includeAll || types.includes('terms')) {
			backup.data.terms = await prisma.termsOfService.findMany();
		}

		if (includeAll || types.includes('settings')) {
			backup.data.settings = await prisma.setting.findMany();
		}

		// Handle JWT secret based on security level
		if (securityLevel === 'insecure') {
			// Most insecure: include JWT secret in backup
			backup.jwtSecret = getJwtSecret();
			backup.jwtSecretWarning = '⚠️ This backup contains the JWT secret. Keep it secure!';
		} else if (securityLevel === 'secure') {
			// Secure: encrypt backup with JWT secret itself
			const jwtSecret = getJwtSecret();
			backup.jwtSecret = jwtSecret;
			backup.jwtSecretWarning = '🔐 Backup is encrypted with the JWT secret. Keep this secret safe!';
		}

		// Create temporary files
		const tempDir = path.join(__dirname, '../../temp');
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		const backupId = Date.now().toString();
		const jsonPath = path.join(tempDir, `backup-${backupId}.json`);
		const zipPath = path.join(tempDir, `backup-${backupId}.zip`);

		// Write JSON backup
		fs.writeFileSync(jsonPath, JSON.stringify(backup, null, 2));

		// Create ZIP archive
		const archive = archiver('zip', { zlib: { level: 9 } });
		const output = fs.createWriteStream(zipPath);

		archive.pipe(output);

		if (securityLevel === 'secure') {
			// Encrypt the JSON content with JWT secret
			const jsonContent = fs.readFileSync(jsonPath, 'utf8');
			const encrypted = CryptoJS.AES.encrypt(jsonContent, backup.jwtSecret).toString();
			
			// Add encrypted content to ZIP
			archive.append(encrypted, { name: 'backup.encrypted' });
		} else {
			// Add plain JSON to ZIP
			archive.file(jsonPath, { name: 'backup.json' });
		}

		await archive.finalize();

		// Wait for ZIP to be written
		await new Promise<void>((resolve, reject) => {
			output.on('close', () => resolve());
			output.on('error', reject);
		});

		// Send ZIP file
		res.setHeader('Content-Type', 'application/zip');
		res.setHeader('Content-Disposition', `attachment; filename="license-server-backup-${new Date().toISOString().split('T')[0]}.zip"`);
		
		const zipStream = fs.createReadStream(zipPath);
		zipStream.pipe(res);

		// Clean up temporary files after sending
		zipStream.on('end', () => {
			fs.unlinkSync(jsonPath);
			fs.unlinkSync(zipPath);
		});
		
	} catch (error) {
		console.error('Backup error:', error);
		res.status(500).json({ error: 'Failed to create backup' });
	}
});

router.post('/restore/analyze', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
	try {
		const { backup, encryptionKey } = req.body;
		
		if (!backup || typeof backup !== 'object') {
			return res.status(400).json({ error: 'Invalid backup file' });
		}

		const analysis = {
			version: backup.version || 'unknown',
			createdAt: backup.createdAt || 'unknown',
			securityLevel: backup.securityLevel || 'unknown',
			hasJwtSecret: Boolean(backup.jwtSecret),
			isEncrypted: backup.securityLevel === 'secure',
			needsEncryptionKey: backup.securityLevel === 'secure' && !encryptionKey,
			dataTypes: {
				users: { count: backup.data?.users?.length || 0, exists: Boolean(backup.data?.users) },
				licenseTypes: { count: backup.data?.licenseTypes?.length || 0, exists: Boolean(backup.data?.licenseTypes) },
				licenses: { count: backup.data?.licenses?.length || 0, exists: Boolean(backup.data?.licenses) },
				terms: { count: backup.data?.terms?.length || 0, exists: Boolean(backup.data?.terms) },
				settings: { count: backup.data?.settings?.length || 0, exists: Boolean(backup.data?.settings) }
			},
			dependencies: {
				licensesNeedLicenseTypes: Boolean(backup.data?.licenses && !backup.data?.licenseTypes),
				licensesNeedUsers: Boolean(backup.data?.licenses && !backup.data?.users)
			}
		};

		res.json(analysis);
		
	} catch (error) {
		console.error('Restore analysis error:', error);
		res.status(500).json({ error: 'Failed to analyze backup' });
	}
});

router.post('/restore', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
	const { backup, dataTypes, useJwtSecret, encryptionKey } = req.body;
	
	try {
		if (!backup || !dataTypes || !Array.isArray(dataTypes)) {
			return res.status(400).json({ error: 'Invalid restore parameters' });
		}

		// Use JWT secret from backup if requested
		if (useJwtSecret && backup.jwtSecret) {
			setJwtSecret(backup.jwtSecret);
			console.log('🔐 Using JWT secret from backup');
		}

		const includeAll = dataTypes.includes('all');

		// Restore data in dependency order
		if (includeAll || dataTypes.includes('users')) {
			if (backup.data?.users) {
				await prisma.user.deleteMany();
				await prisma.user.createMany({ data: backup.data.users });
				console.log(`📊 Restored ${backup.data.users.length} users`);
			}
		}

		if (includeAll || dataTypes.includes('licenseTypes')) {
			if (backup.data?.licenseTypes) {
				await prisma.licenseType.deleteMany();
				await prisma.licenseType.createMany({ data: backup.data.licenseTypes });
				console.log(`📊 Restored ${backup.data.licenseTypes.length} license types`);
			}
		}

		if (includeAll || dataTypes.includes('licenses')) {
			if (backup.data?.licenses) {
				await prisma.license.deleteMany();
				await prisma.license.createMany({ data: backup.data.licenses });
				console.log(`📊 Restored ${backup.data.licenses.length} licenses`);
			}
		}

		if (includeAll || dataTypes.includes('terms')) {
			if (backup.data?.terms) {
				await prisma.termsOfService.deleteMany();
				await prisma.termsOfService.createMany({ data: backup.data.terms });
				console.log(`📊 Restored ${backup.data.terms.length} terms`);
			}
		}

		if (includeAll || dataTypes.includes('settings')) {
			if (backup.data?.settings) {
				await prisma.setting.deleteMany();
				await prisma.setting.createMany({ data: backup.data.settings });
				console.log(`📊 Restored ${backup.data.settings.length} settings`);
			}
		}

		res.json({ 
			message: 'Restore completed successfully',
			restoredTypes: dataTypes,
			jwtSecretUsed: Boolean(useJwtSecret && backup.jwtSecret),
			securityLevel: backup.securityLevel
		});
		
	} catch (error) {
		console.error('Restore error:', error);
		res.status(500).json({ error: 'Failed to restore backup' });
	}
});

// Upload and process ZIP backup
router.post('/restore/upload', requireAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
	try {
		if (!req.files || !req.files.backup) {
			return res.status(400).json({ error: 'No backup file uploaded' });
		}

		const uploadedFile = req.files.backup as any;
		const { encryptionKey } = req.body;

		// Create temporary directory
		const tempDir = path.join(__dirname, '../../temp');
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		const extractDir = path.join(tempDir, `extract-${Date.now()}`);
		fs.mkdirSync(extractDir, { recursive: true });

		// Save uploaded file
		const zipPath = path.join(extractDir, 'backup.zip');
		await uploadedFile.mv(zipPath);

		// Extract ZIP
		await new Promise((resolve, reject) => {
			fs.createReadStream(zipPath)
				.pipe(unzipper.Extract({ path: extractDir }))
				.on('close', resolve)
				.on('error', reject);
		});

		let backup: any = null;
		let jwtSecret: string | null = null;

		// Check for encrypted backup
		const encryptedPath = path.join(extractDir, 'backup.encrypted');
		const jsonPath = path.join(extractDir, 'backup.json');
		const jwtSecretPath = path.join(extractDir, 'jwt-secret.txt');

		if (fs.existsSync(encryptedPath)) {
			// Handle encrypted backup
			if (!encryptionKey) {
				// Clean up
				fs.rmSync(extractDir, { recursive: true, force: true });
				return res.status(400).json({ error: 'JWT secret required to decrypt this backup' });
			}

			const encryptedContent = fs.readFileSync(encryptedPath, 'utf8');
			try {
				const decrypted = CryptoJS.AES.decrypt(encryptedContent, encryptionKey).toString(CryptoJS.enc.Utf8);
				backup = JSON.parse(decrypted);
			} catch (error) {
				// Clean up
				fs.rmSync(extractDir, { recursive: true, force: true });
				return res.status(400).json({ error: 'Invalid JWT secret for decryption' });
			}
		} else if (fs.existsSync(jsonPath)) {
			// Handle plain JSON backup
			const jsonContent = fs.readFileSync(jsonPath, 'utf8');
			backup = JSON.parse(jsonContent);
		} else {
			// Clean up
			fs.rmSync(extractDir, { recursive: true, force: true });
			return res.status(400).json({ error: 'Invalid backup file format' });
		}

		// Clean up temporary files
		fs.rmSync(extractDir, { recursive: true, force: true });

		// If JWT secret was found separately, add it to backup
		if (jwtSecret && !backup.jwtSecret) {
			backup.jwtSecret = jwtSecret;
		}

		res.json({ backup });
		
	} catch (error) {
		console.error('Upload error:', error);
		res.status(500).json({ error: 'Failed to process backup file' });
	}
});

router.post('/setup', async (req, res) => {
	const { name, email, password, existingJwtSecret } = req.body ?? {};
	const existing = await prisma.user.findFirst();
	if (existing) return res.status(400).json({ error: 'Already initialized' });
	if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
	
	// If existing JWT secret is provided, use it instead of generating new one
	if (existingJwtSecret && typeof existingJwtSecret === 'string' && existingJwtSecret.length >= 32) {
		setJwtSecret(existingJwtSecret);
		console.log('🔐 Using existing JWT secret for setup');
	} else {
		console.log('🔐 Generated new JWT secret for fresh installation');
	}
	
	const passwordHash = await bcrypt.hash(password, 10);
	const user = await prisma.user.create({ data: { name, email, passwordHash, role: 'SUPER_ADMIN' } });
	const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, getJwtSecret(), { expiresIn: '12h' });
	res.json({ token });
});

router.post('/login', async (req, res) => {
	const { email, password } = req.body ?? {};
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) return res.status(401).json({ error: 'Invalid credentials' });
	const ok = await bcrypt.compare(password, user.passwordHash);
	if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

	const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, getJwtSecret(), { expiresIn: '12h' });
	res.json({ token });
});

// Re-authentication endpoint for sensitive operations
router.post('/reauth', requireAuth, async (req, res) => {
	const { password } = req.body ?? {};
	if (!password) return res.status(400).json({ error: 'Password required' });

	try {
		const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
		if (!user) return res.status(401).json({ error: 'User not found' });

		const ok = await bcrypt.compare(password, user.passwordHash);
		if (!ok) return res.status(401).json({ error: 'Invalid password' });

		res.json({ ok: true });
	} catch (error) {
		console.error('Re-auth error:', error);
		res.status(500).json({ error: 'Authentication failed' });
	}
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
