require('dotenv').config();
const express = require('express');
const cors = require('cors');
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
const httpServer = createServer(app);
const io = initSocket(httpServer);
const PORT = process.env.PORT || PORT;

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/staff', staffRoutes);
app.use('/orders', orderRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/admin', adminRoutes);

// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'GasFlow Backend is running' });
});

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running with Socket.io on http://127.0.0.1:${PORT}`);
});

// Dummy comment to trigger nodemon restart

// Dummy comment to trigger nodemon restart 2
