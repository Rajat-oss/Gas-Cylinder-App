import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  ShoppingCart,
  Users
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ onClose, isMobileOpen, collapsed, onToggleCollapse }) => {
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
      icon: MapPin,
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

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.role === "MANAGER" ? "M" : "A";
  };

  return (
    <div
      className={`h-screen bg-white flex flex-col z-50 transition-all duration-300 ease-in-out border-r border-gray-100 ${collapsed ? "w-20" : "w-64"
        }`}
      style={{
        boxShadow:
          "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
      }}
    >
      {/* Header */}
      <div
        className={`p-5 xl:p-6 flex items-center gap-3 ${collapsed ? "justify-center px-4" : ""}`}
      >
        <div className="w-10 h-10 rounded-xl bg-[#00C853] flex items-center justify-center shrink-0 shadow-md shadow-[#00C853]/20">
          <span className="text-white font-black text-xl">G</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <h1 className="text-[19px] font-black text-[#1F2933] leading-tight tracking-tight uppercase">
              {user?.role === "MANAGER" ? "GasFlow" : "GasFlow"}
            </h1>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              Admin Panel
            </p>
          </div>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className={`hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm hover:bg-gray-50 transition-all duration-200 z-10 ${collapsed ? "rotate-180" : ""
          }`}
        style={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}
      >
        {collapsed ? (
          <ChevronRight size={14} className="text-gray-500" />
        ) : (
          <ChevronLeft size={14} className="text-gray-500" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 mt-4 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${isActive
                ? "bg-[#00C853] text-white shadow-md shadow-[#00C853]/20"
                : "text-gray-500 hover:bg-gray-50 hover:text-[#1F2933]"
                }`}
              title={collapsed ? item.name : undefined}
            >
              <item.icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className={`flex-shrink-0 transition-colors duration-200 ${isActive
                  ? "text-white"
                  : "text-gray-400 group-hover:text-[#1F2933]"
                  }`}
              />
              {!collapsed && (
                <span
                  className={`font-semibold text-[14px] tracking-wide truncate ${isActive ? "text-white font-bold" : ""
                    }`}
                >
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div
        className={`p-4 xl:p-5 border-t border-gray-100 ${collapsed ? "px-3" : ""}`}
      >
        <div
          className={`flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors duration-200 ${collapsed ? "justify-center" : ""
            }`}
        >
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#00C853] flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white font-bold text-sm">
              {getUserInitials()}
            </span>
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1F2933] truncate leading-tight">
                {user?.name || (user?.role === "MANAGER" ? "Manager" : "Admin")}
              </p>
              <p className="text-[12px] text-[#00C853] font-bold truncate mt-0.5">
                {user?.role === "MANAGER" ? "Manager" : "Administrator"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Logout */}
      <div
        className={`p-3 border-t border-gray-100 ${collapsed ? "px-2" : ""}`}
      >
        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all duration-200 group ${collapsed ? "justify-center" : ""
            }`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut
            size={18}
            strokeWidth={2.5}
            className="flex-shrink-0 transition-colors duration-200"
          />
          {!collapsed && <span className="font-semibold text-sm tracking-wide">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
