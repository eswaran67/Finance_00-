import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../frontend/dist');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SQLite database
initDatabase();

// Normalize duplicated slashes in URL path (e.g. //auth/login -> /auth/login)
app.use((req, res, next) => {
  if (req.url && req.url.includes('//')) {
    req.url = req.url.replace(/\/+/g, '/');
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

// Health check handler
const healthHandler = (req, res) => {
  res.json({
    status: 'online',
    app: 'Weekly Finance API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
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

// Start Server
const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Weekly Finance API server running on port ${PORT}`);
  console.log(` Local URL: http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

// Keep process active indefinitely on Windows
setInterval(() => {}, 1000 * 60 * 60);
