import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import connectDB, { isDatabaseConnected } from './config/db.js';
import { validateEnvironment } from './config/env.js';
import { apiLimiter, authLimiter, securityHeaders } from './config/security.js';
import authRoutes from './routes/auth.js';
import analysesRoutes from './routes/analyses.js';
import Analysis from './models/Analysis.js';
import { requireAuth } from './middleware/auth.js';
import { analyzeResume } from './services/analysis.js';
import { uploadResume } from './services/fileStorage.js';

dotenv.config();
connectDB();
validateEnvironment();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontEndPublicDir = path.resolve(__dirname, '../frontEnd/public');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowed = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    callback(null, allowed.includes(file.mimetype));
  }
});
app.disable('x-powered-by');
app.use(securityHeaders);

// Robust CORS: supports localhost, custom CLIENT_ORIGIN, and Render preview/production domains
const configuredOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (configuredOrigins.includes('*') || configuredOrigins.includes(origin)) return callback(null, true);
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    if (/\.onrender\.com$/.test(origin)) return callback(null, true);
    if (configuredOrigins.length === 0) return callback(null, true);
    return callback(null, false);
  },
  credentials: true
}));

app.use('/api', apiLimiter);
app.use(express.json({ limit: '2mb' }));

// Health check endpoint for monitoring & Render
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Resumely ATS REST API',
    uptime: Math.floor(process.uptime()),
    database: isDatabaseConnected() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/analyses', analysesRoutes);

app.post('/api/analyze', requireAuth, upload.single('resume'), async (req, res, next) => {
  try {
    let text = req.body.text || '';
    if (req.file) {
      const fileBuffer = req.file.buffer;
      if (req.file.mimetype === 'application/pdf') text = (await pdfParse(fileBuffer)).text;
      else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') text = (await mammoth.extractRawText({ buffer: fileBuffer })).value;
      else text = fileBuffer.toString('utf8');
      req.resumeFile = { mimeType: req.file.mimetype, size: req.file.size, originalName: req.file.originalname };
    }
    if (!text.trim()) return res.status(400).json({ error: 'Add resume text or upload a PDF/DOC file first.' });
    const { result: analysis, source } = await analyzeResume(text, req.body.jobDescription || '');
    if (req.file) req.resumeAsset = await uploadResume(req.file);
    if (isDatabaseConnected()) {
      await Analysis.create({ user: req.auth.sub, resumeName: req.file?.originalname || 'Pasted resume', resumeText: text.slice(0, 30000), resumeFile: req.resumeFile, resumeAsset: req.resumeAsset, jobDescription: req.body.jobDescription || '', score: analysis.score, result: analysis, source });
    }
    res.json({ analysis, source, resumeAsset: req.resumeAsset || null });
  } catch (error) {
    next(error);
  }
});

// Serve frontend static assets if available (production / full-stack deployment)
if (fs.existsSync(frontEndPublicDir)) {
  app.use(express.static(frontEndPublicDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    const indexPath = path.join(frontEndPublicDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

// 404 for unhandled API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.originalUrl} not found.` });
});

// Default root response when frontend static files are not present
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Resumely ATS REST API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      analyses: '/api/analyses',
      analyze: '/api/analyze'
    }
  });
});

// Centralized error handler (MUST be the last middleware)
app.use((error, req, res, next) => {
  console.error(`${req.method} ${req.path}:`, error.message);
  if (res.headersSent) return next(error);
  const status = error.statusCode || error.status || 500;
  const isClientOrServiceError = status < 500 || status === 502 || status === 503 || status === 504;
  const message = isClientOrServiceError && error.message
    ? error.message
    : 'Something went wrong. Please try again.';
  res.status(status).json({ error: message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Resumely server running on port ${PORT}`);
});
