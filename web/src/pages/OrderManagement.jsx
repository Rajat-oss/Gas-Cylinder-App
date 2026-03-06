import { CheckCircle2, Clock, Filter, MapPin, MoreHorizontal, Search, ShoppingCart, Truck, UserPlus, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleOrderSelection = (id) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'DELIVERED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'OUT_FOR_DELIVERY': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'PENDING': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CANCELLED': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DELIVERED': return <CheckCircle2 size={14} />;
      case 'OUT_FOR_DELIVERY': return <Truck size={14} />;
      case 'PENDING': return <Clock size={14} />;
      case 'CANCELLED': return <XCircle size={14} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tight">Order Management</h2>
          <p className="text-slate-400 mt-1">Track customer orders and manage driver assignments</p>
        </div>
        <div className="flex gap-3">
          {selectedOrders.length > 0 && (
            <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 animate-in slide-in-from-right-4">
              <UserPlus size={20} />
              <span>Assign {selectedOrders.length} Orders</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-slate-800 flex flex-wrap gap-4 items-center justify-between bg-slate-900/30">
          <div className="flex gap-4 items-center flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search by customer name or address..." 
                className="w-full bg-slate-800 border-none rounded-xl py-3 pl-12 pr-4 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>
            <select className="bg-slate-800 border-none rounded-xl py-3 px-4 text-slate-300 font-semibold focus:ring-2 focus:ring-blue-500/50 outline-none">
              <option value="">Status: All</option>
              <option value="PENDING">Pending</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>
          <button className="flex items-center gap-2 bg-slate-800 text-slate-300 px-6 py-3 rounded-xl hover:bg-slate-700 transition-colors">
            <Filter size={18} />
            <span className="text-sm font-semibold">More Filters</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/20 text-slate-400 text-xs font-bold uppercase tracking-widest">
                <th className="px-6 py-5 w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/40" 
                    onChange={(e) => {
                      if (e.target.checked) setSelectedOrders(orders.map(o => o.id));
                      else setSelectedOrders([]);
                    }}
                  />
                </th>
                <th className="px-6 py-5">Order ID & Customer</th>
                <th className="px-6 py-5">Delivery Address</th>
                <th className="px-6 py-5">Scheduled Date</th>
                <th className="px-6 py-5">Content</th>
                <th className="px-6 py-5">Assigned Staff</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Payment</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {orders.map((order) => (
                <tr key={order.id} className={`hover:bg-slate-800/30 transition-colors group ${selectedOrders.includes(order.id) ? 'bg-blue-500/5' : ''}`}>
                  <td className="px-6 py-5">
                    <input 
                      type="checkbox" 
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/40" 
                    />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-blue-400 text-[10px] font-bold tracking-tighter mb-1">{order.id.substring(0, 8)}</span>
                      <span className="text-white font-bold">{order.customerName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 min-w-[200px]">
                    <div className="flex items-start gap-2 text-slate-400">
                      <MapPin size={14} className="mt-1 flex-shrink-0" />
                      <span className="text-sm line-clamp-2">{order.customerAddress}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {order.scheduledDeliveryDate ? (
                      <div className="flex flex-col">
                        <span className="text-white text-sm font-bold">
                          {new Date(order.scheduledDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {new Date(order.scheduledDeliveryDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">Not scheduled</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={14} className="text-slate-500" />
                      <span className="text-slate-300 text-sm font-medium">{order.cylinderType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {!order.assignedStaff ? (
                      <button className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-blue-500 transition-all text-xs font-bold">
                        <UserPlus size={12} />
                        Assign Driver
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                          {order.assignedStaff.name.charAt(0)}
                        </div>
                        <span className="text-slate-300 text-sm font-medium">{order.assignedStaff.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${getStatusStyle(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold ${order.transactions.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {order.transactions.length > 0 ? 'PAID' : 'PENDING'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">{order.transactions[0]?.paymentType || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
