import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fileUpload from 'express-fileupload';
import { prisma } from './lib/prisma';
import authRoutes from './routes/auth';
import licenseRoutes from './routes/licenses';
import licenseTypeRoutes from './routes/licenseTypes';
import settingsRoutes from './routes/settings';
import termsRoutes from './routes/terms';
import dashboardRoutes from './routes/dashboard';
import logger from './utils/logger';

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(fileUpload({
	limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
	useTempFiles: true,
	tempFileDir: '/tmp/'
}));

// Basic request logging
app.use((req, res, next) => {
	const start = Date.now();
	res.on('finish', () => {
		const durationMs = Date.now() - start;
		logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
	});
	next();
});

app.get('/health', async (_req, res) => {
	try {
		await prisma.$queryRaw`SELECT 1`;
		res.json({ ok: true });
	} catch (e) {
		logger.error(`Health check failed: ${e instanceof Error ? e.message : String(e)}`);
		res.status(500).json({ ok: false });
	}
});

// Welcome page for root URL
app.get('/', (_req, res) => {
	const apiInfo = {
		message: 'De backend draait! 🚀',
		version: '1.0.0',
		status: 'online',
		documentation: 'Voor meer informatie, bekijk de frontend op http://localhost:5173'
	};
	
	res.json(apiInfo);
});

app.use('/auth', authRoutes);
app.use('/licenses', licenseRoutes);
app.use('/license-types', licenseTypeRoutes);
app.use('/settings', settingsRoutes);
app.use('/terms', termsRoutes);
app.use('/dashboard', dashboardRoutes);

app.use((req, res) => {
	res.status(404).json({ 
		error: 'Endpoint niet gevonden',
		message: `De endpoint ${req.method} ${req.originalUrl} bestaat niet`,
		suggestion: 'Bezoek GET / voor een overzicht van alle beschikbare endpoints',
		availableEndpoints: [
			'GET /',
			'GET /health',
			'POST /auth/login',
			'GET /dashboard',
			'GET /licenses',
			'GET /license-types',
			'GET /terms',
			'GET /settings',
			'GET /users'
		]
	});
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
	logger.error(`Unhandled error: ${message}`);
	res.status(500).json({ error: 'Internal Server Error' });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
	logger.info(`License Server API listening on http://localhost:${port}`);
});

process.on('uncaughtException', (err) => {
	logger.error(`Uncaught exception: ${err.stack || (err as any).message}`);
});

process.on('unhandledRejection', (reason) => {
	logger.error(
		`Unhandled rejection: ${reason instanceof Error ? reason.stack || reason.message : String(reason)}`
	);
});
