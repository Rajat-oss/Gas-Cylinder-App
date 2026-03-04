import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, History, Info, Minus, Package, Plus, PlusCircle, RefreshCw, Settings2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import socketService from '../services/socket';

const StockItemCard = ({ item, onAdjust, onQuickAdjust }) => {
  const isLow = item.full < item.threshold;
  
  return (
    <div className={`bg-slate-900/80 border ${isLow ? 'border-rose-500/50 shadow-lg shadow-rose-900/20' : 'border-slate-800'} rounded-3xl p-5 relative overflow-hidden group transition-all hover:-translate-y-1`}>
      {isLow && (
        <div className="absolute top-0 right-0 p-4">
          <AlertTriangle size={24} className="text-rose-500 animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
        </div>
      )}
      
      <div className="flex items-start gap-4 mb-6">
        <div className={`p-4 rounded-2xl ${isLow ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
          <Package size={28} />
        </div>
        <div className="flex-1 pt-1 pr-8">
          <h3 className="text-xl font-black text-white tracking-tight leading-tight mb-1">{item.type}</h3>
          <p className="text-slate-400 text-xs flex items-center gap-1 font-medium">
            <Info size={14} className="text-slate-500" /> Threshold: {item.threshold}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className={`rounded-2xl p-4 border ${isLow ? 'bg-rose-500/5 border-rose-500/20' : 'bg-slate-950/50 border-slate-800/50'} flex flex-col items-center justify-center`}>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Full Stock</p>
          <div className="flex items-center gap-3">
             <h4 className={`text-4xl font-black ${isLow ? 'text-rose-400' : 'text-white'}`}>{item.full}</h4>
          </div>
        </div>
        <div className="bg-slate-950/30 rounded-2xl p-4 border border-slate-800/30 flex flex-col items-center justify-center relative">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Empty Stock</p>
          <h4 className="text-2xl font-black text-slate-500">{item.empty}</h4>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => onQuickAdjust(item.id, -1)}
          className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 transition-all active:scale-95"
          title="Decrease stock by 1"
        >
          <Minus size={20} strokeWidth={3} />
        </button>
        <button 
          onClick={() => onAdjust(item.id, 'FULL')}
          className="flex-1 bg-slate-800 text-white font-bold rounded-xl border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center gap-2 text-sm active:scale-95 shadow-lg shadow-black/20"
        >
          <Settings2 size={16} /> Manage
        </button>
        <button 
          onClick={() => onQuickAdjust(item.id, 1)}
          className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-300 transition-all active:scale-95"
          title="Increase stock by 1"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

const Inventory = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustData, setAdjustData] = useState({ id: null, type: 'FULL', amount: 0, reason: '', itemName: '' });

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemData, setNewItemData] = useState({ cylinderType: '', initialStock: 0 });

  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      const mapped = res.data.map(item => ({
        id: item.id,
        type: item.cylinderType,
        full: item.stockLevel,
        empty: 0,
        threshold: 10
      }));
      setStocks(mapped);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();

    const socket = socketService.connect();

    socket.on('inventoryUpdate', (updated) => {
      setStocks(prevStocks => {
        const exists = prevStocks.find(s => s.type === updated.cylinderType);
        if (exists) {
          return prevStocks.map(item => 
            item.type === updated.cylinderType 
              ? { ...item, full: updated.stockLevel } 
              : item
          );
        } else {
          return [...prevStocks, {
            id: updated.id,
            type: updated.cylinderType,
            full: updated.stockLevel,
            empty: 0,
            threshold: 10
          }];
        }
      });
    });

    return () => {
      socket.off('inventoryUpdate');
    };
  }, []);

  const handleAdjustStock = (id, stockType) => {
    const item = stocks.find(s => s.id === id);
    setAdjustData({ id, type: stockType, amount: 0, reason: '', itemName: item.type });
    setIsAdjusting(true);
  };

  const handleQuickAdjust = async (id, delta) => {
    const item = stocks.find(s => s.id === id);
    if (!item) return;

    const newLevel = Math.max(0, item.full + delta);
    
    // Optimistic UI update
    setStocks(prev => prev.map(s => s.id === id ? { ...s, full: newLevel } : s));

    try {
      await api.patch(`/inventory/${encodeURIComponent(item.type)}`, { stockLevel: newLevel });
      toast.success(`${item.type} stock ${delta > 0 ? 'increased' : 'decreased'}`, {
        icon: delta > 0 ? '📈' : '📉',
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid #334155',
        }
      });
    } catch (err) {
      toast.error('Failed to quick adjust');
      fetchStock(); // Revert
    }
  };

  const saveAdjustment = async () => {
    try {
      const item = stocks.find(s => s.id === adjustData.id);
      const newLevel = Math.max(0, item.full + parseInt(adjustData.amount));
      await api.patch(`/inventory/${encodeURIComponent(item.type)}`, { stockLevel: newLevel });
      toast.success('Inventory updated successfully');
      fetchStock();
      setIsAdjusting(false);
    } catch (err) {
      toast.error('Failed to update inventory');
    }
  };

  const saveNewItem = async () => {
    if (!newItemData.cylinderType.trim()) {
      return toast.error('Cylinder type is required');
    }
    
    try {
      const newLevel = Math.max(0, parseInt(newItemData.initialStock) || 0);
      await api.patch(`/inventory/${encodeURIComponent(newItemData.cylinderType)}`, { stockLevel: newLevel });
      toast.success('New inventory item added successfully');
      fetchStock();
      setIsAddingItem(false);
      setNewItemData({ cylinderType: '', initialStock: 0 });
    } catch (err) {
      toast.error('Failed to add inventory item');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Package className="text-blue-400" size={24} />
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">Stock Management</h2>
          </div>
          <div className="flex items-center gap-2 ml-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <p className="text-slate-400 text-sm font-medium">Real-time sync active across all devices</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
          <button 
            onClick={() => setIsAddingItem(true)}
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <PlusCircle size={20} strokeWidth={2.5} />
            <span>New Type</span>
          </button>
          <button 
            onClick={fetchStock}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold p-3.5 rounded-2xl flex items-center justify-center transition-all border border-slate-700 relative overflow-hidden group active:scale-95 hover:shadow-lg shadow-black/20"
            title="Refresh Inventory"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
          </button>
        </div>
      </div>

      {/* Grid of Stocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stocks.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-700 rounded-3xl bg-slate-800/10 hover:bg-slate-800/30 transition-colors">
            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Package size={40} className="text-slate-500" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Your inventory is empty</h3>
            <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">Start tracking your gas cylinders by adding your first unit. You can manage full and empty distributions seamlessly.</p>
            <button 
              onClick={() => setIsAddingItem(true)}
              className="bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl mx-auto inline-flex items-center gap-2 hover:bg-blue-500 transition-colors shadow-xl shadow-blue-600/20 active:scale-95"
            >
              <PlusCircle size={20} />
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
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <History className="text-slate-400" size={20} />
          <h3 className="text-xl font-bold text-white tracking-tight">Recent Activity Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/20 text-slate-400 text-xs font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Item Type</th>
                <th className="px-6 py-4">Stock Type</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr className="text-slate-300 text-sm hover:bg-slate-800/10 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-400">Today, 11:30 AM</td>
                <td className="px-6 py-4 font-bold text-white">Domestic 14.2kg</td>
                <td className="px-6 py-4"><span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-[10px] uppercase font-black border border-blue-500/20">Full</span></td>
                <td className="px-6 py-4 flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[10px]"><ArrowUpCircle size={14}/> Addition</td>
                <td className="px-6 py-4 font-black text-emerald-400">+20</td>
                <td className="px-6 py-4">Admin</td>
                <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate">Refilled from warehouse batch #42</td>
              </tr>
              <tr className="text-slate-300 text-sm hover:bg-slate-800/10 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-400">Yesterday, 04:15 PM</td>
                <td className="px-6 py-4 font-bold text-white">Commercial 19kg</td>
                <td className="px-6 py-4"><span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-[10px] uppercase font-black border border-blue-500/20">Full</span></td>
                <td className="px-6 py-4 flex items-center gap-1.5 text-rose-400 font-bold uppercase text-[10px]"><ArrowDownCircle size={14}/> Removal</td>
                <td className="px-6 py-4 font-black text-rose-400">-5</td>
                <td className="px-6 py-4">Manager</td>
                <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate">Manual adjustment for offline sale</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      {isAdjusting && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 py-10 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl shadow-black animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 border-b border-slate-800 bg-slate-800/20">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Manage Bulk Adjustment</h3>
              <p className="text-sm text-slate-400 mt-2 font-medium">Currently managing: <span className="text-white bg-slate-800 px-2 py-0.5 rounded ml-1">{adjustData.itemName}</span></p>
            </div>
            <div className="p-6 md:p-8 space-y-8">
               
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4 text-center">Adjustment Amount</label>
                 <div className="flex items-center justify-center gap-6 md:gap-10">
                    <button 
                      onClick={() => setAdjustData({...adjustData, amount: adjustData.amount - 1})}
                      className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/50 transition-all active:scale-90"
                    >
                      <Minus size={24} />
                    </button>
                    <div className="text-center min-w-[100px]">
                      <span className={`text-6xl font-black tabular-nums transition-colors duration-300 ${adjustData.amount > 0 ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]' : adjustData.amount < 0 ? 'text-rose-400 drop-shadow-[0_0_15px_rgba(251,113,133,0.3)]' : 'text-white'}`}>
                        {adjustData.amount > 0 ? `+${adjustData.amount}` : adjustData.amount}
                      </span>
                    </div>
                    <button 
                      onClick={() => setAdjustData({...adjustData, amount: adjustData.amount + 1})}
                      className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/50 transition-all active:scale-90"
                    >
                      <Plus size={24} />
                    </button>
                 </div>
               </div>
               
               <div className="space-y-3">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Reason for adjustment</label>
                 <textarea 
                   value={adjustData.reason}
                   onChange={(e) => setAdjustData({...adjustData, reason: e.target.value})}
                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none h-32 resize-none placeholder:text-slate-700 font-medium text-sm transition-all shadow-inner"
                   placeholder="e.g. Returned from customer, Refilled at plant..."
                 ></textarea>
               </div>

               <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsAdjusting(false)}
                    className="flex-1 bg-slate-800 text-white font-bold py-4 rounded-2xl border border-slate-700 hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveAdjustment}
                    className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Settings2 size={18} /> Apply Changes
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 py-10 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl shadow-black animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 border-b border-slate-800 bg-slate-800/20">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Create Stock Type</h3>
              <p className="text-sm text-slate-400 mt-2 font-medium">Introduce a new cylinder category to your system.</p>
            </div>
            <div className="p-6 md:p-8 space-y-8">
               <div className="space-y-3">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Cylinder Type Name</label>
                 <input 
                   type="text"
                   autoFocus
                   value={newItemData.cylinderType}
                   onChange={(e) => setNewItemData({...newItemData, cylinderType: e.target.value})}
                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white hover:border-slate-700 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/50 outline-none placeholder:text-slate-700 font-bold text-lg transition-all shadow-inner"
                   placeholder="e.g. Commercial 19kg"
                 />
               </div>

               <div className="space-y-4">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center block">Initial Quantity</label>
                 <div className="flex items-center justify-center gap-6 md:gap-10 bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50">
                    <button 
                      onClick={() => setNewItemData({...newItemData, initialStock: Math.max(0, newItemData.initialStock - 1)})}
                      className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/50 transition-all active:scale-90"
                    >
                      <Minus size={24} />
                    </button>
                    <div className="text-center min-w-[80px]">
                      <span className="text-5xl font-black text-white tabular-nums">
                        {newItemData.initialStock}
                      </span>
                    </div>
                    <button 
                      onClick={() => setNewItemData({...newItemData, initialStock: newItemData.initialStock + 1})}
                      className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/50 transition-all active:scale-90"
                    >
                      <Plus size={24} />
                    </button>
                 </div>
               </div>

               <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => {
                      setIsAddingItem(false);
                      setNewItemData({ cylinderType: '', initialStock: 0 });
                    }}
                    className="flex-1 bg-slate-800 text-white font-bold py-4 rounded-2xl border border-slate-700 hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveNewItem}
                    className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!newItemData.cylinderType.trim()}
                  >
                    <PlusCircle size={18} /> Add Target
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
