import React, { useState, useEffect } from "react";
import api from "../lib/api";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "motion/react";
import { ShieldAlert, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LogoWithText } from "../components/Logo";
import { useAuth } from "../context/AuthContext";

export const Setup: React.FC = () => {
  const { login } = useAuth();
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmins = async () => {
      try {
        const response = await api.get("/api/auth/status");
        setAdminExists(response.data.adminExists);
      } catch (err) {
        console.error(err);
        setAdminExists(true); // Default to true to prevent access if API fails
      } finally {
        setLoading(false);
      }
    };
    checkAdmins();
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await api.post("/api/auth/setup", {
        email,
        password,
        name
      });

      const { token, user } = response.data;
      login(token, user);
      toast.success("Initial administrator created successfully!");
      navigate("/admin");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Setup failed");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  if (adminExists === true) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-100 dark:border-slate-800"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <LogoWithText />
          <div className="mt-6 inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-xl text-xs font-bold border border-amber-100 dark:border-amber-900/30 uppercase tracking-wider">
            <ShieldAlert size={14} />
            Initial System Setup
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-4">Create Admin Account</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            No administrator found. Create the first admin account to manage the platform.
          </p>
        </div>

        <form onSubmit={handleSetup} className="space-y-5">
           <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
            />
          </div>

          <button 
            type="submit"
            disabled={creating}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 transition-all"
          >
            {creating ? <Loader2 className="animate-spin" /> : (
              <>
                <UserPlus size={18} />
                Create Administrator
              </>
            )}
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
          <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">Notice:</h4>
          <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
            This setup page is only available when no administrators exist in the database.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
