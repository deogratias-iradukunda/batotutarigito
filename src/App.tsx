/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./lib/i18n";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { UserDashboard } from "./pages/Dashboard";
import { Setup } from "./pages/Setup";
import { Signup } from "./pages/Signup";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { Announcements } from "./pages/Announcements";
import { Logo } from "./components/Logo";
import { motion } from "motion/react";

const ProtectedRoute: React.FC<{ children: React.ReactNode; role?: string }> = ({ children, role }) => {
  const { user, role: userRole, loading } = useAuth();

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (role && userRole !== role) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1600);
    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading) {
    return (
      <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center z-50">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="absolute -inset-4 bg-blue-500/10 rounded-full blur-xl animate-pulse" />
            <Logo size="lg" className="relative shadow-2xl rounded-2xl ring-4 ring-blue-500/5 bg-white p-2" />
          </div>
          
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white italic">
              Bato<span className="text-blue-600">Tutari</span>Gito
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-widest uppercase">
              Developing Communities
            </p>
          </div>
          
          <div className="w-40 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
              className="h-full bg-blue-600 rounded-full"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/setup" element={<Setup />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/announcements" element={<Announcements />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin" element={
                    <ProtectedRoute role="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <UserDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Layout>
            } />
          </Routes>
          <Toaster position="top-center" richColors />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
