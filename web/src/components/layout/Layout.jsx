import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check screen width for collapsed state on desktop and manage mobile overlay
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      // Handle Desktop sizing
      if (width < 1280 && width >= 1024) {
        setSidebarCollapsed(true);
      } else if (width >= 1280) {
        setSidebarCollapsed(false);
      }
      
      // Auto-collapse sidebar overlay when crossing to desktop
      if (width >= 1024) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - Fixed on desktop, off-canvas on mobile */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 flex
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          h-screen
        `}
      >
        <Sidebar
          onClose={closeSidebar}
          isMobileOpen={sidebarOpen}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleCollapse}
        />
      </div>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
      >
        {/* Unified Top Navbar for both Mobile and Desktop */}
        <Navbar onToggleSidebar={toggleSidebar} />

        {/* Main Routed Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
