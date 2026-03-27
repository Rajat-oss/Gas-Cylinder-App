import {
  Calendar,
  Car,
  CheckCircle2,
  ChevronLeft,
  Circle,
  ClipboardList,
  Clock,
  CreditCard,
  DollarSign,
  Loader2,
  MapPin as MapPinIcon,
  MessageSquare,
  Minus,
  Phone,
  Plus,
  Shield,
  User,
  UserPlus
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
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

// Reusable Card Component
const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}
  >
    {children}
  </div>
);

// Reusable Badge Component
const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-600",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    info: "bg-blue-50 text-blue-600",
    online: "bg-[#E8F5E9] text-[#00C853] font-bold tracking-wide",
    offline: "bg-gray-100 text-gray-500",
    active: "bg-blue-50 text-blue-600",
    onfield: "bg-amber-50 text-amber-600",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// Reusable Button Component
const Button = ({
  children,
  variant = "primary",
  disabled,
  loading,
  type = "button",
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-[#1F2933] text-white hover:bg-gray-800 active:scale-[0.98] shadow-sm shadow-gray-200",
    secondary:
      "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] shadow-sm",
    success:
      "bg-[#00C853] text-white hover:bg-[#00B248] active:scale-[0.98] shadow-sm shadow-[#00C853]/20 font-bold tracking-wide",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 active:scale-[0.98]",
  };
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
};

// Reusable Input Component
const Input = ({ label, icon: Icon, error, className = "", ...props }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && (
      <label className="block text-sm font-medium text-gray-600 ml-1">
        {label}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <Icon
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
      )}
      <input
        className={`w-full bg-gray-50 border border-gray-200 rounded-xl py-3 ${Icon ? "pl-11" : "px-4"} pr-4 text-gray-800 font-medium focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-100 focus:outline-none transition-all placeholder:text-gray-400`}
        {...props}
      />
    </div>
  </div>
);

// Reusable Select Component
const Select = ({ label, options, error, className = "", ...props }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && (
      <label className="block text-sm font-medium text-gray-600 ml-1">
        {label}
      </label>
    )}
    <select
      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 font-medium focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-100 focus:outline-none transition-all appearance-none"
      {...props}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

// Reusable Textarea Component
const Textarea = ({ label, icon: Icon, error, className = "", ...props }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && (
      <label className="block text-sm font-medium text-gray-600 ml-1">
        {label}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <Icon size={18} className="absolute left-4 top-4 text-gray-400" />
      )}
      <textarea
        className={`w-full bg-gray-50 border border-gray-200 rounded-xl py-3 ${Icon ? "pl-11" : "px-4"} pr-4 text-gray-800 font-medium focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-100 focus:outline-none transition-all placeholder:text-gray-400 min-h-[100px] resize-none`}
        {...props}
      />
    </div>
  </div>
);

const StaffDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  // Task Assignment States
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
  const [assigningTask, setAssigningTask] = useState(false);

  // Payment states
  const [paymentAmount, setPaymentAmount] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchStaffDetails();

    const socket = socketService.connect();
    socket.on("staffStatusUpdate", (update) => {
      if (update.id === id) {
        setMember((prev) =>
          prev
            ? {
                ...prev,
                isOnline: update.isOnline,
                status: update.isOnline
                  ? prev.totalOrders > prev.doneOrders
                    ? "On Field"
                    : "Active"
                  : "Offline",
              }
            : prev,
        );
      }
    });

    socket.on("newOrder", () => {
      fetchStaffDetails();
    });

    socket.on("orderUpdated", () => {
      fetchStaffDetails();
    });

    return () => {
      socket.off("staffStatusUpdate");
      socket.off("newOrder");
      socket.off("orderUpdated");
    };
  }, [id]);

  const fetchStaffDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/staff/${id}`);
      setMember(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load staff details");
      navigate("/staff");
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
      const fullQuery = searchParts.join(", ");

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&addressdetails=1&namedetails=1&limit=10&countrycodes=in`,
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
    const city =
      addr.city || addr.town || addr.village || addr.suburb || taskData.city;
    const state = addr.state || taskData.state;
    setTaskData({
      ...taskData,
      customerAddress: suggestion.display_name,
      city: city,
      state: state,
    });
    setAddressSuggestions([]);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setAssigningTask(true);
    try {
      if (member.role === "DRIVER") {
        const payload = { ...taskData, assignedStaffId: member.id };
        await api.post("/orders", payload);
        toast.success(`Task assigned to ${member.name}`);
        setTaskData({
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
      } else {
        toast.success(`Broadcasting update to ${member.name}`);
      }
      fetchStaffDetails();
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to assign task",
      );
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

    setTimeout(() => {
      toast.success(`Payment of ₹${paymentAmount} processed successfully`);
      setPaymentAmount("");
      setProcessingPayment(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-slate-300 animate-spin" />
      </div>
    );
  }

  if (!member) return null;

  // Helper to get status badge variant
  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return { variant: "online", icon: <CheckCircle2 size={12} /> };
      case "On Field":
        return { variant: "onfield", icon: <Clock size={12} /> };
      default:
        return { variant: "offline", icon: <Circle size={12} /> };
    }
  };

  const statusBadge = getStatusBadge(member.status);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          onClick={() => navigate("/staff")}
          className="p-2.5"
        >
          <ChevronLeft size={20} />
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Staff Details
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage profile, view status, assign tasks and handle payments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile, Performance & Payments */}
        <div className="lg:col-span-1 space-y-6">
          {/* Staff Profile Card */}
          <Card className="p-6">
            <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-2xl bg-[#1F2933] flex items-center justify-center text-white font-bold text-2xl shadow-md">
                  {member.name.charAt(0)}
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${member.status === "On Field" ? "bg-amber-500" : member.status === "Active" ? "bg-[#00C853]" : "bg-gray-400"}`}
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                {member.name}
              </h3>
              <p className="text-gray-500 text-sm">{member.email}</p>
              <div className="mt-3 flex gap-2">
                <Badge
                  variant={
                    member.role === "ADMIN"
                      ? "danger"
                      : member.role === "MANAGER"
                        ? "info"
                        : "default"
                  }
                >
                  <Shield size={12} />
                  {member.role}
                </Badge>
                <Badge variant={statusBadge.variant}>
                  {statusBadge.icon}
                  {member.status}
                </Badge>
              </div>
            </div>
            <div className="pt-6 space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-slate-600">
                  <Phone size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-400 uppercase">
                    Phone
                  </p>
                  <p className="font-medium text-gray-700">{member.phone}</p>
                </div>
              </div>
              {member.role === "DRIVER" && (
                <>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-emerald-600">
                      <Car size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-400 uppercase">
                        Vehicle Number
                      </p>
                      <p className="font-medium text-gray-700">
                        {member.vehicleNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-amber-600">
                      <CreditCard size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-400 uppercase">
                        License Number
                      </p>
                      <p className="font-medium text-gray-700">
                        {member.licenseNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Performance & Finance Card */}
          <Card className="p-6">
            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-5">
              Performance
            </h4>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center">
                <p className="text-xs font-medium text-gray-400 uppercase mb-1">
                  Total Deliveries
                </p>
                <p className="text-2xl font-semibold text-gray-800">
                  {member.totalOrders}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center">
                <p className="text-xs font-medium text-gray-400 uppercase mb-1">
                  Success Rate
                </p>
                <p className="text-2xl font-semibold text-blue-600">
                  {member.progress}%
                </p>
              </div>
            </div>

            {/* Cash Collection */}
            <div className="bg-[#E8F5E9] border border-[#00C853]/20 rounded-xl p-4 mb-5">
              <p className="text-[10px] font-bold text-[#00C853] uppercase tracking-wider mb-1">
                Cash Today
              </p>
              <h3 className="text-3xl font-bold text-[#00C853]">
                ₹{member.collection}
              </h3>
            </div>

            {/* Payment Form */}
            {user?.role === "ADMIN" && (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <label className="text-xs font-medium text-gray-500 uppercase ml-1 tracking-wide">
                  Process Payment
                </label>
                <Input
                  type="number"
                  required
                  placeholder="Enter amount"
                  icon={DollarSign}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="success"
                  loading={processingPayment}
                  className="w-full"
                >
                  {processingPayment ? "Processing..." : "Settle Account"}
                </Button>
              </form>
            )}
          </Card>
        </div>

        {/* Right Column: Task Assignment Form */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden h-full flex flex-col">
            {/* Form Header */}
            <div className="px-6 py-5 bg-gray-50/50 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Assign New Task
                  </h3>
                  <p className="text-gray-500 text-sm mt-0.5">
                    Create a new delivery for {member.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <form
              onSubmit={handleTaskSubmit}
              className="p-6 space-y-6 flex-1 overflow-y-auto"
            >
              {member.role === "DRIVER" ? (
                <>
                  {/* Section: Client Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="h-px flex-1 bg-gray-100"></span>
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Client Details
                      </span>
                      <span className="h-px flex-1 bg-gray-100"></span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Customer Name"
                        icon={User}
                        placeholder="John Doe"
                        value={taskData.customerName}
                        onChange={(e) =>
                          setTaskData({
                            ...taskData,
                            customerName: e.target.value,
                          })
                        }
                        required
                      />
                      <Input
                        label="Contact Phone"
                        icon={Phone}
                        placeholder="+91 00000 00000"
                        type="tel"
                        value={taskData.customerPhone}
                        onChange={(e) =>
                          setTaskData({
                            ...taskData,
                            customerPhone: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Section: Location */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="h-px flex-1 bg-gray-100"></span>
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Location
                      </span>
                      <span className="h-px flex-1 bg-gray-100"></span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Select State"
                        options={["Choose State", ...INDIAN_STATES]}
                        value={taskData.state}
                        onChange={(e) =>
                          setTaskData({ ...taskData, state: e.target.value })
                        }
                        required
                      />
                      <Input
                        label="Enter City"
                        icon={MapPinIcon}
                        placeholder="e.g. Mumbai"
                        value={taskData.city}
                        onChange={(e) =>
                          setTaskData({ ...taskData, city: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="relative">
                      <Textarea
                        label="Detailed Delivery Address"
                        icon={MapPinIcon}
                        placeholder="Type locality or building for smart suggestions..."
                        value={taskData.customerAddress}
                        onChange={(e) => handleAddressSearch(e.target.value)}
                        required
                      />

                      {/* Address Suggestions Dropdown */}
                      {(addressSuggestions.length > 0 ||
                        isSearchingAddress) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-lg z-10">
                          {isSearchingAddress && (
                            <div className="p-4 flex items-center gap-3 text-gray-500 text-sm border-b border-gray-100">
                              <Loader2
                                size={16}
                                className="animate-spin text-blue-500"
                              />
                              Searching...
                            </div>
                          )}
                          <div className="max-h-[200px] overflow-y-auto">
                            {addressSuggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => selectAddress(suggestion)}
                                className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                              >
                                <p className="text-sm font-medium text-gray-700 truncate">
                                  {suggestion.display_name.split(",")[0]}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                  {suggestion.display_name}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section: Inventory */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="h-px flex-1 bg-gray-100"></span>
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Inventory
                      </span>
                      <span className="h-px flex-1 bg-gray-100"></span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select
                        label="Cylinder Type"
                        options={[
                          "Domestic 14.2kg",
                          "Commercial 19kg",
                          "Industrial 35kg",
                          "Industrial 47.5kg",
                        ]}
                        value={taskData.cylinderType}
                        onChange={(e) =>
                          setTaskData({
                            ...taskData,
                            cylinderType: e.target.value,
                          })
                        }
                      />
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-600 ml-1">
                          Quantity
                        </label>
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden h-[46px]">
                          <button
                            type="button"
                            onClick={() => {
                              const newQty = Math.max(1, taskData.quantity - 1);
                              setTaskData({ ...taskData, quantity: newQty });
                            }}
                            className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Minus size={18} />
                          </button>
                          <div className="flex-1 text-center font-semibold text-gray-800">
                            {taskData.quantity}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newQty = taskData.quantity + 1;
                              setTaskData({ ...taskData, quantity: newQty });
                            }}
                            className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                      <Input
                        label="Amount (₹)"
                        icon={DollarSign}
                        type="number"
                        placeholder="800"
                        value={taskData.amount}
                        onChange={(e) =>
                          setTaskData({
                            ...taskData,
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Section: Notes */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="h-px flex-1 bg-gray-100"></span>
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Notes
                      </span>
                      <span className="h-px flex-1 bg-gray-100"></span>
                    </div>
                    <Textarea
                      label="Deployment Memo (Optional)"
                      icon={MessageSquare}
                      placeholder="Landmarks, timing constraints, or special handling notes..."
                      value={taskData.notes}
                      onChange={(e) =>
                        setTaskData({ ...taskData, notes: e.target.value })
                      }
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {/* Manager Info Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 border border-blue-100 p-5 rounded-2xl flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        Manager Directive
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        System-wide operational updates. Assignments to managers
                        trigger high-priority alerts within the internal control
                        grid.
                      </p>
                    </div>
                  </div>

                  <Input
                    label="Directive Title"
                    icon={ClipboardList}
                    placeholder="Enter assignment subject"
                    required
                  />

                  <Textarea
                    label="Deployment Details"
                    placeholder="Detailed execution plan and monitoring requirements..."
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Operational Priority"
                      options={[
                        "Standard (P3)",
                        "High Priority (P2)",
                        "Immediate Execution (P1)",
                      ]}
                    />
                    <Input
                      label="System Deadline"
                      type="date"
                      icon={Calendar}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4 flex justify-end border-t border-gray-100">
                <Button
                  type="submit"
                  variant="primary"
                  loading={assigningTask}
                  className="px-8"
                >
                  <UserPlus size={18} />
                  Assign Task
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffDetails;
