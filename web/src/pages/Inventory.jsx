import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Info,
  Minus,
  Package,
  Plus,
  PlusCircle,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../services/api";
import socketService from "../services/socket";

const StockItemCard = ({ item, onAdjust, onQuickAdjust }) => {
  const isLow = item.full < item.threshold;

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 p-5 relative overflow-hidden group transition-all hover:-translate-y-1 hover:shadow-lg"
      style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)" }}
    >
      {isLow && (
        <div className="absolute top-3 right-3">
          <AlertTriangle size={20} className="text-red-500" />
        </div>
      )}

      <div className="flex items-start gap-4 mb-5">
        <div
          className={`p-3 rounded-xl ${isLow ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-600"}`}
        >
          <Package size={24} />
        </div>
        <div className="flex-1 pt-0.5">
          <h3 className="text-lg font-semibold text-[#1F2933] leading-tight mb-1">
            {item.type}
          </h3>
          <p className="text-gray-400 text-xs flex items-center gap-1 font-medium">
            <Info size={12} /> Threshold: {item.threshold}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div
          className={`rounded-xl p-3 border ${isLow ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"} flex flex-col items-center justify-center`}
        >
          <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide mb-1">
            Full Stock
          </p>
          <h4
            className={`text-4xl font-bold ${isLow ? "text-red-600" : "text-[#1F2933]"}`}
          >
            {item.full}
          </h4>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 flex flex-col items-center justify-center">
          <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide mb-1">
            Empty Stock
          </p>
          <h4 className="text-2xl font-bold text-gray-400">{item.empty}</h4>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onQuickAdjust(item.id, -1)}
          className="w-10 h-10 rounded-md bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
          title="Decrease stock by 1"
        >
          <Minus size={18} strokeWidth={3} />
        </button>
        <button
          onClick={() => onAdjust(item.id, "FULL")}
          className="flex-1 bg-white shadow-sm text-gray-600 font-bold tracking-wide rounded-md border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5 text-[13px]"
        >
          <Settings2 size={16} strokeWidth={2.5} /> Manage
        </button>
        <button
          onClick={() => onQuickAdjust(item.id, 1)}
          className="w-10 h-10 rounded-md bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:bg-[#E8F5E9] hover:text-[#00C853] hover:border-[#00C853] transition-all"
          title="Increase stock by 1"
        >
          <Plus size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

