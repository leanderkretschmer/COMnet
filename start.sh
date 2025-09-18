#!/bin/bash

# COMNet Start Script
# Startet alle Services für die dezentrale Social-Media-Plattform

echo "🚀 Starte COMNet - Dezentrale Social-Media-Plattform"
echo "=================================================="

# Prüfe ob Docker installiert ist
if ! command -v docker &> /dev/null; then
    echo "❌ Docker ist nicht installiert. Bitte installieren Sie Docker zuerst."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose ist nicht installiert. Bitte installieren Sie Docker Compose zuerst."
    exit 1
fi

# Erstelle .env Datei falls sie nicht existiert
if [ ! -f .env ]; then
    echo "📝 Erstelle .env Datei..."
    cat > .env << EOF
# COMNet Environment Variables
NODE_ENV=development
DATABASE_URL=postgresql://comnet:comnet_password@postgres:5432/comnet
REDIS_URL=redis://redis:6379
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=comnet
MINIO_SECRET_KEY=comnet_password
JWT_SECRET=your-super-secret-jwt-key-change-in-production
DEFAULT_NETWORK_ID=550e8400-e29b-41d4-a716-446655440000
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
    echo "✅ .env Datei erstellt"
fi

# Baue und starte alle Services
echo "🔨 Baue Docker Images..."
docker-compose build

echo "🚀 Starte Services..."
docker-compose up -d

# Warte auf Services
echo "⏳ Warte auf Services..."
sleep 10

# Prüfe Service-Status
echo "🔍 Prüfe Service-Status..."

# PostgreSQL
if docker-compose exec -T postgres pg_isready -U comnet > /dev/null 2>&1; then
    echo "✅ PostgreSQL ist bereit"
else
    echo "❌ PostgreSQL ist nicht bereit"
fi

# Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis ist bereit"
else
    echo "❌ Redis ist nicht bereit"
fi

# Backend
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend API ist bereit"
else
    echo "❌ Backend API ist nicht bereit"
fi

# Frontend
if curl -s http://localhost:8765 > /dev/null 2>&1; then
    echo "✅ Frontend ist bereit"
else
    echo "❌ Frontend ist nicht bereit"
fi

echo ""
echo "🎉 COMNet ist gestartet!"
echo "========================"
echo ""
echo "📱 Frontend: http://localhost:8765"
echo "🔧 Backend API: http://localhost:3001"
echo "🗄️  PostgreSQL: localhost:5432"
echo "💾 Redis: localhost:6379"
echo "📦 MinIO: http://localhost:9000 (admin: comnet/comnet_password)"
echo "🌐 MinIO Console: http://localhost:9001"
echo ""
echo "📊 Service-Status anzeigen: docker-compose ps"
echo "📋 Logs anzeigen: docker-compose logs -f"
echo "🛑 Services stoppen: docker-compose down"
echo ""
echo "🔑 Demo-Benutzer:"
echo "   - admin@comnet.local / admin123"
echo "   - alice@comnet.local / admin123"
echo "   - bob@comnet.local / admin123"
echo ""
echo "Viel Spaß mit COMNet! 🎊"
