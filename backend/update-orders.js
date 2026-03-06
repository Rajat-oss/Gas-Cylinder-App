const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateExistingOrders() {
    try {
        console.log('Updating existing orders with scheduled delivery dates...');
        
        // Get all orders without scheduledDeliveryDate
        const orders = await prisma.order.findMany({
            where: {
                scheduledDeliveryDate: null
            }
        });

        console.log(`Found ${orders.length} orders without scheduled delivery date`);

        // Update each order - set scheduledDeliveryDate same as createdAt (actual delivery date)
        for (const order of orders) {
            await prisma.order.update({
                where: { id: order.id },
                data: { scheduledDeliveryDate: order.createdAt }
            });

            console.log(`Updated order ${order.id.substring(0, 8)} - Scheduled for ${order.createdAt.toLocaleDateString()}`);
        }

        console.log('✅ All orders updated successfully!');
    } catch (error) {
        console.error('Error updating orders:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateExistingOrders();
