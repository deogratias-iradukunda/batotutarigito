import React, { useState, useEffect } from "react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Share, Comment, Announcement, Student } from "../types";
import { 
  Coins, MessageSquare, Loader2, Calendar, TrendingUp, AlertCircle, 
  Megaphone, GraduationCap, User, Shield, ChevronRight, Lock, CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const UserDashboard: React.FC = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [shares, setShares] = useState<Share[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  
  const [showSettings, setShowSettings] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!authUser) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [studentsResp, sharesResp, annResp, commentsResp] = await Promise.all([
          api.get("/api/resources/students"),
          api.get("/api/resources/shares"),
          api.get("/api/resources/announcements"),
          api.get("/api/resources/comments")
        ]);

        const profile = studentsResp.data.find((s: any) => s.userId === authUser.id);
        if (profile) {
          setStudentProfile(profile);
        }

        const userShares = sharesResp.data.filter((s: any) => s.userId === authUser.id);
        const userComments = commentsResp.data.filter((c: any) => 
          c.targetUserId === authUser.id || 
          c.senderUserId === authUser.id ||
          c.targetRole === "all" ||
          (c.targetRole === "student" && !studentProfile?.isGraduated)
        );

        setShares(userShares);
        setAnnouncements(annResp.data.filter((a: any) => a.published).slice(0, 3));
        setComments(userComments);
      } catch (error: any) {
        console.error("User Dashboard Error:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authUser]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    if (passwordForm.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setPasswordLoading(true);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success("Password updated successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowSettings(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch (e) {
      return "N/A";
    }
  };

  if (loading) return (
    <div className="flex h-[90vh] items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin text-blue-600 mx-auto" size={40} />
        <p className="text-slate-500 font-medium animate-pulse">Loading your portal...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Portal</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">Welcome back, {studentProfile?.name || authUser?.email}! Here's your activity.</p>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:shadow-md transition-all"
        >
          <Shield size={18} />
          Account Settings
        </button>
      </header>

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="premium-card p-8 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
              <div className="max-w-md space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Lock className="text-blue-600" size={20} />
                  Change Password
                </h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Current Password</label>
                    <input 
                      type="password" 
                      required
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">New Password</label>
                    <input 
                      type="password" 
                      required
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Confirm New Password</label>
                    <input 
                      type="password" 
                      required
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button 
                      type="submit"
                      disabled={passwordLoading}
                      className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                    >
                      {passwordLoading ? <Loader2 className="animate-spin" size={18} /> : "Update Password"}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowSettings(false)}
                      className="text-slate-500 font-bold px-8 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="premium-card p-8 space-y-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden ring-1 ring-blue-400/30">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Coins size={120} />
              </div>
              <div className="flex justify-between items-start relative">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <Coins size={24} />
                </div>
                <div className="flex items-center gap-1 bg-green-400/20 text-green-300 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-green-400/50">
                  <TrendingUp size={14} />
                  +0%
                </div>
              </div>
              <div className="space-y-1 relative">
                <p className="text-blue-100/80 text-sm font-medium tracking-wide uppercase">Share Investment</p>
                <h2 className="text-4xl font-bold tracking-tight">
                  {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(
                    shares.reduce((acc, s) => acc + (s.amount || 0), 0)
                  )}
                </h2>
              </div>
              <div className="pt-6 border-t border-white/10 flex justify-between text-xs font-medium relative">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> {shares.length} Active Portions</span>
                <span className="flex items-center gap-1.5"><Calendar size={14} /> Long-term Asset</span>
              </div>
            </div>

            <div className="premium-card p-8 flex flex-col justify-between border-slate-200 dark:border-slate-800">
               <div className="space-y-6">
                 <div className="flex justify-between items-center">
                   <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700">
                     <GraduationCap size={24} className="text-blue-600" />
                   </div>
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 ${
                     studentProfile?.isGraduated ? 'bg-indigo-100 text-indigo-700 ring-indigo-200' : 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                   }`}>
                     {studentProfile?.isGraduated ? 'Graduated' : 'Active Student'}
                   </span>
                 </div>
                 <div className="space-y-2">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Overview</p>
                   <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                     {studentProfile?.department || 'N/A'} - Level {studentProfile?.level || 'N/A'}
                   </h3>
                 </div>
               </div>
               <div className="pt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-6">
                 <div className="flex items-center gap-3">
                   <div className="text-slate-400"><Calendar size={16} /></div>
                   <div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase">Entry Date</p>
                     <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{formatDate(studentProfile?.startDate)}</p>
                   </div>
                 </div>
                 <div className="text-slate-300"><ChevronRight size={20} /></div>
               </div>
            </div>
          </div>

          <section className="space-y-6">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <Megaphone size={24} className="text-blue-600" />
                  Latest Updates
                </h3>
                <p className="text-sm text-slate-500">Key information for the community</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {announcements.length === 0 ? (
                <div className="md:col-span-3 py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-slate-400">No recent announcements.</p>
                </div>
              ) : announcements.map(ann => (
                <div key={ann.id} className="premium-card overflow-hidden group cursor-pointer hover:border-blue-200 dark:hover:border-blue-900 transition-all border-slate-100 dark:border-slate-800">
                  <div className="h-32 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    {ann.images?.[0] ? (
                      <img src={ann.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Megaphone className="text-slate-300 dark:text-slate-700" size={32} /></div>
                    )}
                    <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 shadow-sm">
                       {format(new Date(ann.createdAt), 'MMM d')}
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {ann.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {ann.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Coins size={24} className="text-blue-600" />
                Share Holdings
              </h3>
              <p className="text-sm text-slate-500">Breakdown of your social investments</p>
            </div>
            
            {shares.length === 0 ? (
              <div className="premium-card p-12 text-center text-slate-400">
                <AlertCircle className="mx-auto mb-4" size={48} />
                <p>You don't have any share investments yet.</p>
                <p className="text-xs mt-2 font-medium">Interested? Contact the admin team to get started.</p>
              </div>
            ) : (
              <div className="premium-card overflow-hidden border-slate-100 dark:border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-5">Transaction ID</th>
                        <th className="px-6 py-5">Amount (RWF)</th>
                        <th className="px-6 py-5">Purchase Date</th>
                        <th className="px-6 py-5">Expiry Date</th>
                        <th className="px-6 py-5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {shares.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="px-6 py-5 font-mono text-xs text-slate-400">{s.id?.substring(0, 10).toUpperCase()}</td>
                          <td className="px-6 py-5 font-bold text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform origin-left">
                            {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(s.amount)}
                          </td>
                          <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">{formatDate(s.shareDate)}</td>
                          <td className="px-6 py-5 text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-tight">{formatDate(s.expiryDate)}</td>
                          <td className="px-6 py-5 text-right">
                            <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-[10px] font-bold uppercase border border-green-100 dark:border-green-800">
                               {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="premium-card p-8 space-y-6 text-center border-slate-100 dark:border-slate-800">
              <div className="w-24 h-24 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden flex items-center justify-center relative group ring-1 ring-slate-200 dark:ring-slate-700">
                {studentProfile?.profileImage ? (
                  <img src={studentProfile.profileImage} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                ) : (
                   <User size={40} className="text-slate-300" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-full group-hover:translate-y-0 duration-300">
                   <User size={24} className="text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">{studentProfile?.name || 'My Account'}</h4>
                <p className="text-sm text-slate-500">{authUser?.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                 <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gender</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{studentProfile?.gender || '-'}</p>
                 </div>
                 <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dept</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{studentProfile?.department || '-'}</p>
                 </div>
              </div>
           </div>

           <div className="premium-card overflow-hidden h-fit border-slate-100 dark:border-slate-800">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <MessageSquare size={20} className="text-blue-600" />
                  Mailbox
                </h3>
                <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full text-blue-600">{comments.length}</span>
              </div>
              
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto custom-scrollbar">
                {comments.length === 0 ? (
                  <div className="p-12 text-center">
                    <MessageSquare size={40} className="mx-auto text-slate-100 dark:text-slate-800 mb-4" />
                    <p className="text-xs text-slate-400 font-medium italic">Your inbox is clear.</p>
                  </div>
                ) : comments.map(c => (
                  <div key={c.id} className={`p-6 space-y-3 transition-colors ${c.targetUserId === authUser?.id ? 'bg-blue-50/20 dark:bg-blue-900/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/20'}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${c.targetUserId === authUser?.id ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-200 dark:bg-slate-700'}`} />
                         <span className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">
                        {format(new Date(c.createdAt), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {c.message}
                    </p>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 text-center">
                 <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">System Message Center</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
