export type Language = 'nl' | 'en';

export const t = (key: string, lang: Language): string => {
	const dict: Record<Language, Record<string, string>> = {
		en: {
			license_email_subject: 'Your license information',
			license_email_greeting: 'Hello',
			license_email_footer: 'Regards',
		},
		nl: {
			license_email_subject: 'Uw licentiegegevens',
			license_email_greeting: 'Hallo',
			license_email_footer: 'Met vriendelijke groet',
		},
	};
	return dict[lang][key] ?? key;
};
