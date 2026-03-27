import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Login Successful");
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FBFC] flex flex-col items-center justify-center p-4 selection:bg-slate-200 selection:text-slate-900">
      
      {/* Logo and Headers */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#00C853] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#00C853]/20">
          <span className="text-white text-3xl font-black">G</span>
        </div>
        <h1 className="text-[22px] font-bold text-[#1F2933] mb-1">
          GasFlow Admin
        </h1>
        <p className="text-[#64748B] text-sm">
          Digital Service Portal — Super Admin
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[420px] bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100 p-8 sm:p-10 relative z-10">
        <h2 className="text-[20px] font-semibold text-[#1F2933] mb-8">
          Sign in to your account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#475569]">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#00C853] transition-colors">
                <Mail size={18} strokeWidth={2} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[#1F2933] text-sm focus:outline-none focus:ring-1 focus:ring-[#00C853] focus:border-[#00C853] transition-all placeholder:text-gray-400"
                placeholder="admin@gasflow.online"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#475569]">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#00C853] transition-colors">
                <Lock size={18} strokeWidth={2} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-[#1F2933] text-sm focus:outline-none focus:ring-1 focus:ring-[#00C853] focus:border-[#00C853] transition-all placeholder:text-gray-400 tracking-wider font-medium"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={2} />
                ) : (
                  <Eye size={18} strokeWidth={2} />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00C853] hover:bg-[#00B248] text-white font-bold tracking-wide py-2.5 rounded-lg shadow-sm shadow-[#00C853]/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Sign In"}
          </button>
        </form>

        
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} GasFlow Digital Services. All rights reserved.</p>
      </div>

    </div>
  );
};

export default Login;
