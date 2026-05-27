import React, { useState } from "react";
import api from "../lib/api";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Lock, Mail, Eye, EyeOff, ArrowRight, Loader2, X } from "lucide-react";
import { Logo } from "../components/Logo";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  
  // Google Simulated Sign-In Modal States
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleCustomInput, setShowGoogleCustomInput] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [googlePassword, setGooglePassword] = useState("");
  const [showGooglePasswordPrompt, setShowGooglePasswordPrompt] = useState(false);
  const [googleEmailToVerify, setGoogleEmailToVerify] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const handleGoogleLoginClick = () => {
    setShowGoogleModal(true);
    setShowGoogleCustomInput(false);
    setCustomGoogleEmail("");
    setGooglePassword("");
    setShowGooglePasswordPrompt(false);
    setGoogleEmailToVerify("");
  };

  const executeGoogleSignIn = async (chosenEmail: string, verificationPassword?: string) => {
    if (!chosenEmail || !chosenEmail.includes("@")) {
      toast.error("Please enter a valid Google email address.");
      return;
    }
    const lowerEmail = chosenEmail.toLowerCase().trim();
    if (lowerEmail !== "cngirababyeyi@gmail.com") {
      toast.error("Google Sign-In is restricted for this platform.");
      return;
    }

    if (!verificationPassword) {
      setGoogleEmailToVerify(chosenEmail);
      setShowGooglePasswordPrompt(true);
      setGooglePassword("");
      return;
    }

    setGoogleLoading(true);
    try {
      const response = await api.post("/api/auth/google-signin", {
        email: chosenEmail,
        name: chosenEmail.split("@")[0],
        password: verificationPassword
      });
      toast.success(`Success: Authenticated as ${chosenEmail} through Google SSO`);
      const { token, user } = response.data;
      login(token, user);
      setShowGoogleModal(false);
      setShowGooglePasswordPrompt(false);
      setGooglePassword("");
      setGoogleEmailToVerify("");
      navigate(from, { replace: true });
    } catch (error: any) {
      const rawError = error.response?.data?.error || error.message || "Google single sign-on failed";
      const errorMsg = typeof rawError === 'object' ? (rawError.message || JSON.stringify(rawError)) : rawError;
      toast.error(errorMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/api/auth/login", { email, password });
      toast.success("Login successful!");
      const { token, user } = response.data;
      login(token, user);
      navigate(from, { replace: true });
    } catch (error: any) {
      const rawError = error.response?.data?.error || error.message || "Failed to login";
      const errorMsg = typeof rawError === 'object' ? (rawError.message || JSON.stringify(rawError)) : rawError;
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.info("Password reset via API not yet implemented. Contact admin.");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12 bg-slate-50 dark:bg-slate-950 relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-slate-800"
      >
        <div className="text-center space-y-2 mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            {forgotPassword ? "Reset Password" : "Welcome Back"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {forgotPassword 
              ? "Enter your email to receive a reset link" 
              : "Login to access your BatoTutariGito dashboard"}
          </p>
        </div>

        <form onSubmit={forgotPassword ? handleForgotPassword : handleLogin} className="space-y-6">
          {!forgotPassword && (
            <>
              <button 
                type="button"
                onClick={handleGoogleLoginClick}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-3 rounded-xl font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or email</span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
              />
            </div>
          </div>

          {!forgotPassword && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                <button 
                  type="button"
                  onClick={() => setForgotPassword(true)}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-12 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                {forgotPassword ? "Send Reset Link" : "Sign In"}
                {!forgotPassword && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </>
            )}
          </button>

          {forgotPassword && (
            <button 
              type="button"
              onClick={() => setForgotPassword(false)}
              className="w-full text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Back to Login
            </button>
          )}
        </form>
      </motion.div>

      {/* Google Choose Account Popup Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-100 dark:border-slate-800 relative z-50 text-slate-900 dark:text-white"
          >
            <button 
              onClick={() => setShowGoogleModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center mt-2 mb-6">
              {/* Google Brand Header Logo */}
              <div className="flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold tracking-tight">
                {showGooglePasswordPrompt ? "Verify your identity" : "Choose an account"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {showGooglePasswordPrompt ? "to secure your admin session" : <>to continue to <span className="font-semibold text-slate-700 dark:text-slate-300">BatoTutariGito</span></>}
              </p>
            </div>

            {googleLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Connecting with Google...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {showGooglePasswordPrompt ? (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      executeGoogleSignIn(googleEmailToVerify, googlePassword);
                    }} 
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="text-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Verifying Administrator</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{googleEmailToVerify}</span>
                      </div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Enter Admin Password to Authorize</label>
                      <input 
                        type="password"
                        required
                        autoFocus
                        value={googlePassword}
                        onChange={(e) => setGooglePassword(e.target.value)}
                        placeholder=""
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-900 dark:text-white focus:bg-white font-medium"
                      />
                    </div>
                    <div className="flex space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowGooglePasswordPrompt(false);
                          setGooglePassword("");
                        }}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold py-3 rounded-lg text-slate-700 dark:text-slate-300 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs font-bold py-3 rounded-lg text-white transition-all shadow-md"
                      >
                        Authorize & Login
                      </button>
                    </div>
                  </form>
                ) : !showGoogleCustomInput ? (
                  <>
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                      <button 
                        type="button"
                        onClick={() => executeGoogleSignIn("cngirababyeyi@gmail.com")}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                            NC
                          </div>
                          <div>
                            <div className="text-xs font-semibold">Ngirababyeyi C.</div>
                            <div className="text-[10px] text-slate-400">cngirababyeyi@gmail.com</div>
                          </div>
                        </div>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-mono group-hover:bg-emerald-600 group-hover:text-white transition-colors">Admin</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowGoogleCustomInput(true)}
                        className="w-full text-center py-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Use another Google Account
                      </button>
                    </div>
                  </>
                ) : (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      executeGoogleSignIn(customGoogleEmail);
                    }} 
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Enter Google Email address</label>
                      <input 
                        type="email"
                        required
                        autoFocus
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        placeholder="your-email@gmail.com"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-900 dark:text-white focus:bg-white font-medium"
                      />
                    </div>
                    <div className="flex space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowGoogleCustomInput(false)}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold py-3 rounded-lg text-slate-700 dark:text-slate-300 transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs font-bold py-3 rounded-lg text-white transition-all shadow-md"
                      >
                        Verify & Login
                      </button>
                    </div>
                  </form>
                )}

                <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed pt-2">
                  To continue, Google will share your profile info and email address with BatoTutariGito. Ensure you authorize responsibly.
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};
