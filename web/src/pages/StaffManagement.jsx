import { Calendar, Car, ClipboardList, CreditCard, Edit2, Filter, Loader2, Lock, Mail, MapPin as MapPinIcon, MessageSquare, Minus, Package, Phone, Plus, Search, Shield, User, UserPlus, UserX, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
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

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'DRIVER', password: '', vehicleNumber: '', licenseNumber: '' });

  // Task Assignment States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [taskData, setTaskData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    city: '',
    state: '',
    cylinderType: 'Domestic 14.2kg', // Default
    quantity: 1,
    notes: ''
  });
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  const handleAddressSearch = async (query) => {
    setTaskData({ ...taskData, customerAddress: query });
    
    if (query.length < 1) {
      setAddressSuggestions([]);
      return;
    }

    setIsSearchingAddress(true);
    try {
      // Build intelligent search query
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
      ...taskData, 
      customerAddress: suggestion.display_name,
      city: city,
      state: state
    });
    setAddressSuggestions([]);
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/staff');
      setStaff(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();

    const socket = socketService.connect();
    socket.on('staffStatusUpdate', (update) => {
      console.log('Staff status update:', update);
      setStaff(prev => prev.map(s => 
        s.id === update.id 
          ? { 
              ...s, 
              isOnline: update.isOnline, 
              status: update.isOnline ? (s.totalOrders > s.doneOrders ? 'On Field' : 'Active') : 'Offline' 
            } 
          : s
      ));
    });

    return () => {
      socket.off('staffStatusUpdate');
    };
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingStaff(item);
      setFormData({
        name: item.name || '',
        email: item.email || '',
        phone: item.phone || '',
        role: item.role || 'DRIVER',
        password: '',
        vehicleNumber: item.vehicleNumber || '',
        licenseNumber: item.licenseNumber || ''
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'DRIVER',
        password: '',
        vehicleNumber: '',
        licenseNumber: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await api.delete(`/staff/${id}`);
      toast.success('Staff member deleted');
      fetchStaff();
    } catch (err) {
      toast.error('Failed to delete staff member');
    }
  };

  const handleOpenTaskModal = (member) => {
    setSelectedStaff(member);
    setTaskData({
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      cylinderType: 'Domestic 14.2kg',
      quantity: 1,
      notes: ''
    });
    setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedStaff.role === 'DRIVER') {
        const payload = {
          ...taskData,
          assignedStaffId: selectedStaff.id
        };
        await api.post('/orders', payload);
        toast.success(`Task assigned to ${selectedStaff.name}`);
      } else {
        // Manager task assignment could be different logic
        toast.success(`Broadcasting update to ${selectedStaff.name}`);
      }
      setIsTaskModalOpen(false);
      fetchStaff();
    } catch (err) {
      console.error('Task Assignment Error:', err.response?.data || err.message);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to assign task');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingStaff) {
        await api.put(`/staff/${editingStaff.id}`, formData);
        toast.success('Staff details updated');
      } else {
        await api.post('/staff', formData);
        toast.success('New staff member added');
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save staff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tight">Staff Management</h2>
          <p className="text-slate-400 mt-1">Manage delivery drivers and system managers</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Plus size={20} />
          <span>Add New Staff</span>
        </button>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-slate-800 flex flex-wrap gap-4 items-center justify-between bg-slate-900/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              className="w-full bg-slate-800 border-none rounded-xl py-3 pl-12 pr-4 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-slate-800 text-slate-300 px-4 py-3 rounded-xl hover:bg-slate-700 transition-colors">
              <Filter size={18} />
              <span className="text-sm font-semibold">Filter</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/20 text-slate-400 text-xs font-bold uppercase tracking-widest">
                <th className="px-6 py-5">Name & Role</th>
                <th className="px-6 py-5">Phone</th>
                <th className="px-6 py-5">Status Today</th>
                <th className="px-6 py-5 text-center">Deliveries</th>
                <th className="px-6 py-5 text-right">Cash Today</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {staff.map((member) => (
                <tr 
                  key={member.id} 
                  className="hover:bg-slate-800/60 transition-all group cursor-pointer border-l-2 border-transparent hover:border-blue-500"
                  onClick={() => handleOpenTaskModal(member)}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700 font-bold group-hover:border-blue-500 transition-colors">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-bold group-hover:text-blue-400">{member.name}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] text-slate-500 font-medium">ID: {member.id.substring(0,8)}</span>
                           <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded leading-none flex items-center gap-1 w-fit ${
                             member.role === 'ADMIN' ? 'bg-rose-500/10 text-rose-400' : member.role === 'MANAGER' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-700/50 text-slate-300'
                           }`}>
                             <Shield size={10} />
                             {member.role}
                           </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-300 font-medium">{member.phone}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      member.status === 'On Field' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 
                      member.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 
                      'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        member.status === 'On Field' ? 'bg-blue-400' : 
                        member.status === 'Active' ? 'bg-emerald-400' : 
                        'bg-slate-500'
                      } ${member.status !== 'Offline' ? 'animate-pulse' : ''}`} />
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-white font-bold">{member.totalOrders}</span>
                  </td>
                  <td className="px-6 py-5 text-right font-bold text-white">₹{member.collection}</td>
                  <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center items-center gap-2">
                      <button onClick={() => handleOpenModal(member)} className="p-2 text-slate-400 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg transition-all" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(member.id)}
                        className="p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg transition-all" 
                        title="Delete"
                      >
                        <UserX size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[110] flex items-center justify-center p-4 py-8">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-full">
            <div className="p-8 border-b border-slate-800 bg-gradient-to-r from-blue-600/10 to-transparent relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full"></div>
              <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="bg-blue-600/20 p-4 rounded-3xl text-blue-500 border border-blue-500/20 shadow-lg shadow-blue-500/10">
                  <ClipboardList size={28} />
                </div>
                <button 
                  onClick={() => setIsTaskModalOpen(false)}
                  className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-400 transition-all border border-slate-700/50 backdrop-blur-md"
                > <XCircle size={20} /> </button>
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2">Assign Responsibility</h3>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{selectedStaff.role} • {selectedStaff.name}</p>
              </div>
            </div>

            <form onSubmit={handleTaskSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
              {selectedStaff.role === 'DRIVER' ? (
                <>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="h-px flex-1 bg-slate-800"></span>
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Client Credentials</span>
                       <span className="h-px flex-1 bg-slate-800"></span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
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

                    <div className="grid grid-cols-2 gap-6">
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
                            <div className="absolute top-full left-0 right-0 mt-4 bg-slate-900/95 border border-slate-700/50 rounded-[2rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-[60] backdrop-blur-2xl ring-1 ring-white/5 animate-in slide-in-from-top-2 duration-300">
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
                                    title={suggestion.display_name}
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

                    <div className="grid grid-cols-2 gap-6">
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
                             onClick={() => setTaskData({...taskData, quantity: Math.max(1, taskData.quantity - 1)})}
                             className="w-12 h-full flex items-center justify-center text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                           > <Minus size={20} /> </button>
                           <div className="flex-1 text-center text-white font-black text-xl">{taskData.quantity}</div>
                           <button 
                             type="button" 
                             onClick={() => setTaskData({...taskData, quantity: taskData.quantity + 1})}
                             className="w-12 h-full flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
                           > <Plus size={20} /> </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Deployment Memo</label>
                       <div className="relative group">
                          <MessageSquare size={16} className="absolute left-4 top-5 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                          <textarea 
                            className="w-full bg-slate-800/30 border border-slate-700/50 rounded-3xl py-4 pl-12 pr-4 text-white font-medium focus:ring-2 focus:ring-blue-500/30 outline-none transition-all placeholder:text-slate-700"
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
                        className="w-full bg-slate-800/30 border border-slate-700/50 rounded-3xl py-5 px-6 text-white font-medium focus:ring-2 focus:ring-blue-500/30 outline-none transition-all h-40 placeholder:text-slate-700"
                        placeholder="Detailed execution plan and monitoring requirements..."
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-6">
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
                          <input type="date" className="w-full bg-slate-800/30 border border-slate-700/50 rounded-2xl py-4 px-5 text-white font-medium focus:ring-2 focus:ring-blue-500/30 outline-none transition-all" />
                        </div>
                      </div>
                   </div>
                </div>
              )}

              <div className="flex gap-4 pt-8 sticky bottom-0 bg-slate-900/80 backdrop-blur-md pb-4 pt-6 border-t border-slate-800/50 z-[70]">
                <button 
                  type="button" 
                  onClick={() => setIsTaskModalOpen(false)}
                  className="flex-1 bg-slate-800/50 text-slate-300 font-bold py-5 rounded-2xl hover:bg-slate-800 hover:text-white border border-slate-700/50 transition-all active:scale-95 flex items-center justify-center gap-2"
                > 
                  <UserX size={18} />
                  Cancel 
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-[1.5] bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-500 active:scale-95 shadow-[0_10px_30px_rgba(37,99,235,0.3)] disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[11px] ring-1 ring-blue-400/30"
                >
                  {loading ? <Loader2 className="animate-spin" /> : (
                    <>
                      <UserPlus size={18} />
                      Confirm Assignment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">{editingStaff ? 'Edit Staff Details' : 'Register New Staff'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">Esc</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-400 ml-1">Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                      <User size={18} />
                    </div>
                    <input 
                      type="text" 
                      required 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter full name"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-400 ml-1">Phone Number</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                      <Phone size={18} />
                    </div>
                    <input 
                      type="tel" 
                      required 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="10-digit mobile"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-400 ml-1">Email ID</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="email@example.com"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-400 ml-1">Temp Password {editingStaff && '(Leave blank to keep current)'}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input 
                      type="password" 
                      required={!editingStaff}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className={`grid ${formData.role === 'DRIVER' ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-400 ml-1">Assign Role</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                      <Shield size={18} />
                    </div>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none"
                    >
                      <option value="DRIVER">Delivery Staff (Driver)</option>
                      <option value="MANAGER">Operations Manager</option>
                      <option value="STAFF">Regular Staff</option>
                    </select>
                  </div>
                </div>

                {formData.role === 'DRIVER' && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-400 ml-1">Vehicle Number</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                        <Car size={18} />
                      </div>
                      <input 
                        type="text" 
                        required 
                        value={formData.vehicleNumber}
                        onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                        placeholder="HR-XX-XXXX"
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {formData.role === 'DRIVER' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-400 ml-1">License Number</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                      <CreditCard size={18} />
                    </div>
                    <input 
                      type="text" 
                      required 
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                      placeholder="DL-XXXXXXXXXXXXX"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-700 transition-all border border-slate-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : (editingStaff ? 'Update Staff' : 'Create Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
