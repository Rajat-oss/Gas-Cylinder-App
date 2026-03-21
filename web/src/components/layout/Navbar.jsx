import { Bell, Search, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Navbar = ({ collapsed }) => {
  const { user } = useAuth();

  return (
    <header
      className="h-16 lg:h-20 bg-white border-b border-gray-100 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-40 transition-all duration-300"
      style={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.02)" }}
    >
      {/* Search Bar - Responsive */}
      <div className="flex items-center gap-2 lg:gap-4 bg-gray-50 px-3 lg:px-4 py-2 rounded-xl w-full max-w-md border border-gray-100 hover:border-gray-200 transition-colors">
        <Search size={18} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent border-none focus:outline-none text-slate-700 text-sm lg:text-base w-full placeholder:text-gray-400"
        />
      </div>

      {/* Right Side - Notifications & Profile */}
      <div className="flex items-center gap-3 lg:gap-6">
        {/* Notification Bell */}
        <button className="relative p-2 text-gray-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-gray-50">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-slate-600 rounded-full border-2 border-white"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 lg:gap-4 pl-3 lg:pl-6 border-l border-gray-100">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-700 truncate max-w-[120px]">
              {user?.name}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
              {user?.role}
            </p>
          </div>
          <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-500 flex items-center justify-center text-white font-bold flex-shrink-0">
            {user?.name?.charAt(0) || <User size={18} />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
