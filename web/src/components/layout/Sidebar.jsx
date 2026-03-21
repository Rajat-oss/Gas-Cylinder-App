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
      className={`fixed left-0 top-0 h-screen bg-white flex flex-col z-50 transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}
      style={{
        boxShadow:
          "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
      }}
    >
      {/* Header */}
      <div
        className={`p-5 border-b border-gray-100 ${collapsed ? "px-4" : ""}`}
      >
        {!collapsed && (
          <>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              {user?.role === "MANAGER" ? "GasFlow" : "GasFlow"}
            </h1>
            <p className="text-xs text-gray-400 mt-1 font-medium">
              Delivery System
            </p>
          </>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">GF</span>
          </div>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className={`hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm hover:bg-gray-50 transition-all duration-200 z-10 ${
          collapsed ? "rotate-180" : ""
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
      <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                isActive
                  ? "bg-slate-100 text-slate-800"
                  : "text-gray-500 hover:bg-gray-50 hover:text-slate-700"
              }`}
              title={collapsed ? item.name : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-slate-800 rounded-r-full"
                  style={{ boxShadow: "0 0 8px rgba(30, 41, 59, 0.3)" }}
                />
              )}

              <item.icon
                size={20}
                className={`flex-shrink-0 transition-colors duration-200 ${
                  isActive
                    ? "text-slate-800"
                    : "text-gray-400 group-hover:text-slate-600"
                }`}
              />
              {!collapsed && (
                <span
                  className={`font-medium text-sm truncate ${
                    isActive ? "text-slate-800" : ""
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
        className={`p-4 border-t border-gray-100 ${collapsed ? "px-3" : ""}`}
      >
        <div
          className={`flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-xs">
              {getUserInitials()}
            </span>
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">
                {user?.name || (user?.role === "MANAGER" ? "Manager" : "Admin")}
              </p>
              <p className="text-xs text-gray-400 truncate">
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
          className={`flex items-center gap-3 w-full px-3 py-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 group ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut
            size={18}
            className="flex-shrink-0 transition-colors duration-200 group-hover:scale-110"
          />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
