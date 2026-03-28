const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all staff and drivers (Admin/Manager)
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), async (req, res) => {
    try {
        let staff;
        let retries = 3;

        while (retries > 0) {
            try {
                staff = await prisma.user.findMany({
                    where: {
                        role: {
                            in: ['STAFF', 'DRIVER', 'MANAGER']
                        }
                    },
                    include: {
                        orders: {
                            select: {
                                status: true,
                                transactions: {
                                    select: {
                                        amount: true,
                                        paymentType: true,
                                        timestamp: true
                                    }
                                }
                            }
                        }
                    }
                });
                break; // Success, exit retry loop
            } catch (err) {
                if (err.code === 'P1001' && retries > 1) {
                    console.warn(`[Prisma P1001] Database sleeping/unreachable. Retrying... (${retries - 1} left)`);
                    retries--;
                    await new Promise(resolve => setTimeout(resolve, 2500)); // Wait 2.5s for db to wake up
                } else {
                    throw err; // Rethrow if not P1001 or out of retries
                }
            }
        }

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const formattedStaff = staff.map(u => {
            const deliveredOrders = u.orders.filter(o => o.status === 'DELIVERED');
            const totalCollection = deliveredOrders.reduce((sum, o) => {
                const orderSum = o.transactions
                    .filter(t => new Date(t.timestamp) >= startOfToday)
                    .reduce((tSum, t) => tSum + t.amount, 0);
                return sum + orderSum;
            }, 0);

            const isActuallyOnline = !!(u.isOnline && u.lastSeen && (new Date() - new Date(u.lastSeen) < 120000));
            const hasActiveOrders = u.orders.some(o => o.status === 'PENDING' || o.status === 'OUT_FOR_DELIVERY');

            let status = 'Offline';
            if (isActuallyOnline) {
                status = hasActiveOrders ? 'On Field' : 'Active';
            }

            return {
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                phone: u.phone,
                vehicleNumber: u.vehicleNumber,
                licenseNumber: u.licenseNumber,
                latitude: u.latitude,
                longitude: u.longitude,
                isOnline: isActuallyOnline,
                status,
                lastSeen: u.lastSeen,
                createdAt: u.createdAt,
                totalOrders: u.orders.length,
                doneOrders: deliveredOrders.length,
                collection: totalCollection,
                progress: u.orders.length > 0 ? Math.round((deliveredOrders.length / u.orders.length) * 100) : 0
            };
        });

        res.json(formattedStaff);
    } catch (error) {
        console.error('Fetch staff error:', error);
        res.status(500).json({ message: 'Database connection failed. Please try again.' });
    }
});

// Update online status (Driver/Staff self-update)
router.patch('/status', authenticateToken, async (req, res) => {
    try {
        const { isOnline } = req.body;
        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                isOnline,
                lastSeen: new Date()
            }
        });
        const { getIO } = require('../lib/socket');
        getIO().emit('driverStatusUpdate', { driverId: req.user.id, isOnline });
        res.json({ success: true });
    } catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add new staff (Admin Only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    try {
        const { name, email, password, role, phone, vehicleNumber, licenseNumber } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                phone,
                vehicleNumber,
                licenseNumber,
                isApproved: true
            }
        });

        res.status(201).json({ message: 'Staff member added successfully' });
    } catch (error) {
        console.error('Add staff error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update staff (Admin Only)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role, phone, vehicleNumber, licenseNumber } = req.body;

        const data = {
            name,
            email,
            role,
            phone,
            vehicleNumber,
            licenseNumber
        };

        if (password) {
            const bcrypt = require('bcryptjs');
            data.password = await bcrypt.hash(password, 10);
        }

        await prisma.user.update({
            where: { id },
            data
        });

        res.json({ message: 'Staff member updated successfully' });
    } catch (error) {
        console.error('Update staff error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete staff (Admin Only)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    try {
        await prisma.user.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Staff member deleted successfully' });
    } catch (error) {
        console.error('Delete staff error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get staff details by ID (Admin/Manager)
router.get('/:id', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                orders: {
                    include: {
                        transactions: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        const deliveredOrders = user.orders.filter(o => o.status === 'DELIVERED');
        const pendingOrders = user.orders.filter(o => o.status === 'PENDING');
        const outForDeliveryOrders = user.orders.filter(o => o.status === 'OUT_FOR_DELIVERY');

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const totalCollection = deliveredOrders.reduce((sum, o) => {
            const orderSum = o.transactions
                .filter(t => new Date(t.timestamp) >= startOfToday)
                .reduce((tSum, t) => tSum + t.amount, 0);
            return sum + orderSum;
        }, 0);

        const isActuallyOnline = !!(user.isOnline && user.lastSeen && (new Date() - new Date(user.lastSeen) < 120000));
        const hasActiveOrders = pendingOrders.length > 0 || outForDeliveryOrders.length > 0;

        let status = 'Offline';
        if (isActuallyOnline) {
            status = hasActiveOrders ? 'On Field' : 'Active';
        }

        const staffDetails = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            vehicleNumber: user.vehicleNumber,
            licenseNumber: user.licenseNumber,
            latitude: user.latitude,
            longitude: user.longitude,
            isOnline: isActuallyOnline,
            status,
            lastSeen: user.lastSeen,
            createdAt: user.createdAt,
            totalOrders: user.orders.length,
            doneOrders: deliveredOrders.length,
            collection: totalCollection,
            progress: user.orders.length > 0 ? Math.round((deliveredOrders.length / user.orders.length) * 100) : 0,
            recentOrders: user.orders.slice(0, 50) // Return up to last 50 orders
        };

        res.json(staffDetails);
    } catch (error) {
        console.error('Fetch staff details error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
