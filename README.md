# COMNet - Dezentrale Social-Media-Plattform

COMNet ist eine dezentrale, offene und modulare Social-Media-Plattform, die an Reddit angelehnt ist, aber vollständig Open Source und föderiert/dezentral funktioniert.

## 🚀 Features

- **Dezentrale Architektur**: Jeder kann sein eigenes COM (Community Network) hosten
- **Föderation**: COMs können sich untereinander vernetzen
- **User-Souveränität**: Nutzer besitzen ihre eigenen Daten
- **Verschiedene Inhalte**: Text, Bilder, Videos
- **Reddit-ähnliche Features**: Up/Downvotes, Kommentare, Communities
- **Theming**: Anpassbare Designs für Communities
- **Open Source**: AGPLv3 Lizenz

## 🏗️ Architektur

- **Backend**: Node.js mit Express
- **Frontend**: React/Next.js mit TailwindCSS
- **Datenbank**: PostgreSQL
- **Storage**: MinIO für Dateien
- **Föderation**: ActivityPub-kompatibles Protokoll
- **Docker**: Vollständig containerisiert

## 🚀 Quick Start

```bash
# Repository klonen
git clone <repository-url>
cd comnet

# Services starten
docker-compose up -d

# Frontend auf http://localhost:8765
```

## 📁 Projektstruktur

```
comnet/
├── backend/          # Node.js API Server
├── frontend/         # React/Next.js App
├── database/         # PostgreSQL Schema & Migrationen
├── docker/           # Docker Konfigurationen
├── docs/            # Dokumentation
└── docker-compose.yml
```

## 🔧 Entwicklung

Siehe [Entwicklungsdokumentation](docs/development.md) für detaillierte Anweisungen.

## 📄 Lizenz

AGPLv3 - Siehe [LICENSE](LICENSE) für Details.
