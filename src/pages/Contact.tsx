import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Mail, Phone, MapPin, Loader2, Send, CheckCircle, Info } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export const Contact: React.FC = () => {
  const { user: authUser } = useAuth();
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "", targetUserId: "" });
  const [admins, setAdmins] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await api.get("/api/resources/admins");
        setAdmins(response.data);
      } catch (error) {
        console.error("Failed to fetch admin list for Contact Page:", error);
      }
    };
    fetchAdmins();
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post("/api/resources/comments", {
        ...formData,
        senderUserId: authUser?.id || null,
        status: "pending"
      });
      toast.success("BatoTutariGito Team has received your message. Thank you!");
      setFormData({ name: "", email: "", message: "", targetUserId: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Unable to send comment");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-16 px-6">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header Block */}
        <div className="text-center space-y-4">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-full inline-block">Online Message Center</span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            Get in Touch with <span className="text-blue-600">Bato</span>TutariGito
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Have queries on Student Sponsorship, Cow distribution, or volunteering details? Send us a direct private message or dial our main office. We reply promptly!
          </p>
        </div>

        {/* Dynamic Dual Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Detailed Info Cards Column */}
          <div className="space-y-8 text-slate-700 dark:text-slate-300">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-50 dark:border-slate-800">
                Main headquarters Offices
              </h3>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 p-3 rounded-2xl flex-shrink-0 mt-1"><Mail size={20} /></div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Official Email Inquiry</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">cngirababyeyi@gmail.com</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">batotutarigito@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 p-3 rounded-2xl flex-shrink-0 mt-1"><Phone size={20} /></div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Direct Telephone Calls</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">+250 722 529 202</p>
                    <p className="text-slate-400 text-[10px] italic">Hours: Mon - Fri (08:00 - 17:00 CAT)</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 p-3 rounded-2xl flex-shrink-0 mt-1"><MapPin size={20} /></div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Local Physical Address</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">Western Province, Karongi District</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">Rubengera sector, Rwanda</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick response commitments Card */}
            <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-3xl flex gap-4 items-start">
              <Info className="text-blue-600 flex-shrink-0 mt-1" size={24} />
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Automatic Inboxes Stream</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                  Your inquiries are instantly published on the admin dashboard's feedback feed. Administrators receive alerts to analyze and approve your proposals, allowing seamless community communication.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Form Column */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Submit private Inquiry</h3>
            <form onSubmit={handleContactSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Your Full Name</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter full name"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Your Email Address</label>
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Send To (Specific Staff or General)</label>
                <select 
                  value={formData.targetUserId}
                  onChange={e => setFormData({...formData, targetUserId: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white text-xs font-semibold"
                >
                  <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">General Inbox (All Administrators)</option>
                  {admins.filter(a => a.email?.toLowerCase().trim() === "cngirababyeyi@gmail.com").length > 0 ? (
                    admins
                      .filter(a => a.email?.toLowerCase().trim() === "cngirababyeyi@gmail.com")
                      .map(admin => (
                        <option key={admin.id} value={admin.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Staff Coordinator: {admin.name} ({admin.email})</option>
                      ))
                  ) : (
                    <option value="cngirababyeyi" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Staff Coordinator: Clement Ngirababyeyi (cngirababyeyi@gmail.com)</option>
                  )}
                </select>
                <p className="text-[10px] text-slate-400 italic">Optional: Directly address a specific coordinator in the system.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Your Message Contents</label>
                <textarea 
                  required
                  rows={5} 
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  placeholder="Explain your inquiry details..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 font-normal" 
                />
              </div>

              <button 
                disabled={formLoading}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                {formLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} /> Submit message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
