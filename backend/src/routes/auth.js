const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');

// Register route (Admin/Manager)
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role, phone } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'MANAGER',
                phone,
                isApproved: (role === 'ADMIN' || role === 'STAFF' || role === 'DRIVER') ? true : false
            }
        });

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'gasflow_default_secret',
            { expiresIn: '7d' }
        );

        // Update online status on login
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isOnline: true,
                lastSeen: new Date()
            }
        });

        // Real-time update via Socket.io
        try {
            const { getIO } = require('../lib/socket');
            getIO().emit('staffStatusUpdate', { id: user.id, isOnline: true });
        } catch (err) { }

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                vehicleNumber: user.vehicleNumber,
                licenseNumber: user.licenseNumber,
                latitude: user.latitude,
                longitude: user.longitude,
                isApproved: user.isApproved,
                isOnline: true
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                vehicleNumber: user.vehicleNumber,
                licenseNumber: user.licenseNumber,
                isApproved: user.isApproved
            }
        });
    } catch (error) {
        console.error('Fetch profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Ping route to keep connection alive and update online status
router.post('/ping', authenticateToken, async (req, res) => {
    try {
        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                isOnline: true,
                lastSeen: new Date()
            }
        });

        // Real-time update via Socket.io
        try {
            const { getIO } = require('../lib/socket');
            getIO().emit('staffStatusUpdate', { id: req.user.id, isOnline: true });
        } catch (err) { }

        res.json({ message: 'Ping successful' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(401).json({ message: 'User not found or deleted' });
        }
        console.error('Ping error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update current user location
router.patch('/location', authenticateToken, async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                isOnline: true,
                lastSeen: new Date()
            }
        });

        // Real-time update via Socket.io
        try {
            const { getIO } = require('../lib/socket');
            getIO().emit('driverLocationUpdate', {
                id: updatedUser.id,
                latitude: updatedUser.latitude,
                longitude: updatedUser.longitude,
                name: updatedUser.name,
                isOnline: true
            });
        } catch (err) {
            console.error('Socket emit error (Location):', err.message);
        }

        res.json({ message: 'Location updated successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(401).json({ message: 'User not found or deleted' });
        }
        console.error('Update location error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Logout route
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        await prisma.user.update({
            where: { id: req.user.id },
            data: { isOnline: false }
        });

        // Real-time update via Socket.io
        try {
            const { getIO } = require('../lib/socket');
            getIO().emit('staffStatusUpdate', { id: req.user.id, isOnline: false });
        } catch (err) { }

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(401).json({ message: 'User not found or deleted' });
        }
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
