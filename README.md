# License Server v1

Moderne licentie-server met admin UI, API met rate limiting, e-mail via SMTP, WYSIWYG licentievoorwaarden met versies, en rolgebaseerde toegang (Super Admin, Sub Admin, Read Only). Frontend (React + Vite + Tailwind) en backend (Node.js + TypeScript + Express + Prisma/SQLite).

## Snel starten

1. Vereisten: Node 18+, npm, SQLite (meegeleverd via Prisma), macOS compatibel.
2. Omgeving klaarzetten:

```bash
cd server
cp .env.example .env
# Vul minimaal JWT_SECRET en (optioneel) SMTP waarden in
npm i
npx prisma generate
npx prisma migrate dev --name init
cd ../web
npm i
```

3. Starten:

```bash
# Terminal 1: backend
cd server
npm run dev

# Terminal 2: frontend
cd web
npm run dev
```

4. Bezoek de frontend op `http://localhost:5173`. Als er nog geen super-admin is, verschijnt de setup pagina.

## Belangrijke features

- Licenties aanmaken/bewerken/verwijderen, zoek/sort/filter/pagineren.
- Automatische licentiecode generator (formaat: `innodigi-XXXXXXXX-XXXXXXXX`).
- Prijs: eenmalig/maandelijks/jaarlijks, met statistieken op dashboard.
- API voor licentie verificatie met per-licentie rate limit (5x/uur).
- Licentievoorwaarden (WYSIWYG) met publieke URL en versies, plus laatste wijzigingsdatum.
- SMTP instellingen, testmail, en e-mailtemplate met placeholders (bijv. `{{license_code}}`).
- Gebruikersbeheer met rollen: Super Admin, Sub Admin, Read Only.
- Donkere/licht modus, i18n (NL/EN) met vlaggetjes.

## Omgeving (.env in `server/`)

Zie `.env.example`:
- JWT_SECRET
- PORT (optioneel, standaard 4000)
- DATABASE_URL (standaard SQLite)
- SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM (optioneel; kan ook via UI opgeslagen worden)
- FRONTEND_URL (voor wachtwoord reset link)

## Prisma

- SQLite database bestand: `server/prisma/dev.db`.
- Migraties en client: `npx prisma migrate dev`, `npx prisma generate`.

## Productie

- Zet een sterke `JWT_SECRET` en configureer SMTP.
- Overweeg Postgres i.p.v. SQLite. Pas `DATABASE_URL` aan en draai migraties opnieuw.
- Serven van frontend via reverse proxy; backend draait op `PORT`.

## Moneybird (toekomst)

- Koppeling wordt later toegevoegd; architectuur houdt hier rekening mee via services.
