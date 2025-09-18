const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDatabase } = require('./database/connection');
const { connectRedis } = require('./cache/redis');
const { connectMinIO } = require('./storage/minio');

// Import middleware
const { setNetworkContext } = require('./middleware/network');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const communityRoutes = require('./routes/communities');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const federationRoutes = require('./routes/federation');
const networkRoutes = require('./routes/networks');
const newsRoutes = require('./routes/news');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for reverse proxy
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: true, // Allow all origins for reverse proxy
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Zu viele Anfragen von dieser IP, bitte versuchen Sie es später erneut.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Network context middleware
app.use(setNetworkContext);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'COMNet Backend API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/federation', federationRoutes);
app.use('/api/networks', networkRoutes);
app.use('/api/news', newsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Interner Serverfehler',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Etwas ist schiefgelaufen'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route nicht gefunden' });
});

// Initialize services and start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Datenbankverbindung erfolgreich');

    // Connect to Redis
    await connectRedis();
    console.log('✅ Redis-Verbindung erfolgreich');

    // Connect to MinIO
    await connectMinIO();
    console.log('✅ MinIO-Verbindung erfolgreich');

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 COMNet Backend läuft auf Port ${PORT}`);
      console.log(`📊 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Fehler beim Starten des Servers:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Server wird heruntergefahren...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Server wird heruntergefahren...');
  process.exit(0);
});

startServer();
