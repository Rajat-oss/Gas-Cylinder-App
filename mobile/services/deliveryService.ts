import api from './api';

export interface Delivery {
    id: string;
    customerName: string;
    customerAddress: string;
    customerPhone: string;
    cylinderType: string;
    quantity: number;
    status: 'PENDING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
    latitude?: number;
    longitude?: number;
    createdAt: string;
    updatedAt: string;
    assignedStaffId?: string;
}

export const deliveryService = {
    getDeliveries: async (): Promise<Delivery[]> => {
        // Driver specific tasks
        const response = await api.get('/orders/my-tasks');
        return response.data;
    },
    updateDeliveryStatus: async (id: string, status: string): Promise<Delivery> => {
        const response = await api.patch(`/orders/${id}`, { status });
        return response.data;
    }
};
