import { createContext, useContext, useMemo, useState, ReactNode, useEffect } from 'react';

export type Lang = 'nl' | 'en';

type I18nCtx = { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string };

const I18nContext = createContext<I18nCtx | null>(null);

const dict: Record<Lang, Record<string, string>> = {
  nl: {
    'app.name': 'License Server',
    'nav.dashboard': 'Dashboard',
    'nav.licenses': 'Licenties',
    'nav.types': 'Types',
    'nav.terms': 'Voorwaarden',
    'nav.settings': 'Instellingen',
    'nav.users': 'Gebruikers',

    'common.loading': 'Laden…',
    'common.save': 'Opslaan',
    'common.cancel': 'Annuleren',
    'common.delete': 'Verwijderen',
    'common.edit': 'Bewerken',
    'common.add': 'Toevoegen',

    'dash.active': 'Actief',
    'dash.inactive': 'Inactief',
    'dash.expired': 'Verlopen',
    'dash.total': 'Totaal',
    'dash.monthlyRevenue': 'Maandinkomsten (actief)',
    'dash.yearlyRevenue': 'Jaarinkomsten (actief)',
    'dash.oneTimeThisYear': 'Eenmalig dit jaar',
    'dash.recentApi': 'Laatste API opvragingen',

    'licenses.search': 'Zoeken…',
    'licenses.status': 'Status',
    'licenses.type': 'Type',
    'licenses.pageSize': 'Per pagina',
    'licenses.new': 'Nieuwe licentie',
    'licenses.prev': 'Vorige',
    'licenses.next': 'Volgende',

    'licenses.code': 'Code',
    'licenses.customerName': 'Klantnaam',
    'licenses.customerEmail': 'E-mail',
    'licenses.customerNumber': 'Klantnr',
    'licenses.domain': 'Domein',
    'licenses.statusCol': 'Status',
    'licenses.priceCents': 'Prijs',
    'licenses.priceInterval': 'Interval',
    'licenses.expiresAt': 'Vervaldatum',
    'licenses.lastApiAccessAt': 'Laatste API',
    'licenses.createdAt': 'Aangemaakt',

    'edit.title.new': 'Nieuwe licentie',
    'edit.title.edit': 'Licentie bewerken',
    'edit.code': 'Code',
    'edit.customerName': 'Klantnaam',
    'edit.customerEmail': 'E-mail',
    'edit.customerNumber': 'Klantnummer',
    'edit.domain': 'Domein',
    'edit.type': 'Type',
    'edit.status': 'Status',
    'edit.interval': 'Interval',
    'edit.price': 'Prijs (€)',
    'edit.expiresAt': 'Vervaldatum',
    'edit.sendEmail': 'E-mail direct naar klant',
    'edit.notes': 'Notities',

    'types.newPlaceholder': 'Nieuw type…',
    'types.count': 'Aantal licenties',

    'terms.new': 'Nieuwe versie',
    'terms.slug': 'Slug',
    'terms.title': 'Titel',
    'terms.published': 'Gepubliceerd',
    'terms.wysiwyg': 'WYSIWYG',
    'terms.publish': 'Nieuwe versie publiceren',
    'terms.list': 'Versies',
    'terms.lastUpdated': 'Laatst gewijzigd',

    'settings.general': 'Algemeen',
    'settings.appName': 'Applicatienaam',
    'settings.smtp': 'SMTP',
    'settings.host': 'Host',
    'settings.port': 'Port',
    'settings.secure': 'Secure',
    'settings.user': 'User',
    'settings.pass': 'Pass',
    'settings.from': 'From',
    'settings.testEmailTo': 'Test e-mail naar…',
    'settings.sendTest': 'Stuur testmail',
    'settings.template': 'E-mail template voor licentie',
    'settings.placeholders': 'Placeholders',

    'users.create': 'Aanmaken',

    'login.title': 'Inloggen',
    'login.forgot': 'Wachtwoord vergeten?',
    'login.sent': 'Als het e-mailadres bestaat, is er een reset link verstuurd.',

    'setup.title': 'Eerste super-admin aanmaken',
    'setup.create': 'Aanmaken',
  },
  en: {
    'app.name': 'License Server',
    'nav.dashboard': 'Dashboard',
    'nav.licenses': 'Licenses',
    'nav.types': 'Types',
    'nav.terms': 'Terms',
    'nav.settings': 'Settings',
    'nav.users': 'Users',

    'common.loading': 'Loading…',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',

    'dash.active': 'Active',
    'dash.inactive': 'Inactive',
    'dash.expired': 'Expired',
    'dash.total': 'Total',
    'dash.monthlyRevenue': 'Monthly revenue (active)',
    'dash.yearlyRevenue': 'Yearly revenue (active)',
    'dash.oneTimeThisYear': 'One-time this year',
    'dash.recentApi': 'Recent API requests',

    'licenses.search': 'Search…',
    'licenses.status': 'Status',
    'licenses.type': 'Type',
    'licenses.pageSize': 'Per page',
    'licenses.new': 'New license',
    'licenses.prev': 'Previous',
    'licenses.next': 'Next',

    'licenses.code': 'Code',
    'licenses.customerName': 'Customer name',
    'licenses.customerEmail': 'Email',
    'licenses.customerNumber': 'Customer #',
    'licenses.domain': 'Domain',
    'licenses.statusCol': 'Status',
    'licenses.priceCents': 'Price',
    'licenses.priceInterval': 'Interval',
    'licenses.expiresAt': 'Expires at',
    'licenses.lastApiAccessAt': 'Last API',
    'licenses.createdAt': 'Created at',

    'edit.title.new': 'New license',
    'edit.title.edit': 'Edit license',
    'edit.code': 'Code',
    'edit.customerName': 'Customer name',
    'edit.customerEmail': 'Email',
    'edit.customerNumber': 'Customer number',
    'edit.domain': 'Domain',
    'edit.type': 'Type',
    'edit.status': 'Status',
    'edit.interval': 'Interval',
    'edit.price': 'Price (€)',
    'edit.expiresAt': 'Expires at',
    'edit.sendEmail': 'Email to customer',
    'edit.notes': 'Notes',

    'types.newPlaceholder': 'New type…',
    'types.count': 'License count',

    'terms.new': 'New version',
    'terms.slug': 'Slug',
    'terms.title': 'Title',
    'terms.published': 'Published',
    'terms.wysiwyg': 'WYSIWYG',
    'terms.publish': 'Publish new version',
    'terms.list': 'Versions',
    'terms.lastUpdated': 'Last updated',

    'settings.general': 'General',
    'settings.appName': 'Application name',
    'settings.smtp': 'SMTP',
    'settings.host': 'Host',
    'settings.port': 'Port',
    'settings.secure': 'Secure',
    'settings.user': 'User',
    'settings.pass': 'Pass',
    'settings.from': 'From',
    'settings.testEmailTo': 'Send test email to…',
    'settings.sendTest': 'Send test',
    'settings.template': 'Email template for license',
    'settings.placeholders': 'Placeholders',

    'users.create': 'Create',

    'login.title': 'Login',
    'login.forgot': 'Forgot password?',
    'login.sent': 'If the email exists, a reset link was sent.',

    'setup.title': 'Create first super admin',
    'setup.create': 'Create',
  },
};

export function I18nProvider({ children }: { children: ReactNode }){
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) || 'nl');
  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);
  const value = useMemo(() => ({ lang, setLang, t: (k: string) => dict[lang][k] ?? k }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(){
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('I18nProvider missing');
  return ctx;
}
