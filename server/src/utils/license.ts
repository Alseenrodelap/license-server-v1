export const generateLicenseCode = (): string => {
	const block = () => Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
	return `innodigi-${block()}-${block()}`;
};

export const isWildcardDomain = (domain: string): boolean => domain.trim() === '*';
