# COMNet - Erste Schritte

## 🚀 Schnellstart

### Voraussetzungen
- Docker und Docker Compose installiert
- Mindestens 4GB RAM verfügbar
- Ports 80, 3001, 5432, 6379, 9000, 9001, 8765 frei

### Installation und Start

1. **Repository klonen oder Dateien kopieren**
   ```bash
   # Falls aus Git
   git clone <repository-url>
   cd comnet
   
   # Oder falls Dateien bereits vorhanden
   cd /srv/social
   ```

2. **Services starten**
   ```bash
   ./start.sh
   ```
   
   Oder manuell:
   ```bash
   docker-compose up -d
   ```

3. **Auf die Anwendung zugreifen**
   - Frontend: http://localhost:8765
   - Backend API: http://localhost:3001
   - MinIO Console: http://localhost:9001

## 🔑 Demo-Benutzer

Die Plattform wird mit folgenden Demo-Benutzern geliefert:

| Benutzername | E-Mail | Passwort | Rolle |
|-------------|--------|----------|-------|
| admin | admin@comnet.local | admin123 | Administrator |
| alice | alice@comnet.local | admin123 | Entwicklerin |
| bob | bob@comnet.local | admin123 | Community Manager |

## 📱 Features

### ✅ Implementierte Features

- **Benutzer-Management**
  - Registrierung und Anmeldung
  - Profil-Management
  - JWT-basierte Authentifizierung

- **Community-System**
  - Community-Erstellung und -Verwaltung
  - Mitgliedschaften mit Rollen (Member, Moderator, Admin)
  - Community-spezifische Einstellungen

- **Content-Management**
  - Text-Posts mit Markdown-Unterstützung
  - Up/Downvote-System
  - Kommentare mit Threading
  - Media-Upload (Bilder, Videos)

- **Netzwerk-Features**
  - Öffentliches Netzwerk-Verzeichnis
  - Netzwerk-spezifische Communities
  - Basis-Föderations-Protokoll

- **Frontend**
  - Responsive Design mit TailwindCSS
  - React/Next.js mit TypeScript
  - Moderne UI-Komponenten
  - Real-time Updates

### 🚧 Geplante Features

- **Erweiterte Föderation**
  - ActivityPub-Integration
  - Cross-Network-Posts
  - Remote-User-Management

- **Media-Handling**
  - Video-Transcoding
  - Bild-Optimierung
  - CDN-Integration

- **Mobile App**
  - React Native App
  - Push-Benachrichtigungen
  - Offline-Support

## 🏗️ Architektur

### Backend (Node.js)
- **Express.js** - Web-Framework
- **PostgreSQL** - Hauptdatenbank
- **Redis** - Caching und Sessions
- **MinIO** - Objektspeicher für Dateien
- **JWT** - Authentifizierung

### Frontend (React/Next.js)
- **Next.js 14** - React-Framework
- **TailwindCSS** - Styling
- **React Query** - State Management
- **TypeScript** - Type Safety

### Infrastructure
- **Docker** - Containerisierung
- **Nginx** - Load Balancer und Reverse Proxy
- **Docker Compose** - Orchestrierung

## 🔧 Entwicklung

### Backend-Entwicklung
```bash
cd backend
npm install
npm run dev
```

### Frontend-Entwicklung
```bash
cd frontend
npm install
npm run dev
```

### Datenbank-Migrationen
```bash
# Im Backend-Container
docker-compose exec backend npm run migrate
```

### Logs anzeigen
```bash
# Alle Services
docker-compose logs -f

# Spezifischer Service
docker-compose logs -f backend
```

## 📊 Monitoring

### Service-Status
```bash
docker-compose ps
```

### Health Checks
- Backend: http://localhost:3001/health
- Frontend: http://localhost:8765
- MinIO: http://localhost:9000/minio/health/live

### Datenbank-Zugriff
```bash
docker-compose exec postgres psql -U comnet -d comnet
```

## 🛠️ Konfiguration

### Umgebungsvariablen
Kopieren Sie `env.example` zu `.env` und passen Sie die Werte an:

```bash
cp env.example .env
```

### Wichtige Einstellungen
- `JWT_SECRET` - Ändern Sie diesen Wert in Produktion!
- `DATABASE_URL` - Datenbankverbindung
- `MINIO_ACCESS_KEY/SECRET_KEY` - MinIO-Zugangsdaten

## 🚀 Deployment

### Produktions-Deployment
1. Ändern Sie alle Passwörter und Secrets
2. Konfigurieren Sie SSL/TLS
3. Setzen Sie `NODE_ENV=production`
4. Verwenden Sie einen externen PostgreSQL-Server
5. Konfigurieren Sie ein CDN für statische Assets

### Skalierung
- **Horizontal**: Mehr Backend-Container
- **Vertikal**: Mehr CPU/RAM für Container
- **Database**: Read-Replicas für PostgreSQL
- **Storage**: Externe MinIO-Cluster

## 🐛 Troubleshooting

### Häufige Probleme

**Services starten nicht**
```bash
# Prüfen Sie die Logs
docker-compose logs

# Prüfen Sie verfügbare Ports
netstat -tulpn | grep :8765
```

**Datenbank-Verbindungsfehler**
```bash
# Prüfen Sie PostgreSQL
docker-compose exec postgres pg_isready -U comnet

# Prüfen Sie die Netzwerk-Verbindung
docker-compose exec backend ping postgres
```

**Frontend lädt nicht**
```bash
# Prüfen Sie die Backend-Verbindung
curl http://localhost:3001/health

# Prüfen Sie die Frontend-Logs
docker-compose logs frontend
```

## 📚 Weitere Dokumentation

- [API-Dokumentation](API.md)
- [Föderations-Protokoll](FEDERATION.md)
- [Entwicklungsrichtlinien](DEVELOPMENT.md)
- [Deployment-Guide](DEPLOYMENT.md)

## 🤝 Beitragen

COMNet ist Open Source! Beiträge sind willkommen:

1. Fork des Repositories
2. Feature-Branch erstellen
3. Änderungen committen
4. Pull Request erstellen

## 📄 Lizenz

AGPLv3 - Siehe [LICENSE](../LICENSE) für Details.
