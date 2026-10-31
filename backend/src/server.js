import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase, db } from './db.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../frontend/dist');

const app = express();
const PORT = process.env.PORT || 5000;

// Normalize duplicated slashes and accidental nested health/api path prefixes
app.use((req, res, next) => {
  if (req.url && req.url.includes('//')) {
    req.url = req.url.replace(/\/+/g, '/');
  }

  // Rewrite accidental /api/health/api/... or /api/health/... from malformed client base URLs
  if (req.url.startsWith('/api/health/api/')) {
    req.url = req.url.replace('/api/health/api/', '/api/');
  } else if (req.url.startsWith('/api/health/') && !req.url.startsWith('/api/health?')) {
    req.url = req.url.replace('/api/health/', '/api/');
  } else if (req.url.startsWith('/health/api/')) {
    req.url = req.url.replace('/health/api/', '/api/');
  } else if (req.url.startsWith('/health/') && !req.url.startsWith('/health?') && req.url !== '/health') {
    req.url = req.url.replace('/health/', '/api/');
  }

  next();
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check handler with live database status reporting
const healthHandler = async (req, res) => {
  let dbConnected = true;
  let dbError = null;
  let userCount = 0;
  let customerCount = 0;
  let loanCount = 0;

  try {
    const uRow = await db.get('SELECT COUNT(*) as count FROM users');
    userCount = uRow ? Number(uRow.count) : 0;
    const cRow = await db.get('SELECT COUNT(*) as count FROM customers');
    customerCount = cRow ? Number(cRow.count) : 0;
    const lRow = await db.get('SELECT COUNT(*) as count FROM loans');
    loanCount = lRow ? Number(lRow.count) : 0;
  } catch (err) {
    dbConnected = false;
    dbError = err.message;
  }

  res.json({
    status: 'online',
    app: 'Weekly Finance API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected: dbConnected,
      isPermanentCloud: Boolean(db.isTurso),
      provider: db.isTurso ? 'Turso Cloud SQLite (Permanent Lifetime Free)' : 'Local SQLite File',
      storageLocation: db.isTurso ? 'Turso Cloud Network' : 'Server Local Disk (thunai_ledger.db)',
      records: {
        users: userCount,
        customers: customerCount,
        loans: loanCount
      },
      error: dbError
    }
  });
};

// Root endpoint for status ping
app.get('/', (req, res, next) => {
  // If frontend dist exists, let static handler take care of root, otherwise return API info
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    return next();
  }
  res.json({
    status: 'online',
    app: 'Weekly Finance API',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      dashboard: '/api/dashboard'
    }
  });
});

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// API Routes - support both /api/... prefix and direct /... prefix
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/dashboard', dashboardRoutes);

// If frontend build exists (e.g. monolithic deployment on Render / Heroku), serve static files
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Client-side SPA routing fallback for non-API requests
  app.use((req, res, next) => {
    if (
      req.method === 'GET' &&
      !req.path.startsWith('/api') && 
      !req.path.startsWith('/auth') && 
      !req.path.startsWith('/dashboard') && 
      !req.path.startsWith('/health')
    ) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Fallback 404 handler - ALWAYS return JSON so fetch().json() never crashes with SyntaxError
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.originalUrl} not found on this server`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` Weekly Finance API server running on port ${PORT}`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
}).catch((err) => {
  console.error('[Database] Failed to initialize database:', err);
  process.exit(1);
});

// Keep process active indefinitely on Windows
setInterval(() => {}, 1000 * 60 * 60);
