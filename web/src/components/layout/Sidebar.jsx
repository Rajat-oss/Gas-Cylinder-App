import {
  Activity,
  Calculator,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ onClose, isMobileOpen }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
      roles: ["ADMIN", "MANAGER"],
    },
    {
      name: "Staff Management",
      path: "/staff",
      icon: Users,
      roles: ["ADMIN", "MANAGER"],
    },
    {
      name: "Orders",
      path: "/orders",
      icon: ShoppingCart,
      roles: ["ADMIN", "MANAGER"],
    },
    { name: "Inventory", path: "/inventory", icon: Package, roles: ["ADMIN"] },
    {
      name: "Live Monitoring",
      path: "/monitoring",
      icon: Activity,
      roles: ["ADMIN", "MANAGER"],
    },
    {
      name: "Settlement",
      path: "/settlement",
      icon: Calculator,
      roles: ["ADMIN", "MANAGER"],
    },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.roles.includes(user?.role),
  );

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
 ayush-feature
    <div className="h-full w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent truncate">
            {user?.role === "MANAGER" ? "GasFlow Manager" : "GasFlow Admin"}
          </h1>
          <p className="text-xs text-slate-400 mt-1 tracking-widest font-semibold hidden sm:block">
            Delivery System
          </p>
        </div>
        {/* Close button for mobile - only show when sidebar is open on mobile */}
        {isMobileOpen && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}

    <div className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 z-50">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
          {user?.role === "MANAGER" ? "GasFlow manager" : "GasFlow Admin"}
        </h1>
        <p className="text-xs text-slate-400 mt-1 tracking-widest font-semibold">
          Delivery System
        </p>
 main
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-2 lg:mt-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon
                size={20}
                className={
                  isActive
                    ? "text-white"
                    : "group-hover:text-white flex-shrink-0"
                }
              />
              <span className="font-medium truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer - Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
