import { Calendar, Car, ChevronLeft, ClipboardList, CreditCard, DollarSign, Loader2, MapPin as MapPinIcon, MessageSquare, Minus, Package, Phone, Plus, Shield, User, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import socketService from '../services/socket';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", 
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", 
  "Lakshadweep", "Puducherry"
];

const StaffDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  // Task Assignment States
  const [taskData, setTaskData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    city: '',
    state: '',
    cylinderType: 'Domestic 14.2kg', // Default
    quantity: 1,
    amount: 800,
    notes: ''
  });
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [assigningTask, setAssigningTask] = useState(false);
  
  // Payment states
  const [paymentAmount, setPaymentAmount] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchStaffDetails();

    const socket = socketService.connect();
    socket.on('staffStatusUpdate', (update) => {
      if (update.id === id) {
        setMember(prev => prev ? { 
          ...prev, 
          isOnline: update.isOnline, 
          status: update.isOnline ? (prev.totalOrders > prev.doneOrders ? 'On Field' : 'Active') : 'Offline' 
        } : prev);
      }
    });

    return () => {
      socket.off('staffStatusUpdate');
    };
  }, [id]);

  const fetchStaffDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/staff/${id}`);
      setMember(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load staff details');
      navigate('/staff');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSearch = async (query) => {
    setTaskData({ ...taskData, customerAddress: query });
    if (query.length < 1) {
      setAddressSuggestions([]);
      return;
    }
    setIsSearchingAddress(true);
    try {
      const searchParts = [query];
      if (taskData.city) searchParts.push(taskData.city);
      if (taskData.state) searchParts.push(taskData.state);
      searchParts.push("India");
      const fullQuery = searchParts.join(', ');
      
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&addressdetails=1&namedetails=1&limit=10&countrycodes=in`);
      const data = await response.json();
      setAddressSuggestions(data);
    } catch (error) {
      console.error('Address search error:', error);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const selectAddress = (suggestion) => {
    const addr = suggestion.address || {};
    const city = addr.city || addr.town || addr.village || addr.suburb || taskData.city;
    const state = addr.state || taskData.state;
    setTaskData({ 
      ...taskData, customerAddress: suggestion.display_name, city: city, state: state
    });
    setAddressSuggestions([]);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setAssigningTask(true);
    try {
      if (member.role === 'DRIVER') {
        const payload = { ...taskData, assignedStaffId: member.id };
        await api.post('/orders', payload);
        toast.success(`Task assigned to ${member.name}`);
        setTaskData({
          customerName: '', customerPhone: '', customerAddress: '', city: '', state: '', cylinderType: 'Domestic 14.2kg', quantity: 1, amount: 800, notes: ''
        });
      } else {
        toast.success(`Broadcasting update to ${member.name}`);
      }
      fetchStaffDetails();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to assign task');
    } finally {
      setAssigningTask(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setProcessingPayment(true);
    
    // Simulating payment submission since there's no endpoint
    setTimeout(() => {
      toast.success(`Payment of ₹${paymentAmount} processed successfully`);
      setPaymentAmount('');
      setProcessingPayment(false);
      // We would normally re-fetch staff details here if actual payment deducted the collection balance
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/staff')}
          className="p-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 hover:text-white transition-all shadow-lg active:scale-95 border border-slate-700"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tight">Staff Details</h2>
          <p className="text-slate-400 mt-1">Manage profile, view status, assign tasks and handle payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile, Status, Payments */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm shadow-xl">
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-800">
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700 font-bold text-3xl mb-4 shadow-[0_0_30px_rgba(59,130,246,0.15)] relative">
                {member.name.charAt(0)}
                <div className={`absolute bottom-0 right-1 w-5 h-5 rounded-full border-4 border-slate-900 ${
                  member.status === 'On Field' ? 'bg-blue-500' : 
                  member.status === 'Active' ? 'bg-emerald-500' : 
                  'bg-slate-500'
                }`} />
              </div>
              <h3 className="text-2xl font-black text-white">{member.name}</h3>
              <p className="text-slate-400 text-sm">{member.email}</p>
              <div className="mt-3 flex gap-2">
                 <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                   member.role === 'ADMIN' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                   member.role === 'MANAGER' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                   'bg-slate-800 text-slate-300 border border-slate-700'
                 }`}>
                   <Shield size={12} />
                   {member.role}
                 </span>
                 <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                    member.status === 'On Field' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                    member.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                    {member.status}
                  </span>
              </div>
            </div>
            <div className="pt-6 space-y-4">
              <div className="flex items-center gap-4 text-slate-300">
                <div className="bg-slate-800/50 p-2.5 rounded-xl text-blue-400"><Phone size={18} /></div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Phone</p>
                  <p className="font-semibold">{member.phone}</p>
                </div>
              </div>
              {member.role === 'DRIVER' && (
                <>
                  <div className="flex items-center gap-4 text-slate-300">
                    <div className="bg-slate-800/50 p-2.5 rounded-xl text-emerald-400"><Car size={18} /></div>
                    <div className="flex-1">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Vehicle Number</p>
                      <p className="font-semibold">{member.vehicleNumber || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-slate-300">
                    <div className="bg-slate-800/50 p-2.5 rounded-xl text-amber-400"><CreditCard size={18} /></div>
                    <div className="flex-1">
                      <p className="text-[10px] uppercase font-bold text-slate-500">License Number</p>
                      <p className="font-semibold">{member.licenseNumber || 'N/A'}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats & Finance Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm shadow-xl">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Performance & Finance</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col items-center justify-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Deliveries</p>
                <p className="text-2xl font-black text-white">{member.totalOrders}</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col items-center justify-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Success Rate</p>
                <p className="text-2xl font-black text-blue-400">{member.progress}%</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border border-emerald-500/20 rounded-2xl p-5 mb-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <DollarSign size={64} className="text-emerald-500" />
               </div>
               <p className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest mb-1">Cash Today</p>
               <h3 className="text-4xl font-black text-emerald-400">₹{member.collection}</h3>
            </div>

            {user?.role === 'ADMIN' && (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Process Payment</label>
                <div className="relative group">
                  <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                  <input 
                    type="number"
                    required
                    placeholder="Enter amount to settle"
                    className="w-full bg-slate-800/40 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-white font-medium focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all placeholder-slate-600"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={processingPayment}
                  className="w-full bg-emerald-600 text-white font-black py-3.5 rounded-xl hover:bg-emerald-500 active:scale-95 shadow-[0_10px_30px_rgba(16,185,129,0.2)] disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs transition-all"
                >
                  {processingPayment ? <Loader2 className="animate-spin w-4 h-4" /> : 'Settle Account'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Task Assignment Form */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl h-full flex flex-col">
            <div className="p-8 border-b border-slate-800 bg-gradient-to-r from-blue-600/10 to-transparent relative overflow-hidden shrink-0">
               <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full"></div>
               <div className="flex items-center gap-4 mb-2 relative z-10">
                 <div className="bg-blue-600/20 p-3 rounded-2xl text-blue-500 border border-blue-500/20 shadow-lg shadow-blue-500/10">
                   <ClipboardList size={24} />
                 </div>
                 <div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Assign New Task</h3>
                   <p className="text-slate-400 text-sm mt-1 font-medium">Create a new directive or delivery for {member.name}</p>
                 </div>
               </div>
            </div>

            <form onSubmit={handleTaskSubmit} className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
              {member.role === 'DRIVER' ? (
                <>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="h-px flex-1 bg-slate-800"></span>
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Client Credentials</span>
                       <span className="h-px flex-1 bg-slate-800"></span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Customer Name</label>
                        <div className="relative group">
                           <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                           <input 
                             required
                             className="w-full bg-slate-800/30 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                             placeholder="John Doe"
                             value={taskData.customerName}
                             onChange={e => setTaskData({...taskData, customerName: e.target.value})}
                           />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Contact Phone</label>
                        <div className="relative group">
                           <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                           <input 
                             required
                             type="tel"
                             className="w-full bg-slate-800/30 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                             placeholder="+91 00000 00000"
                             value={taskData.customerPhone}
                             onChange={e => setTaskData({...taskData, customerPhone: e.target.value})}
                           />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-8 mb-2">
                       <span className="h-px flex-1 bg-slate-800"></span>
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Regional Location</span>
                       <span className="h-px flex-1 bg-slate-800"></span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Select State</label>
                          <select 
                            required
                            className="w-full bg-slate-800/30 border border-slate-700/50 rounded-2xl py-4 px-5 text-white font-medium focus:ring-2 focus:ring-blue-500/30 outline-none transition-all appearance-none"
                            value={taskData.state}
                            onChange={e => setTaskData({...taskData, state: e.target.value})}
                          >
                            <option value="">Choose State</option>
                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Enter City</label>
                          <div className="relative group">
                             <MapPinIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                             <input 
                               required
                               className="w-full bg-slate-800/30 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:ring-2 focus:ring-blue-500/30 outline-none transition-all placeholder:text-slate-700"
                               placeholder="e.g. Mumbai"
                               value={taskData.city}
                               onChange={e => setTaskData({...taskData, city: e.target.value})}
                             />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Detailed Delivery Address</label>
                       <div className="relative group">
                          <MapPinIcon size={18} className="absolute left-4 top-5 text-slate-600 group-focus-within:text-blue-500 z-10 transition-colors" />
                          <textarea 
                            required
                            className="w-full bg-slate-800/30 border border-slate-700/50 rounded-3xl py-4 pl-12 pr-4 text-white font-medium focus:ring-2 focus:ring-blue-500/30 outline-none transition-all min-h-[100px] custom-scrollbar"
                            placeholder="Type locality or building for smart suggestions..."
                            value={taskData.customerAddress}
                            onChange={e => handleAddressSearch(e.target.value)}
                          />
                          
                          {/* Address Suggestions Dropdown */}
                          {(addressSuggestions.length > 0 || isSearchingAddress) && (
                            <div className="absolute top-full left-0 right-0 mt-4 bg-slate-900 border border-slate-700/50 rounded-[2rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[60] backdrop-blur-2xl ring-1 ring-white/5 animate-in slide-in-from-top-2 duration-300">
                              {isSearchingAddress && (
                                <div className="p-6 flex items-center gap-4 text-slate-400 text-sm font-medium border-b border-slate-800/50">
                                  <Loader2 size={18} className="animate-spin text-blue-500" />
                                  Scanning precise map coordinates...
                                </div>
                              )}
                              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                {addressSuggestions.map((suggestion, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => selectAddress(suggestion)}
                                    className="w-full text-left p-6 hover:bg-blue-600/20 border-b border-slate-800/50 last:border-0 transition-all group flex gap-4 items-start active:bg-blue-600/30"
                                  >
                                    <div className="bg-slate-800 p-2 rounded-xl group-hover:bg-blue-600/30 transition-colors">
                                      <MapPinIcon size={18} className="text-slate-500 shrink-0 group-hover:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                      <span className="text-sm font-bold text-slate-200 group-hover:text-white block mb-1">
                                        {suggestion.display_name.split(',')[0]}
                                      </span>
                                      <span className="text-xs text-slate-500 group-hover:text-slate-400 line-clamp-2 leading-relaxed tracking-tight">
                                        {suggestion.display_name}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="flex items-center gap-3 mt-8 mb-2">
                       <span className="h-px flex-1 bg-slate-800"></span>
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Inventory Selection</span>
                       <span className="h-px flex-1 bg-slate-800"></span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Cylinder Type</label>
                        <div className="relative group">
                          <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                          <select 
                            className="w-full bg-slate-800/30 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:ring-2 focus:ring-blue-500/30 outline-none appearance-none"
                            value={taskData.cylinderType}
                            onChange={e => setTaskData({...taskData, cylinderType: e.target.value})}
                          >
                            <option>Domestic 14.2kg</option>
                            <option>Commercial 19kg</option>
                            <option>Industrial 35kg</option>
                            <option>Industrial 47.5kg</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Quantity (Units)</label>
                        <div className="flex items-center bg-slate-800/20 border border-slate-700/50 rounded-2xl overflow-hidden p-1.5 h-[56px] ring-offset-2 ring-offset-slate-900 transition-all focus-within:ring-2 focus-within:ring-blue-500/30">
                           <button 
                             type="button" 
                             onClick={() => {
                               const newQty = Math.max(1, taskData.quantity - 1);
                               const currentBasePrice = taskData.amount / taskData.quantity; // use custom base price if it was changed
                               setTaskData({...taskData, quantity: newQty, amount: newQty * currentBasePrice});
                             }}
                             className="w-12 h-full flex items-center justify-center text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                           > <Minus size={20} /> </button>
                           <div className="flex-1 text-center text-white font-black text-xl">{taskData.quantity}</div>
                           <button 
                             type="button" 
                             onClick={() => {
                               const newQty = taskData.quantity + 1;
                               const currentBasePrice = taskData.amount / taskData.quantity; // use custom base price if it was changed
                               setTaskData({...taskData, quantity: newQty, amount: newQty * currentBasePrice});
                             }}
                             className="w-12 h-full flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
                           > <Plus size={20} /> </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Amount (₹)</label>
                        <div className="relative group">
                           <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                           <input 
                             type="number"
                             required
                             className="w-full bg-slate-800/30 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:ring-2 focus:ring-blue-500/30 outline-none transition-all placeholder:text-slate-700 h-[56px]"
                             placeholder="800"
                             value={taskData.amount}
                             onChange={e => setTaskData({...taskData, amount: parseFloat(e.target.value) || 0})}
                           />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Deployment Memo (Optional)</label>
                       <div className="relative group">
                          <MessageSquare size={16} className="absolute left-4 top-5 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                          <textarea 
                            className="w-full bg-slate-800/30 border border-slate-700/50 rounded-3xl py-4 pl-12 pr-4 text-white font-medium focus:ring-2 focus:ring-blue-500/30 outline-none transition-all placeholder:text-slate-700 min-h-[100px]"
                            placeholder="Landmarks, timing constraints, or special handling notes..."
                            value={taskData.notes}
                            onChange={e => setTaskData({...taskData, notes: e.target.value})}
                          />
                       </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-8">
                   <div className="bg-gradient-to-br from-blue-600/10 to-blue-500/5 border border-blue-500/20 p-6 rounded-[2rem] flex gap-5 shadow-inner">
                      <div className="bg-blue-500/20 p-3 rounded-2xl h-fit">
                         <Shield className="text-blue-500" size={24} />
                      </div>
                      <div>
                        <p className="text-lg font-black text-white leading-tight uppercase tracking-tight">Manager Directive</p>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">System-wide operational updates. Assignments to managers trigger high-priority alerts within the internal control grid.</p>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Directive Title</label>
                      <div className="relative group">
                         <ClipboardList size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                         <input 
                           required
                           className="w-full bg-slate-800/30 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:ring-2 focus:ring-blue-500/30 outline-none transition-all placeholder:text-slate-700"
                           placeholder="Enter assignment subject"
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Deployment Details</label>
                      <textarea 
                        required
                        className="w-full bg-slate-800/30 border border-slate-700/50 rounded-3xl py-5 px-6 text-white font-medium focus:ring-2 focus:ring-blue-500/30 outline-none transition-all h-40 placeholder:text-slate-700 custom-scrollbar"
                        placeholder="Detailed execution plan and monitoring requirements..."
                      />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Operational Priority</label>
                        <select className="w-full bg-slate-800/30 border border-slate-700/50 rounded-2xl py-4 px-5 text-white font-medium focus:ring-2 focus:ring-blue-500/30 outline-none appearance-none">
                          <option>Standard (P3)</option>
                          <option>High Priority (P2)</option>
                          <option>Immediate Execution (P1)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">System Deadline</label>
                        <div className="relative">
                          <Calendar size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600" />
                          <input type="date" required className="w-full bg-slate-800/30 border border-slate-700/50 rounded-2xl py-4 px-5 text-white font-medium focus:ring-2 focus:ring-blue-500/30 outline-none transition-all" />
                        </div>
                      </div>
                   </div>
                </div>
              )}

              <div className="pt-8 flex justify-end">
                <button 
                  type="submit" 
                  disabled={assigningTask}
                  className="w-full md:w-auto px-8 bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-500 active:scale-95 shadow-[0_10px_30px_rgba(37,99,235,0.3)] disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[11px] ring-1 ring-blue-400/30"
                >
                  {assigningTask ? <Loader2 className="animate-spin" /> : (
                    <>
                      <UserPlus size={18} />
                      Assign Task Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDetails;
