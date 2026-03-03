const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all staff and drivers (Admin/Manager)
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), async (req, res) => {
    try {
        const staff = await prisma.user.findMany({
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
                                amount: true
                            }
                        }
                    }
                }
            }
        });

        const formattedStaff = staff.map(u => {
            const deliveredOrders = u.orders.filter(o => o.status === 'DELIVERED');
            const totalCollection = deliveredOrders.reduce((sum, o) => {
                const orderSum = o.transactions.reduce((tSum, t) => tSum + t.amount, 0);
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

module.exports = router;
