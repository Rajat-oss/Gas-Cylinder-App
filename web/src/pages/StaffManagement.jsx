import {
  ClipboardList,
  Edit2,
  Filter,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import socketService from "../services/socket";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const StaffManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "DRIVER",
    password: "",
    vehicleNumber: "",
    licenseNumber: "",
  });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [taskData, setTaskData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    city: "",
    state: "",
    cylinderType: "Domestic 14.2kg",
    quantity: 1,
    amount: 800,
    notes: "",
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
      const searchParts = [query];
      if (taskData.city) searchParts.push(taskData.city);
      if (taskData.state) searchParts.push(taskData.state);
      searchParts.push("India");
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchParts.join(", "))}&addressdetails=1&namedetails=1&limit=10&countrycodes=in`,
      );
      const data = await response.json();
      setAddressSuggestions(data);
    } catch (error) {
      console.error("Address search error:", error);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const selectAddress = (suggestion) => {
    const addr = suggestion.address || {};
    setTaskData({
      ...taskData,
      customerAddress: suggestion.display_name,
      city:
        addr.city || addr.town || addr.village || addr.suburb || taskData.city,
      state: addr.state || taskData.state,
    });
    setAddressSuggestions([]);
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get("/staff");
      setStaff(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load staff members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    const socket = socketService.connect();
    socket.on("staffStatusUpdate", (update) => {
      setStaff((prev) =>
        prev.map((s) =>
          s.id === update.id
            ? {
                ...s,
                isOnline: update.isOnline,
                status: update.isOnline
                  ? s.totalOrders > s.doneOrders
                    ? "On Field"
                    : "Active"
                  : "Offline",
              }
            : s,
        ),
      );
    });
    socket.on("newOrder", fetchStaff);
    socket.on("orderUpdated", fetchStaff);
    return () => {
      socket.off("staffStatusUpdate");
      socket.off("newOrder");
      socket.off("orderUpdated");
    };
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingStaff(item);
      setFormData({
        name: item.name || "",
        email: item.email || "",
        phone: item.phone || "",
        role: item.role || "DRIVER",
        password: "",
        vehicleNumber: item.vehicleNumber || "",
        licenseNumber: item.licenseNumber || "",
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "DRIVER",
        password: "",
        vehicleNumber: "",
        licenseNumber: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member?"))
      return;
    try {
      await api.delete(`/staff/${id}`);
      toast.success("Staff member deleted");
      fetchStaff();
    } catch (err) {
      toast.error("Failed to delete staff member");
    }
  };

  const handleOpenTaskModal = (member) => {
    setSelectedStaff(member);
    setTaskData({
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      cylinderType: "Domestic 14.2kg",
      quantity: 1,
      amount: 800,
      notes: "",
    });
    setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedStaff.role === "DRIVER") {
        await api.post("/orders", {
          ...taskData,
          assignedStaffId: selectedStaff.id,
        });
        toast.success(`Task assigned to ${selectedStaff.name}`);
      } else {
        toast.success(`Broadcasting update to ${selectedStaff.name}`);
      }
      setIsTaskModalOpen(false);
      fetchStaff();
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to assign task",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Clear driver-specific fields if role is not DRIVER
      const dataToSubmit = { ...formData };
      if (dataToSubmit.role !== "DRIVER") {
        dataToSubmit.vehicleNumber = "";
        dataToSubmit.licenseNumber = "";
      }

      if (editingStaff) {
        await api.put(`/staff/${editingStaff.id}`, dataToSubmit);
        toast.success("Staff details updated");
      } else {
        await api.post("/staff", dataToSubmit);
        toast.success("New staff member added");
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      console.error("[StaffManagement] Submit error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to save staff";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filter staff based on search
  const filteredStaff = (
    user?.role === "MANAGER" ? staff.filter((s) => s.role === "DRIVER") : staff
  ).filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-[#1F2933]">
            Staff Management
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Manage delivery drivers and system managers
          </p>
        </div>
        {user?.role === "ADMIN" && (
          <button
            onClick={() => handleOpenModal()}
            className="px-5 py-2 bg-[#00C853] hover:bg-[#00B248] text-white font-bold text-[13px] tracking-wide rounded-lg flex items-center gap-1.5 transition-all hover:shadow-lg shadow-sm shadow-[#00C853]/20 active:scale-95"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Add New Staff</span>
          </button>
        )}
      </div>

      {/* Table Container */}
      <div
        className="bg-white rounded-2xl border border-gray-200 shadow-sm"
        style={{
          boxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)",
        }}
      >
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-[#1F2933] placeholder-gray-400 focus:ring-1 focus:ring-[#00C853] focus:border-[#00C853] outline-none transition-all text-[13px] font-medium shadow-sm"
            />
          </div>
          <button className="flex items-center gap-1.5 bg-white border border-gray-200 text-[#1F2933] px-4 py-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-[13px] font-bold tracking-wide shadow-sm">
            <Filter size={14} strokeWidth={2.5} />
            <span>Filter</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-white text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-5 py-4">Name & Role</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Status Today</th>
                <th className="px-5 py-4 text-center">Deliveries</th>
                <th className="px-5 py-4 text-right">Cash Today</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStaff.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-gray-50 transition-all cursor-pointer group"
                  onClick={() => navigate(`/staff/${member.id}`)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F2933] to-gray-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1F2933] group-hover:text-[#1F2933]">
                          {member.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-gray-400 font-medium">
                            ID: {member.id.substring(0, 8)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider ${
                              member.role === "ADMIN"
                                ? "bg-red-50 text-red-500"
                                : member.role === "MANAGER"
                                  ? "bg-purple-50 text-purple-500"
                                  : "bg-[#EBF5FF] text-[#3B82F6]"
                            }`}
                          >
                            {member.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 font-medium text-sm">
                    {member.phone}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${
                        member.status === "On Field"
                          ? "bg-[#EBF5FF] text-[#3B82F6]"
                          : member.status === "Active"
                            ? "bg-[#E8F5E9] text-[#00C853]"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-semibold text-[#1F2933]">
                      {member.totalOrders}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-[#1F2933]">
                    ₹{member.collection}
                  </td>
                  <td
                    className="px-5 py-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-center items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTaskModal(member);
                        }}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-md transition-all"
                        title="Assign Task"
                      >
                        <ClipboardList size={16} strokeWidth={2} />
                      </button>
                      {user?.role === "ADMIN" && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(member);
                            }}
                            className="p-1.5 text-[#3B82F6] hover:bg-blue-50 rounded-md transition-all"
                            title="Edit"
                          >
                            <Edit2 size={16} strokeWidth={2} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(member.id);
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredStaff.length === 0 && !loading && (
          <div className="p-8 text-center">
            <p className="text-gray-500">No staff members found</p>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-[#1F2933]">
                  Assign Responsibility
                </h3>
                <button
                  onClick={() => setIsTaskModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {selectedStaff.role} • {selectedStaff.name}
              </p>
            </div>

            <form onSubmit={handleTaskSubmit} className="p-6 space-y-4">
              {selectedStaff.role === "DRIVER" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500 ml-1">
                        Customer Name
                      </label>
                      <div className="relative">
                        <User
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          required
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-[#1F2933] text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all"
                          placeholder="John Doe"
                          value={taskData.customerName}
                          onChange={(e) =>
                            setTaskData({
                              ...taskData,
                              customerName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500 ml-1">
                        Contact Phone
                      </label>
                      <div className="relative">
                        <Phone
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          required
                          type="tel"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-[#1F2933] text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all"
                          placeholder="+91 00000 00000"
                          value={taskData.customerPhone}
                          onChange={(e) =>
                            setTaskData({
                              ...taskData,
                              customerPhone: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 ml-1">
                      Address
                    </label>
                    <div className="relative">
                      <MapPin
                        size={16}
                        className="absolute left-3 top-3 text-gray-400"
                      />
                      <textarea
                        required
                        rows={2}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-[#1F2933] text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all resize-none"
                        placeholder="Full address..."
                        value={taskData.customerAddress}
                        onChange={(e) => handleAddressSearch(e.target.value)}
                      />
                    </div>
                    {addressSuggestions.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-xl mt-1 max-h-40 overflow-y-auto shadow-lg">
                        {addressSuggestions.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            onClick={() => selectAddress(s)}
                          >
                            {s.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500 ml-1">
                        Cylinder Type
                      </label>
                      <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-[#1F2933] text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all"
                        value={taskData.cylinderType}
                        onChange={(e) =>
                          setTaskData({
                            ...taskData,
                            cylinderType: e.target.value,
                          })
                        }
                      >
                        <option>Domestic 14.2kg</option>
                        <option>Commercial 19kg</option>
                        <option>Small 5kg</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500 ml-1">
                        Quantity
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-[#1F2933] text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all"
                        value={taskData.quantity}
                        onChange={(e) =>
                          setTaskData({
                            ...taskData,
                            quantity: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>Task assignment for {selectedStaff.role} coming soon</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-[#1F2933] hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity flex items-center justify-70-center gap-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>Assign Task</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-[#1F2933]">
                  {editingStaff ? "Edit Staff" : "Add New Staff"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 ml-1">
                  Full Name
                </label>
                <input
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-[#1F2933] text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 ml-1">
                  Email
                </label>
                <input
                  required
                  type="email"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-[#1F2933] text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 ml-1">
                  Phone
                </label>
                <input
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-[#1F2933] text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all"
                  placeholder="+91 00000 00000"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 ml-1">
                  Role
                </label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-[#1F2933] text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="DRIVER">Driver</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>

              {!editingStaff && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 ml-1">
                    Password
                  </label>
                  <input
                    required
                    type="password"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-[#1F2933] text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
              )}

              {formData.role === "DRIVER" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 ml-1">
                      Vehicle Number
                    </label>
                    <input
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-[#1F2933] text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all"
                      placeholder="MH 01 AB 1234"
                      value={formData.vehicleNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vehicleNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 ml-1">
                      License Number
                    </label>
                    <input
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-[#1F2933] text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all"
                      placeholder="MH0123456789"
                      value={formData.licenseNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          licenseNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#1F2933] hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>{editingStaff ? "Save Changes" : "Add Staff Member"}</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
