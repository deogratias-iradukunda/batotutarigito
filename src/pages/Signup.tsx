import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Logo } from "../components/Logo";

export const Signup: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12 bg-slate-50 dark:bg-slate-950 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-10 border border-slate-100 dark:border-slate-800 space-y-6"
      >
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Registration Only</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Student accounts are created exclusively by the platform administrator.
          </p>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
          If you have been recently registered, please check your email for your username and temporary password.
        </div>

        <div className="pt-4">
          <button 
            onClick={() => navigate("/login")}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Go to Login
            <ArrowRight size={18} />
          </button>
        </div>
        
        <p className="text-xs text-slate-400">
          For technical issues or registration inquiries, please contact cngirababyeyi@gmail.com
        </p>
      </motion.div>
    </div>
  );
};
