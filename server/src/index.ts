import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { prisma } from './lib/prisma';
import authRoutes from './routes/auth';
import licenseRoutes from './routes/licenses';
import licenseTypeRoutes from './routes/licenseTypes';
import settingsRoutes from './routes/settings';
import termsRoutes from './routes/terms';
import dashboardRoutes from './routes/dashboard';

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', async (_req, res) => {
	try {
		await prisma.$queryRaw`SELECT 1`;
		res.json({ ok: true });
	} catch (e) {
		res.status(500).json({ ok: false });
	}
});

app.use('/auth', authRoutes);
app.use('/licenses', licenseRoutes);
app.use('/license-types', licenseTypeRoutes);
app.use('/settings', settingsRoutes);
app.use('/terms', termsRoutes);
app.use('/dashboard', dashboardRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
	console.log(`License Server API listening on http://localhost:${port}`);
});
