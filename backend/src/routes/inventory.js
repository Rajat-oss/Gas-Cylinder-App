const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get current inventory (Admin/Manager)
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), async (req, res) => {
    try {
        const inventory = await prisma.inventory.findMany();
        res.json(inventory);
    } catch (error) {
        console.error('Fetch inventory error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update stock levels (Admin/Manager)
router.patch('/:type', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), async (req, res) => {
    try {
        const { type } = req.params;
        const { stockLevel } = req.body;

        const updated = await prisma.inventory.upsert({
            where: { cylinderType: type },
            update: { stockLevel },
            create: { cylinderType: type, stockLevel }
        });

        // Real-time update via Socket.io
        try {
            const { getIO } = require('../lib/socket');
            getIO().emit('inventoryUpdate', updated);
        } catch (err) {
            console.error('Socket emit error:', err.message);
        }

        res.json(updated);
    } catch (error) {
        console.error('Update inventory error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
