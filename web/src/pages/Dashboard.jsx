import {
  ArrowUpRight,
  Clock,
  CreditCard,
  IndianRupee,
  PackageCheck,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../services/api";

const getCardColors = (colorScheme) => {
  const colors = {
    blue: "bg-blue-50 text-blue-500",
    indigo: "bg-indigo-50 text-indigo-500",
    emerald: "bg-[#E8F5E9] text-[#00C853]",
    orange: "bg-orange-50 text-orange-500",
    cyan: "bg-cyan-50 text-cyan-500",
    purple: "bg-purple-50 text-purple-500",
  };
  return colors[colorScheme] || colors.blue;
};

const DashboardCard = ({ title, value, icon: Icon, color, trend }) => (
  <div
    className="bg-white border md:min-h-[148px] border-[#E5E7EB] p-5 lg:p-6 rounded-[20px] transition-all hover:border-[#D1D5DB] group flex flex-col justify-between"
    style={{ boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)" }}
  >
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-[#6B7280] text-[15px] font-medium tracking-wide mb-1">{title}</p>
        <h3 className="text-3xl lg:text-[32px] font-bold text-[#1F2933]">{value}</h3>
      </div>
      <div
        className={`p-3 rounded-2xl ${getCardColors(color)} transition-transform group-hover:scale-110 shrink-0`}
      >
        <Icon size={24} strokeWidth={2} />
      </div>
    </div>
    
    <div className="flex items-center gap-1.5 mt-2">
      {trend && (
        <span
          className={`text-[13px] font-bold flex items-center gap-0.5 ${trend > 0 ? "text-[#00C853]" : "text-red-500"}`}
        >
          <ArrowUpRight size={16} className={trend < 0 ? "rotate-90" : ""} strokeWidth={2.5} />
          {Math.abs(trend)}%
        </span>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeDrivers: 0,
    deliveriesAssigned: 0,
    cylindersDelivered: 0,
    pendingDeliveries: 0,
    cashCollected: 0,
    upiPayments: 0,
  });

  const [chartData, setChartData] = useState([]);

  const paymentData = [
    { name: "Cash", val: stats.cashCollected },
    { name: "UPI", val: stats.upiPayments },
  ];

  const COLORS = ["#00C853", "#00E676"];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/dashboard/stats");
        const data = res.data.metrics;
        setStats({
          activeDrivers: data.activeDrivers,
          deliveriesAssigned: data.pendingOrders + data.deliveredToday,
          cylindersDelivered: data.deliveredToday,
          pendingDeliveries: data.pendingOrders,
          cashCollected: data.cashCollection,
          upiPayments: data.upiCollection,
        });
        setChartData(data.hourlyStats || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-2 lg:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-2">
        <div>
          <h2 className="text-[26px] lg:text-[28px] font-bold text-[#1F2933]">
            Dashboard Overview
          </h2>
          <p className="text-[#6B7280] mt-1 text-[15px] font-medium">
            Real-time status of your delivery operations
          </p>
        </div>
        <div
          className="px-4 py-2 bg-white border border-gray-100 rounded-full flex items-center gap-2 shadow-sm shrink-0"
        >
          <div className="w-2 h-2 bg-[#00C853] rounded-full animate-pulse shadow-[0_0_8px_rgba(0,200,83,0.6)]"></div>
          <span className="text-[13px] font-bold text-gray-500 tracking-wide uppercase">
            Live Updates
          </span>
        </div>
      </div>

      {/* Stats Grid - Responsive Grid exactly like before, but with new styles */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-5">
        <DashboardCard title="Active Drivers" value={stats.activeDrivers} icon={Users} color="blue" trend={12} />
        <DashboardCard title="Assigned" value={stats.deliveriesAssigned} icon={Truck} color="indigo" />
        <DashboardCard title="Delivered" value={stats.cylindersDelivered} icon={PackageCheck} color="emerald" trend={8} />
        <DashboardCard title="Pending" value={stats.pendingDeliveries} icon={Clock} color="orange" />
        <DashboardCard title="Cash" value={`₹${stats.cashCollected}`} icon={IndianRupee} color="cyan" trend={5} />
        <DashboardCard title="UPI" value={`₹${stats.upiPayments}`} icon={CreditCard} color="purple" trend={15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] p-5 lg:p-7 rounded-[20px]" style={{ boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)" }}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h3 className="text-[18px] font-bold text-[#1F2933] flex items-center gap-2">
              <TrendingUp className="text-[#1F2933]" size={20} />
              Delivery Velocity (Today)
            </h3>
            <select className="bg-gray-50 border border-gray-200 text-[#1F2933] text-[13px] font-semibold rounded-xl px-4 py-2 focus:outline-none w-fit cursor-pointer shadow-sm">
              <option>Last 24 Hours</option>
              <option>Yesterday</option>
            </select>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C853" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#00C853" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: 500 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", fontSize: "13px", fontWeight: 600, color: "#1F2933" }}
                  itemStyle={{ color: "#00C853", fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="deliveries" stroke="#00C853" strokeWidth={3} fillOpacity={1} fill="url(#colorDel)" activeDot={{ r: 6, fill: "#00C853", stroke: "#FFFFFF", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-5 lg:p-7 rounded-[20px]" style={{ boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)" }}>
          <h3 className="text-[18px] font-bold text-[#1F2933] mb-6">Payment Split</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: "#4B5563", fontSize: 13, fontWeight: 500 }} width={60} />
                <Tooltip cursor={{ fill: "#F9FAFB" }} contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", fontWeight: 600 }} />
                <Bar dataKey="val" radius={[0, 6, 6, 0]} barSize={24}>
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 mt-6">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-[14px] font-semibold text-gray-500">Total Collection</span>
              <span className="text-[20px] font-black text-[#1F2933]">₹{stats.cashCollected + stats.upiPayments}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
