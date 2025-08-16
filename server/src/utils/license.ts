import crypto from 'crypto';
import { getJwtSecret } from './jwt';

export const generateLicenseCode = (): string => {
	const block = () => Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
	return `innodigi-${block()}-${block()}`;
};

export const generateCryptographicLicenseCode = (customerEmail: string, createdAt: Date): string => {
	// Gebruik JWT secret voor deterministische generatie
	const jwtSecret = getJwtSecret();
	const data = `${customerEmail.toLowerCase()}-${createdAt.getTime()}-${jwtSecret}`;
	const hash = crypto.createHash('sha256').update(data).digest('hex');
	
	// Converteer naar hetzelfde formaat als random sleutels
	const block1 = hash.substring(0, 16).toUpperCase();
	const block2 = hash.substring(16, 32).toUpperCase();
	
	return `innodigi-${block1}-${block2}`;
};

export const verifyCryptographicLicenseCode = (licenseCode: string, customerEmail: string, createdAt: Date): boolean => {
	const expectedCode = generateCryptographicLicenseCode(customerEmail, createdAt);
	return licenseCode === expectedCode;
};

export const isWildcardDomain = (domain: string): boolean => domain.trim() === '*';

export const generateVerificationToken = (): string => {
	return crypto.randomBytes(32).toString('hex');
};

export const isLicenseCodeCryptographic = (licenseCode: string): boolean => {
	// Check of de sleutel deterministisch is gegenereerd
	// Dit is een vereenvoudigde check - in productie zou je dit beter kunnen implementeren
	return licenseCode.startsWith('innodigi-') && licenseCode.length === 35;
};
