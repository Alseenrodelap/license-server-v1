import crypto from 'crypto';

let generatedJwtSecret: string | null = null;

export const getJwtSecret = () => {
	// First check environment variable
	let jwtSecret = process.env.JWT_SECRET;
	
	// If no env var or it's a placeholder, use generated secret
	if (!jwtSecret || jwtSecret === 'change_me' || jwtSecret === 'your-super-secret-jwt-key-here-change-this-in-production') {
		if (!generatedJwtSecret) {
			generatedJwtSecret = crypto.randomBytes(64).toString('hex');
		}
		return generatedJwtSecret;
	}
	
	return jwtSecret;
};

export const generateNewJwtSecret = () => {
	generatedJwtSecret = crypto.randomBytes(64).toString('hex');
	return generatedJwtSecret;
};

export const setJwtSecret = (secret: string) => {
	generatedJwtSecret = secret;
};