const Inventory = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustData, setAdjustData] = useState({
    id: null,
    type: "FULL",
    amount: 0,
    reason: "",
    itemName: "",
  });

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemData, setNewItemData] = useState({
    cylinderType: "",
    initialStock: 0,
  });

  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory");
      const mapped = res.data.map((item) => ({
        id: item.id,
        type: item.cylinderType,
        full: item.stockLevel,
        empty: 0,
        threshold: 10,
      }));
      setStocks(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();

    const socket = socketService.connect();

    socket.on("inventoryUpdate", (updated) => {
      setStocks((prevStocks) => {
        const exists = prevStocks.find((s) => s.type === updated.cylinderType);
        if (exists) {
          return prevStocks.map((item) =>
            item.type === updated.cylinderType
              ? { ...item, full: updated.stockLevel }
              : item,
          );
        } else {
          return [
            ...prevStocks,
            {
              id: updated.id,
              type: updated.cylinderType,
              full: updated.stockLevel,
              empty: 0,
              threshold: 10,
            },
          ];
        }
      });
    });

    return () => {
      socket.off("inventoryUpdate");
    };
  }, []);

  const handleAdjustStock = (id, stockType) => {
    const item = stocks.find((s) => s.id === id);
    setAdjustData({
      id,
      type: stockType,
      amount: 0,
      reason: "",
      itemName: item.type,
    });
    setIsAdjusting(true);
  };

  const handleQuickAdjust = async (id, delta) => {
    const item = stocks.find((s) => s.id === id);
    if (!item) return;

    const newLevel = Math.max(0, item.full + delta);

    setStocks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, full: newLevel } : s)),
    );

    try {
      await api.patch(`/inventory/${encodeURIComponent(item.type)}`, {
        stockLevel: newLevel,
      });
      toast.success(
        `${item.type} stock ${delta > 0 ? "increased" : "decreased"}`,
      );
    } catch (err) {
      toast.error("Failed to quick adjust");
      fetchStock();
    }
  };

  const saveAdjustment = async () => {
    try {
      const item = stocks.find((s) => s.id === adjustData.id);
      const newLevel = Math.max(0, item.full + parseInt(adjustData.amount));
      await api.patch(`/inventory/${encodeURIComponent(item.type)}`, {
        stockLevel: newLevel,
      });
      toast.success("Inventory updated successfully");
      fetchStock();
      setIsAdjusting(false);
    } catch (err) {
      toast.error("Failed to update inventory");
    }
  };

  const saveNewItem = async () => {
    if (!newItemData.cylinderType.trim()) {
      return toast.error("Cylinder type is required");
    }

    try {
      const newLevel = Math.max(0, parseInt(newItemData.initialStock) || 0);
      await api.patch(
        `/inventory/${encodeURIComponent(newItemData.cylinderType)}`,
        { stockLevel: newLevel },
      );
      toast.success("New inventory item added successfully");
      fetchStock();
      setIsAddingItem(false);
      setNewItemData({ cylinderType: "", initialStock: 0 });
    } catch (err) {
      toast.error("Failed to add inventory item");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div
        className="bg-white border border-gray-200 p-6 rounded-2xl"
        style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)" }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 rounded-xl">
              <Package className="text-gray-600" size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1F2933]">
                Stock Management
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <p className="text-gray-500 text-sm">Real-time sync active</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddingItem(true)}
              className="px-5 py-2 bg-[#00C853] hover:bg-[#00B248] text-white font-bold text-[13px] tracking-wide rounded-lg flex items-center gap-1.5 transition-all shadow-sm shadow-[#00C853]/20"
            >
              <PlusCircle size={16} strokeWidth={2.5} />
              <span>New Type</span>
            </button>
            <button
              onClick={fetchStock}
              className="p-2 bg-white hover:bg-gray-50 text-gray-600 rounded-lg transition-all border border-gray-200 shadow-sm"
              title="Refresh Inventory"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {stocks.some((s) => s.full < s.threshold) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              Low Stock Warning
            </p>
            <p className="text-xs text-red-600">
              Some cylinder types are below their threshold levels
            </p>
          </div>
        </div>
      )}

      {/* Grid of Stocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stocks.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#1F2933] mb-2">
              Your inventory is empty
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Start tracking your gas cylinders by adding your first unit.
            </p>
            <button
              onClick={() => setIsAddingItem(true)}
              className="bg-[#1F2933] text-white font-semibold px-6 py-2.5 rounded-xl inline-flex items-center gap-2 hover:bg-gray-700 transition-colors"
            >
              <PlusCircle size={18} />
              Add First Item
            </button>
          </div>
        )}
        {stocks.map((item) => (
          <StockItemCard
            key={item.id}
            item={item}
            onAdjust={handleAdjustStock}
            onQuickAdjust={handleQuickAdjust}
          />
        ))}
      </div>

      {/* History Table */}
      <div
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
        style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)" }}
      >
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <History className="text-gray-400" size={18} />
          <h3 className="text-lg font-semibold text-[#1F2933]">
            Recent Activity Log
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-white text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Item Type</th>
                <th className="px-5 py-3.5">Stock Type</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="text-gray-600 text-sm hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 font-medium text-gray-500">
                  Today, 11:30 AM
                </td>
                <td className="px-5 py-4 font-semibold text-[#1F2933]">
                  Domestic 14.2kg
                </td>
                <td className="px-5 py-4">
                  <span className="px-2.5 py-1 rounded-full bg-[#EBF5FF] text-[#3B82F6] text-[10px] font-bold tracking-widest uppercase">
                    Full
                  </span>
                </td>
                <td className="px-5 py-4 flex items-center gap-1.5 text-emerald-600 font-medium text-xs">
                  <ArrowUpCircle size={12} /> Addition
                </td>
                <td className="px-5 py-4 font-semibold text-emerald-600">
                  +20
                </td>
                <td className="px-5 py-4">Admin</td>
                <td className="px-5 py-4 text-gray-400 italic max-w-xs truncate">
                  Refilled from warehouse batch #42
                </td>
              </tr>
              <tr className="text-gray-600 text-sm hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 font-medium text-gray-500">
                  Yesterday, 04:15 PM
                </td>
                <td className="px-5 py-4 font-semibold text-[#1F2933]">
                  Commercial 19kg
                </td>
                <td className="px-5 py-4">
                  <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-[10px] font-medium">
                    Full
                  </span>
                </td>
                <td className="px-5 py-4 flex items-center gap-1.5 text-red-600 font-medium text-xs">
                  <ArrowDownCircle size={12} /> Removal
                </td>
                <td className="px-5 py-4 font-semibold text-red-600">-5</td>
                <td className="px-5 py-4">Manager</td>
                <td className="px-5 py-4 text-gray-400 italic max-w-xs truncate">
                  Manual adjustment for offline sale
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      {isAdjusting && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-[#1F2933]">
                Manage Bulk Adjustment
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Managing:{" "}
                <span className="text-[#1F2933] bg-gray-100 px-2 py-0.5 rounded ml-1">
                  {adjustData.itemName}
                </span>
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-3 text-center">
                  Adjustment Amount
                </label>
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() =>
                      setAdjustData({
                        ...adjustData,
                        amount: adjustData.amount - 1,
                      })
                    }
                    className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                  >
                    <Minus size={20} />
                  </button>
                  <div className="text-center min-w-[80px]">
                    <span
                      className={`text-5xl font-bold tabular-nums ${adjustData.amount > 0 ? "text-emerald-600" : adjustData.amount < 0 ? "text-red-600" : "text-[#1F2933]"}`}
                    >
                      {adjustData.amount > 0
                        ? `+${adjustData.amount}`
                        : adjustData.amount}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setAdjustData({
                        ...adjustData,
                        amount: adjustData.amount + 1,
                      })
                    }
                    className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 ml-1">
                  Reason for adjustment
                </label>
                <textarea
                  value={adjustData.reason}
                  onChange={(e) =>
                    setAdjustData({ ...adjustData, reason: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[#1F2933] focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none text-sm resize-none"
                  placeholder="e.g. Returned from customer..."
                  rows={3}
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsAdjusting(false)}
                  className="flex-1 bg-gray-100 text-gray-600 font-medium py-2.5 rounded-xl border border-gray-200 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAdjustment}
                  className="flex-1 bg-[#00C853] text-white font-bold tracking-wide py-2.5 rounded-xl hover:bg-[#00B248] transition-colors flex items-center justify-center gap-2 shadow-sm shadow-[#00C853]/20"
                >
                  <Settings2 size={16} strokeWidth={2.5} /> Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-[#1F2933]">
                Create Stock Type
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Introduce a new cylinder category.
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 ml-1">
                  Cylinder Type Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newItemData.cylinderType}
                  onChange={(e) =>
                    setNewItemData({
                      ...newItemData,
                      cylinderType: e.target.value,
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[#1F2933] hover:border-gray-300 focus:border-gray-300 focus:ring-2 focus:ring-gray-200 outline-none text-sm"
                  placeholder="e.g. Commercial 19kg"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium text-gray-500 block text-center">
                  Initial Quantity
                </label>
                <div className="flex items-center justify-center gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <button
                    onClick={() =>
                      setNewItemData({
                        ...newItemData,
                        initialStock: Math.max(0, newItemData.initialStock - 1),
                      })
                    }
                    className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                  >
                    <Minus size={20} />
                  </button>
                  <div className="text-center min-w-[60px]">
                    <span className="text-4xl font-bold text-[#1F2933]">
                      {newItemData.initialStock}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setNewItemData({
                        ...newItemData,
                        initialStock: newItemData.initialStock + 1,
                      })
                    }
                    className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsAddingItem(false);
                    setNewItemData({ cylinderType: "", initialStock: 0 });
                  }}
                  className="flex-1 bg-gray-100 text-gray-600 font-medium py-2.5 rounded-xl border border-gray-200 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNewItem}
                  className="flex-1 bg-[#00C853] text-white font-bold tracking-wide py-2.5 rounded-xl hover:bg-[#00B248] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm shadow-[#00C853]/20"
                  disabled={!newItemData.cylinderType.trim()}
                >
                  <PlusCircle size={16} strokeWidth={2.5} /> Add Type
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
