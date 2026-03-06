const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all orders (Admin/Manager)
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                assignedStaff: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                transactions: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(orders);
    } catch (error) {
        console.error('Fetch orders error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get orders assigned to current driver
router.get('/my-tasks', authenticateToken, async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: {
                assignedStaffId: req.user.id
            },
            include: {
                transactions: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(orders);
    } catch (error) {
        console.error('Fetch driver tasks error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create order (Admin/Manager)
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), async (req, res) => {
    try {
        console.log('Order creation request body:', req.body);
        const { customerName, customerAddress, customerPhone, cylinderType, quantity, amount, assignedStaffId, scheduledDeliveryDate } = req.body;
        const parsedQuantity = quantity ? parseInt(quantity) : 1;
        const parsedAmount = amount !== undefined ? parseFloat(amount) : parsedQuantity * 800;

        // Check inventory first
        const inventory = await prisma.inventory.findUnique({
            where: { cylinderType }
        });

        if (!inventory || inventory.stockLevel < parsedQuantity) {
            return res.status(400).json({
                message: `Insufficient stock for ${cylinderType}. Only ${inventory ? inventory.stockLevel : 0} left.`
            });
        }

        // Decrement inventory
        const updatedInventory = await prisma.inventory.update({
            where: { cylinderType },
            data: {
                stockLevel: {
                    decrement: parsedQuantity
                }
            }
        });

        const newOrder = await prisma.order.create({
            data: {
                customerName,
                customerAddress,
                customerPhone,
                cylinderType,
                quantity: parsedQuantity,
                amount: parsedAmount,
                assignedStaffId,
                scheduledDeliveryDate: scheduledDeliveryDate ? new Date(scheduledDeliveryDate) : null
            }
        });

        // Real-time update via Socket.io
        try {
            const { getIO } = require('../lib/socket');
            getIO().emit('newOrder', newOrder);
            getIO().emit('inventoryUpdate', updatedInventory);
        } catch (err) {
            console.error('Socket emit error (New Order/Inventory):', err.message);
        }

        res.status(201).json(newOrder);
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// Update order status/assigned staff (Admin/Manager/Driver)
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const { status, assignedStaffId, paymentMode, amount, txnId, scheduledDeliveryDate } = req.body;

        // Find existing order
        const existingOrder = await prisma.order.findUnique({
            where: { id: req.params.id }
        });

        if (!existingOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // If user is driver, verify ownership
        if (req.user.role === 'DRIVER' && existingOrder.assignedStaffId !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: You can only update your own assigned tasks.' });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: req.params.id },
            data: {
                status: status || undefined,
                assignedStaffId: assignedStaffId || undefined,
                scheduledDeliveryDate: scheduledDeliveryDate ? new Date(scheduledDeliveryDate) : undefined
            }
        });

        // Handle transaction creation when marked as DELIVERED
        if (status === 'DELIVERED' && paymentMode && amount !== undefined) {
            const existingTx = await prisma.transaction.findUnique({
                where: { orderId: req.params.id }
            });

            if (!existingTx) {
                await prisma.transaction.create({
                    data: {
                        orderId: req.params.id,
                        paymentType: paymentMode.toUpperCase() === 'CASH' ? 'CASH' : 'UPI',
                        amount: parseFloat(amount),
                        referenceId: txnId || null
                    }
                });
            }
        }

        // Real-time update via Socket.io
        try {
            const { getIO } = require('../lib/socket');
            getIO().emit('orderUpdated', updatedOrder);
        } catch (err) {
            console.error('Socket emit error (Order Updated):', err.message);
        }

        res.json(updatedOrder);
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get report for settlement (Admin/Manager)
router.get('/report', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), async (req, res) => {
    try {
        const { driverId, date } = req.query;
        if (!driverId || !date) {
            return res.status(400).json({ message: 'Driver ID and date are required' });
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const orders = await prisma.order.findMany({
            where: {
                assignedStaffId: driverId,
                status: 'DELIVERED',
                updatedAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                transactions: true
            }
        });

        const cashTx = [];
        const upiTx = [];

        orders.forEach(order => {
            order.transactions.forEach(t => {
                const txData = {
                    id: t.id,
                    time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    customer: order.customerName,
                    orderId: order.id.substring(0, 8).toUpperCase(),
                    amount: t.amount,
                    ref: t.referenceId || t.id.substring(0, 12).toUpperCase() // Using actual ref or ID fallback
                };

                if (t.paymentType === 'CASH') cashTx.push(txData);
                else upiTx.push(txData);
            });
        });

        const totalCash = cashTx.reduce((sum, t) => sum + t.amount, 0);
        const totalUPI = upiTx.reduce((sum, t) => sum + t.amount, 0);

        res.json({
            totalCylinders: orders.length,
            cashTransactions: cashTx,
            upiTransactions: upiTx,
            totalCash,
            totalUPI,
            expectedTotal: totalCash + totalUPI
        });
    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
