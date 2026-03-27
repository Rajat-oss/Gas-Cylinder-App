import { Bell, Menu, Search, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Navbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header
      className="h-16 lg:h-20 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-40 transition-all duration-300"
      style={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.02)" }}
    >
      {/* Left Side - Mobile Hamburger + Logo & Desktop Search */}
      <div className="flex items-center gap-3 lg:gap-4 px-4 lg:px-8 w-full">
        {/* Mobile Hamburger Menu */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-gray-500 hover:text-[#1F2933] hover:bg-gray-50 rounded-lg transition-colors -ml-2"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>

        {/* Mobile Logo */}
        <h1 className="lg:hidden text-lg font-bold text-[#1F2933] truncate">
          {user?.role === "MANAGER" ? "GasFlow" : "GasFlow"}
        </h1>

        {/* Search Bar - Responsive */}
        <div className="hidden sm:flex items-center gap-2 lg:gap-4 bg-gray-50 px-3 lg:px-4 py-2 rounded-xl w-full max-w-md border border-gray-100 hover:border-gray-200 transition-colors ml-auto lg:ml-0">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none focus:outline-none text-[#1F2933] text-sm lg:text-base w-full placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Right Side - Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-6 px-4 lg:px-8 shrink-0">
        {/* Mobile Search Icon (only visible on mobile when search bar is hidden) */}
        <button className="sm:hidden p-2 text-gray-400 hover:text-[#1F2933] transition-colors rounded-lg hover:bg-gray-50">
          <Search size={20} />
        </button>

        {/* Notification Bell */}
        <button className="relative p-2 text-gray-400 hover:text-[#1F2933] transition-colors rounded-full hover:bg-gray-50">
          <Bell size={20} strokeWidth={2} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00C853] rounded-full border-2 border-white"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 lg:gap-4 pl-2 sm:pl-3 lg:pl-6 border-l border-gray-100">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-[#1F2933] truncate max-w-[120px]">
              {user?.name || (user?.role === "MANAGER" ? "Manager" : "Admin")}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-[#00C853] font-bold">
              {user?.role || "User"}
            </p>
          </div>
          <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-full bg-[#00C853] flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm">
            {user?.name?.charAt(0) || <User size={18} />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
