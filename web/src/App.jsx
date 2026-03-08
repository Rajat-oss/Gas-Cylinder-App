import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/layout/Layout";
import { AuthProvider } from "./context/AuthContext";

// Pages
import Dashboard from "./pages/Dashboard";
import FinancialSettlement from "./pages/FinancialSettlement";
import Inventory from "./pages/Inventory";
import LiveMonitoring from "./pages/LiveMonitoring";
import Login from "./pages/Login";
import OrderManagement from "./pages/OrderManagement";
import PendingApproval from "./pages/PendingApproval";
import StaffDetails from "./pages/StaffDetails";
import StaffManagement from "./pages/StaffManagement";

const Unauthorized = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
    <h1 className="text-6xl font-black text-rose-500 mb-4">403</h1>
    <h2 className="text-2xl font-bold mb-6 uppercase tracking-widest">
      Unauthorized Access
    </h2>
    <p className="text-slate-500 mb-8 max-w-md text-center">
      You do not have the required permissions to view this section. Please
      contact your administrator if you believe this is an error.
    </p>
    <button
      onClick={() => window.history.back()}
      className="px-8 py-3 bg-slate-800 rounded-xl font-bold hover:bg-slate-700 transition-all border border-slate-700"
    >
      Go Back
    </button>
  </div>
);

const NotFound = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
    <h1 className="text-6xl font-black text-blue-500 mb-4">404</h1>
    <h2 className="text-2xl font-bold mb-6 uppercase tracking-widest">
      Page Not Found
    </h2>
    <p className="text-slate-500 mb-8 max-w-md text-center">
      The page you are looking for doesn't exist or has been moved.
    </p>
    <a
      href="/"
      className="px-8 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
    >
      Return Home
    </a>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} />}>
            <Route path="/pending-approval" element={<PendingApproval />} />
          </Route>

          <Route
            element={<ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]} />}
          >
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<OrderManagement />} />
              <Route path="/monitoring" element={<LiveMonitoring />} />
              <Route path="/settlement" element={<FinancialSettlement />} />

              {/* Admin and Manager Routes */}
              <Route path="/staff" element={<StaffManagement />} />
              <Route path="/staff/:id" element={<StaffDetails />} />

              {/* Admin Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/inventory" element={<Inventory />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
