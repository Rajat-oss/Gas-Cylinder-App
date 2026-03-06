const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/stats', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), async (req, res) => {
    try {
        const [
            activeDrivers,
            pendingOrders,
            deliveredToday,
            cancelledOrders,
            transactions
        ] = await Promise.all([
            prisma.user.count({ where: { role: 'DRIVER' } }),
            prisma.order.count({ where: { status: 'PENDING' } }),
            prisma.order.count({
                where: {
                    status: 'DELIVERED',
                    scheduledDeliveryDate: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lte: new Date(new Date().setHours(23, 59, 59, 999))
                    }
                }
            }),
            prisma.order.count({ where: { status: 'CANCELLED' } }),
            prisma.transaction.findMany({
                where: {
                    timestamp: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            })
        ]);

        const totalCollection = transactions.reduce((sum, t) => sum + t.amount, 0);
        const cashCollection = transactions.filter(t => t.paymentType === 'CASH').reduce((sum, t) => sum + t.amount, 0);
        const upiCollection = transactions.filter(t => t.paymentType === 'UPI').reduce((sum, t) => sum + t.amount, 0);

        // Calculate hourly stats for chart based on scheduled delivery date
        const deliveredOrdersForChart = await prisma.order.findMany({
            where: {
                status: 'DELIVERED',
                scheduledDeliveryDate: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lte: new Date(new Date().setHours(23, 59, 59, 999))
                }
            },
            select: { scheduledDeliveryDate: true }
        });

        const hourlyStats = Array.from({ length: 12 }, (_, i) => {
            const hour = i * 2 + 6; // From 06:00 to 20:00 every 2 hours
            return {
                name: `${hour.toString().padStart(2, '0')}:00`,
                deliveries: 0
            };
        });

        deliveredOrdersForChart.forEach(order => {
            if (order.scheduledDeliveryDate) {
                const hour = new Date(order.scheduledDeliveryDate).getHours();
                const index = Math.floor((hour - 6) / 2);
                if (index >= 0 && index < 12) {
                    hourlyStats[index].deliveries++;
                }
            }
        });

        res.json({
            metrics: {
                activeDrivers,
                pendingOrders,
                deliveredToday,
                cancelledOrders,
                totalCollection,
                cashCollection,
                upiCollection,
                hourlyStats
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
