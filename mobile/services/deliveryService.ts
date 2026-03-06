import api from './api';

export interface Delivery {
    id: string;
    customerName: string;
    customerAddress: string;
    customerPhone: string;
    cylinderType: string;
    quantity: number;
    amount?: number;
    status: 'PENDING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
    latitude?: number;
    longitude?: number;
    scheduledDeliveryDate?: string;
    createdAt: string;
    updatedAt: string;
    assignedStaffId?: string;
    transactions?: any[];
}

export const deliveryService = {
    getDeliveries: async (): Promise<Delivery[]> => {
        // Driver specific tasks
        const response = await api.get('/orders/my-tasks');
        return response.data;
    },
    updateDeliveryStatus: async (
        id: string,
        status: string,
        paymentData?: { paymentMode: string; amount: number; txnId?: string }
    ): Promise<Delivery> => {
        const response = await api.patch(`/orders/${id}`, { status, ...paymentData });
        return response.data;
    }
};
