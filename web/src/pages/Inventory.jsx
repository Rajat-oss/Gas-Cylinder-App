import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Info, Minus, Package, Plus, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import socketService from '../services/socket';

const StockCard = ({ title, count, type, threshold = 10 }) => {
  const isLow = count < threshold;
  
  return (
    <div className={`bg-slate-900 border ${isLow ? 'border-rose-500/50 shadow-lg shadow-rose-900/10' : 'border-slate-800'} rounded-3xl p-6 relative overflow-hidden group transition-all hover:scale-[1.02]`}>
      {isLow && (
        <div className="absolute top-0 right-0 p-3">
          <AlertTriangle size={20} className="text-rose-500 animate-pulse" />
        </div>
      )}
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${type === 'FULL' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-700/50 text-slate-400'}`}>
          <Package size={24} />
        </div>
        <div className="text-right">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{type} STOCK</p>
          <h4 className="text-3xl font-black text-white">{count}</h4>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-white font-bold">{title}</h3>
        <p className="text-slate-400 text-xs">Threshold: {threshold} units</p>
      </div>
      
      {isLow && (
        <div className="mt-4 py-2 px-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          <p className="text-[10px] font-extrabold text-rose-400 uppercase tracking-tight">Stock is low. Reorder now.</p>
        </div>
      )}
    </div>
  );
};

const Inventory = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustData, setAdjustData] = useState({ id: null, type: 'FULL', amount: 0, reason: '' });

  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      // For now, map backend types to our UI format
      const mapped = res.data.map(item => ({
        id: item.id,
        type: item.cylinderType,
        full: item.stockLevel, // Simplified mapping
        empty: 0, // Mock empty for now as schema only has one level
        threshold: 10
      }));
      setStocks(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();

    // Socket listeners for real-time updates
    const socket = socketService.connect();

    socket.on('inventoryUpdate', (updated) => {
      console.log('Stock update received:', updated);
      
      setStocks(prevStocks => 
        prevStocks.map(item => 
          item.type === updated.cylinderType 
            ? { ...item, full: updated.stockLevel } 
            : item
        )
      );

      toast.success(`${updated.cylinderType} stock was updated elsewhere`, {
        icon: '🔄',
        duration: 3000
      });
    });

    return () => {
      socket.off('inventoryUpdate');
      // No need to disconnect here if socket is reused by other components
    };
  }, []);

  const handleAdjustStock = (id, stockType) => {
    const item = stocks.find(s => s.id === id);
    setAdjustData({ id, type: stockType, amount: 0, reason: '', itemName: item.type });
    setIsAdjusting(true);
  };

  const saveAdjustment = async () => {
    try {
      const item = stocks.find(s => s.id === adjustData.id);
      const newLevel = Math.max(0, item.full + parseInt(adjustData.amount));
      await api.patch(`/inventory/${item.type}`, { stockLevel: newLevel });
      toast.success('Inventory updated successfully');
      fetchStock();
      setIsAdjusting(false);
    } catch (err) {
      toast.error('Failed to update inventory');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tight">Inventory Tracking</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-slate-400 text-sm italic">Real-time stock monitoring active</p>
          </div>
        </div>
        <button className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all border border-slate-700">
          <RefreshCw size={18} />
          <span>Refresh Stock</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {stocks.map((item) => (
          <div key={item.id} className="space-y-4">
            <h3 className="text-lg font-bold text-slate-300 ml-4 flex items-center gap-2">
              <Info size={16} className="text-blue-500" />
              {item.type}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="cursor-pointer" onClick={() => handleAdjustStock(item.id, 'FULL')}>
                <StockCard title="Full Units" count={item.full} type="FULL" threshold={item.threshold} />
              </div>
              <div className="cursor-pointer" onClick={() => handleAdjustStock(item.id, 'EMPTY')}>
                <StockCard title="Empty Units" count={item.empty} type="EMPTY" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-xl font-bold text-white">Stock Adjustment History</h3>
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
              <tr className="text-slate-300 text-sm">
                <td className="px-6 py-4 font-medium">Today, 11:30 AM</td>
                <td className="px-6 py-4 font-bold text-white">Domestic 14.2kg</td>
                <td className="px-6 py-4"><span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] uppercase font-black">Full</span></td>
                <td className="px-6 py-4 flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[10px]"><ArrowUpCircle size={14}/> Addition</td>
                <td className="px-6 py-4 font-black">+20</td>
                <td className="px-6 py-4">Admin</td>
                <td className="px-6 py-4 text-slate-500 italic truncate max-w-[150px]">Refilled from warehouse batch #42</td>
              </tr>
              <tr className="text-slate-300 text-sm">
                <td className="px-6 py-4 font-medium">Yesterday, 04:15 PM</td>
                <td className="px-6 py-4 font-bold text-white">Commercial 19kg</td>
                <td className="px-6 py-4"><span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] uppercase font-black">Full</span></td>
                <td className="px-6 py-4 flex items-center gap-1.5 text-rose-400 font-bold uppercase text-[10px]"><ArrowDownCircle size={14}/> Removal</td>
                <td className="px-6 py-4 font-black">-5</td>
                <td className="px-6 py-4">Manager</td>
                <td className="px-6 py-4 text-slate-500 italic truncate max-w-[150px]">Manual adjustment for offline sale</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {isAdjusting && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">Manual Adjustment</h3>
              <p className="text-xs text-slate-400 mt-1">{adjustData.itemName} - {adjustData.type} Stock</p>
            </div>
            <div className="p-6 space-y-6">
               <div className="flex items-center justify-center gap-8 py-4">
                  <button 
                    onClick={() => setAdjustData({...adjustData, amount: adjustData.amount - 1})}
                    className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white hover:bg-slate-700 transition-colors"
                  >
                    <Minus />
                  </button>
                  <div className="text-center">
                    <span className={`text-5xl font-black ${adjustData.amount > 0 ? 'text-emerald-400' : adjustData.amount < 0 ? 'text-rose-400' : 'text-white'}`}>
                      {adjustData.amount > 0 ? `+${adjustData.amount}` : adjustData.amount}
                    </span>
                  </div>
                  <button 
                    onClick={() => setAdjustData({...adjustData, amount: adjustData.amount + 1})}
                    className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white hover:bg-slate-700 transition-colors"
                  >
                    <Plus />
                  </button>
               </div>
               
               <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase ml-1">Reason for adjustment</label>
                 <textarea 
                   value={adjustData.reason}
                   onChange={(e) => setAdjustData({...adjustData, reason: e.target.value})}
                   className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none h-24 resize-none placeholder:text-slate-600 font-medium text-sm"
                   placeholder="e.g. Returned from customer, Refilled at plant..."
                 ></textarea>
               </div>

               <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsAdjusting(false)}
                    className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-2xl border border-slate-700"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveAdjustment}
                    className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95"
                  >
                    Save Changes
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
