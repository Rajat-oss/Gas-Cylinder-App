import {
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  Filter,
  MapPin,
  MoreHorizontal,
  Package,
  Search,
  Trash2,
  Truck,
  UserPlus,
  XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../services/api";

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleOrderSelection = (id) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "DELIVERED":
        return "bg-[#E8F5E9] text-[#00C853] border-transparent font-bold tracking-wide text-[10px]";
      case "OUT_FOR_DELIVERY":
        return "bg-[#EBF5FF] text-[#3B82F6] border-transparent font-bold tracking-wide text-[10px]";
      case "PENDING":
        return "bg-orange-50 text-orange-500 border-transparent font-bold tracking-wide text-[10px]";
      case "CANCELLED":
        return "bg-red-50 text-red-500 border-transparent font-bold tracking-wide text-[10px]";
      default:
        return "bg-gray-100 text-gray-500 border-transparent font-bold tracking-wide text-[10px]";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle2 size={12} />;
      case "OUT_FOR_DELIVERY":
        return <Truck size={12} />;
      case "PENDING":
        return <Clock size={12} />;
      case "CANCELLED":
        return <XCircle size={12} />;
      default:
        return null;
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone?.includes(searchQuery);
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-[#1F2933]">
            Order Management
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Track customer orders and manage driver assignments
          </p>
        </div>
        <div className="flex gap-3">
          {selectedOrders.length > 0 && (
            <button className="bg-[#00C853] hover:bg-[#00B248] text-white font-bold px-5 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm shadow-[#00C853]/20 text-[13px] tracking-wide">
              <UserPlus size={16} strokeWidth={2.5} />
              <span>Assign {selectedOrders.length} Orders</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div
        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        style={{
          boxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)",
        }}
      >
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-3 items-center flex-1 max-w-2xl">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-[#1F2933] placeholder-gray-400 focus:ring-1 focus:ring-[#00C853] focus:border-[#00C853] outline-none transition-all text-[13px] font-medium shadow-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg py-2 px-3 text-[#1F2933] text-[13px] font-semibold focus:ring-1 focus:ring-[#00C853] focus:border-[#00C853] outline-none transition-all shadow-sm"
            >
              <option value="">Status: All</option>
              <option value="PENDING">Pending</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>
          <button className="flex items-center gap-1.5 bg-white border border-gray-200 text-[#1F2933] px-4 py-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-[13px] font-bold tracking-wide shadow-sm">
            <Filter size={14} strokeWidth={2.5} />
            <span>More Filters</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-white text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-5 py-4 w-12">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 bg-white text-[#00C853] focus:ring-[#00C853]"
                    onChange={(e) => {
                      if (e.target.checked)
                        setSelectedOrders(orders.map((o) => o.id));
                      else setSelectedOrders([]);
                    }}
                  />
                </th>
                <th className="px-5 py-4">Order ID & Customer</th>
                <th className="px-5 py-4">Delivery Address</th>
                <th className="px-5 py-4">Scheduled Date</th>
                <th className="px-5 py-4">Content</th>
                <th className="px-5 py-4">Assigned Staff</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className={`hover:bg-gray-50 transition-all group ${selectedOrders.includes(order.id) ? "bg-blue-50/50" : ""}`}
                >
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      className="w-4 h-4 rounded border-gray-300 bg-white text-[#00C853] focus:ring-[#00C853] transition-colors"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-[#1F2933] text-xs font-mono font-medium mb-0.5">
                        #{order.id.substring(0, 8)}
                      </span>
                      <span className="font-semibold text-[#1F2933]">
                        {order.customerName}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {order.customerPhone}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 min-w-[200px]">
                    <div className="flex items-start gap-2 text-gray-500">
                      <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                      <span className="text-sm line-clamp-2">
                        {order.customerAddress}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {order.scheduledDeliveryDate ? (
                      <div className="flex flex-col">
                        <span className="text-[#1F2933] text-sm font-medium">
                          {new Date(
                            order.scheduledDeliveryDate,
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {new Date(
                            order.scheduledDeliveryDate,
                          ).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        Not scheduled
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-gray-400" />
                      <span className="text-gray-600 text-sm font-medium">
                        {order.cylinderType} × {order.quantity}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {!order.assignedStaff ? (
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:text-[#1F2933] hover:border-gray-300 transition-all text-xs font-medium">
                        <UserPlus size={12} />
                        Assign
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1F2933] to-gray-500 flex items-center justify-center text-[10px] font-semibold text-white">
                          {order.assignedStaff.name.charAt(0)}
                        </div>
                        <span className="text-gray-600 text-sm font-medium">
                          {order.assignedStaff.name}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${getStatusStyle(order.status)}`}
                    >
                      {getStatusIcon(order.status)}
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span
                        className={`text-xs font-semibold ${order.transactions.length > 0 ? "text-emerald-600" : "text-amber-600"}`}
                      >
                        {order.transactions.length > 0 ? "PAID" : "PENDING"}
                      </span>
                      <span className="text-gray-400 text-[10px] font-medium uppercase">
                        {order.transactions[0]?.paymentType || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === order.id ? null : order.id,
                          )
                        }
                        className="p-1.5 text-gray-400 hover:text-[#1F2933] hover:bg-gray-100 rounded-md transition-all"
                      >
                        <MoreHorizontal size={18} strokeWidth={2} />
                      </button>
                      {openDropdown === order.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-10 min-w-[140px] overflow-hidden">
                          <button className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-[#1F2933] flex items-center gap-2 transition-colors">
                            <Eye size={14} /> View Details
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-[#1F2933] flex items-center gap-2 transition-colors">
                            <Edit size={14} /> Edit Order
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors">
                            <Trash2 size={14} /> Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && !loading && (
          <div className="p-8 text-center">
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
