# License Server v1

Een complete license management applicatie met backend API en frontend interface.

## Quick Start

### Eerste keer setup (nieuwe PC)
```bash
# 1. Clone de repository
git clone <repository-url>
cd license-server-v1

# 2. Optie A: Gebruik het automatische setup script (aanbevolen)
./start.sh

# 2. Optie B: Handmatige setup
npm run setup
```

### Normale start (na setup)
```bash
# Start beide servers (backend + frontend)
npm start
```

### Snelle troubleshooting
```bash
# Als er problemen zijn, probeer dit:
npm run setup:env  # Maakt .env bestand aan
npm run setup      # Volledige setup opnieuw
```

## Server URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000

## Development

### Individuele servers starten
```bash
# Alleen backend in development mode
npm run dev:server

# Alleen frontend in development mode  
npm run dev:web

# Beide in development mode
npm run dev
```

### Database setup
```bash
# Genereer Prisma client
cd server && npx prisma generate

# Run database migrations
cd server && npx prisma migrate dev
```

## Project Structuur
```
license-server-v1/
├── server/          # Backend API (Node.js + Express + Prisma)
├── web/            # Frontend (React + Vite + TypeScript)
└── package.json    # Root scripts voor beide servers
```

## Troubleshooting

### Backend start niet
1. Controleer of je in de juiste directory bent: `cd server`
2. Controleer of `.env` bestand bestaat: `ls -la .env`
3. Als `.env` niet bestaat: `npm run setup:env` (vanuit root directory)
4. Installeer dependencies: `npm install`
5. Run database setup: `npx prisma generate && npx prisma migrate dev`
6. Build de applicatie: `npm run build`
7. Start de server: `npm start`

### Frontend start niet
1. Controleer of je in de juiste directory bent: `cd web`
2. Installeer dependencies: `npm install`
3. Start de development server: `npm run dev`

### Database problemen
1. Controleer of `.env` bestand bestaat met `DATABASE_URL`
2. Run migrations: `cd server && npx prisma migrate dev`
3. Genereer Prisma client: `cd server && npx prisma generate`

### Environment variables
- Het systeem genereert automatisch een veilige `JWT_SECRET` bij eerste setup
- Voor productie: voeg `JWT_SECRET` toe aan `.env` voor consistentie
- Voor SMTP: vul de e-mail instellingen in
