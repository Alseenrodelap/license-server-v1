#!/bin/bash

echo "🚀 License Server v1 - Auto Setup & Start"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "server" ] || [ ! -d "web" ]; then
    echo "❌ Error: Please run this script from the root directory of the project"
    exit 1
fi

# Check if .env exists in server directory
if [ ! -f "server/.env" ]; then
    echo "⚠️  Warning: No .env file found in server directory"
    echo "📝 Creating basic .env file..."
    cat > server/.env << EOF
PORT=4000
DATABASE_URL="file:./dev.db"
FRONTEND_URL=http://localhost:5173
EOF
    echo "✅ Created server/.env file"
    echo "🔐 JWT_SECRET will be automatically generated on first setup"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && npm install && cd ..
fi

if [ ! -d "web/node_modules" ]; then
    echo "📦 Installing web dependencies..."
    cd web && npm install && cd ..
fi

# Generate Prisma client and run migrations
echo "🗄️  Setting up database..."
cd server && npx prisma generate && npx prisma migrate dev --name init && cd ..

# Build server
echo "🔨 Building server..."
cd server && npm run build && cd ..

echo "✅ Setup complete!"
echo ""
echo "🌐 Starting servers..."
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers
npm start
