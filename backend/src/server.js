require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const prisma = require('./lib/prisma');

const authRoutes = require('./routes/auth');
const staffRoutes = require('./routes/staff');
const orderRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');

const { createServer } = require('http');
const { initSocket } = require('./lib/socket');

const app = express();
app.set('trust proxy', 1); // Required for Render and rate limiting behind proxies
const httpServer = createServer(app);
const io = initSocket(httpServer);
const PORT = process.env.PORT || 5002;

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://localhost:8081',
    'http://10.0.2.2:8081',
    'https://gas-cylinder-app-9glu.vercel.app'
];

// Basic rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    message: 'Too many requests, please try again later.',
    skip: (req) => req.method === 'OPTIONS',
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15,
    message: 'Too many login attempts, please try again later.',
    skip: (req) => req.method === 'OPTIONS',
});

// Enable CORS before other global middlewares
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        
        const normalizedOrigin = origin.toLowerCase();
        const isAllowedLocal = allowedOrigins.some(o => normalizedOrigin.includes(o.toLowerCase()));
        const isVercel = normalizedOrigin.includes('.vercel.app') || normalizedOrigin === 'https://vercel.app';
        
        if (isAllowedLocal || isVercel) {
            callback(null, true);
        } else {
            console.error('[CORS Blocked]:', origin);
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'GasFlow Backend API', version: '1.0.0' });
});

app.get('/api/config/maps', (req, res) => {
    res.json({ apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'GasFlow Backend is running', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
    console.log(`🔒 Rate limiting enabled`);
});
