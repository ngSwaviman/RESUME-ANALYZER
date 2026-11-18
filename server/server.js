require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const jobRoutes = require('./routes/jobRoutes');
const matchRoutes = require('./routes/matchRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Make sure the upload directory exists on a fresh checkout.
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const configuredOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// http://localhost:5173 and http://127.0.0.1:5173 are different origins to a
// browser, and both get used during local development.
const LOOPBACK_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

const allowedOrigins = Array.from(
  new Set([...configuredOrigins, 'http://localhost:5173', 'http://127.0.0.1:5173'])
);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // curl, same-origin requests, mobile clients
  if (allowedOrigins.includes(origin)) return true;
  // Any loopback port is accepted outside production (Vite fallbacks, previews).
  if (process.env.NODE_ENV !== 'production' && LOOPBACK_ORIGIN.test(origin)) return true;
  return false;
};

// A single service serves both the API and the built client, so the app's own
// origin must always be accepted (browsers send Origin on same-origin POSTs).
const corsOptions = (req, callback) => {
  const origin = req.header('Origin');
  const host = req.get('host');
  const sameOrigin = Boolean(origin && host && origin === `${req.protocol}://${host}`);
  callback(null, { origin: sameOrigin || isAllowedOrigin(origin), credentials: true });
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Basic brute-force protection for credential endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, service: 'Resume Analyzer API', time: new Date().toISOString() });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

// Single-service deployments (Render) serve the built React app from the same
// origin as the API, so no CORS or second URL is involved.
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    return res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  if (!process.env.JWT_SECRET) {
    // eslint-disable-next-line no-console
    console.warn('[warn] JWT_SECRET is not set. Add it to server/.env before using the app.');
  }
  await connectDB();

  const server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] API running on http://localhost:${PORT}`);
    console.log(`[server] Allowed client origin(s): ${allowedOrigins.join(', ')}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      // eslint-disable-next-line no-console
      console.error(
        `[server] Port ${PORT} is already in use. Stop the process holding it (netstat -ano | findstr :${PORT}) ` +
          'or set a different PORT in server/.env.'
      );
      process.exit(1);
    }
    // eslint-disable-next-line no-console
    console.error('[server] Listener error:', error.message);
    process.exit(1);
  });
};

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[server] Failed to start:', error.message);
  process.exit(1);
});

module.exports = app;
