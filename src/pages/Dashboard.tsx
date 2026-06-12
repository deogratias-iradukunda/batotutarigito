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
    <div className="flex h-[90vh] items-center justify-center bg-slate-950">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin text-blue-500 mx-auto" size={40} />
        <p className="text-slate-400 font-semibold animate-pulse tracking-wide text-sm">Loading your custom portal...</p>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-900">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              <h1 className="text-3xl font-black tracking-tight text-white uppercase font-sans">My Portal</h1>
            </div>
            <p className="text-sm text-slate-400 mt-2 font-medium">
              Welcome back, <span className="font-extrabold text-blue-400">{studentProfile?.name || authUser?.email}</span>! Here's your portal overview.
            </p>
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-750 text-slate-300 hover:text-white rounded-xl font-bold hover:shadow-2xl transition-all duration-300 text-xs tracking-wider uppercase"
          >
            <Shield size={16} className="text-blue-500" />
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
              <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
                <div className="max-w-md space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2.5 text-white uppercase tracking-wider">
                    <Lock className="text-blue-500" size={18} />
                    Change Account Password
                  </h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Password</label>
                      <input 
                        type="password" 
                        required
                        value={passwordForm.currentPassword}
                        onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Password</label>
                      <input 
                        type="password" 
                        required
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm New Password</label>
                      <input 
                        type="password" 
                        required
                        value={passwordForm.confirmPassword}
                        onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white font-mono text-sm"
                      />
                    </div>
                    <div className="flex gap-4 pt-2">
                      <button 
                        type="submit"
                        disabled={passwordLoading}
                        className="bg-blue-600 text-white font-bold text-xs tracking-wider uppercase px-8 py-3.5 rounded-xl hover:bg-blue-500 flex items-center gap-2 disabled:opacity-50 transition-colors"
                      >
                        {passwordLoading ? <Loader2 className="animate-spin" size={16} /> : "Update Password"}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowSettings(false)}
                        className="text-slate-400 font-bold text-xs tracking-wider uppercase px-8 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800"
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
          <div className="lg:col-span-8 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="rounded-3xl p-8 space-y-6 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 text-white relative overflow-hidden shadow-2xl group hover:border-slate-700 transition-all duration-300">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300">
                  <Coins size={140} />
                </div>
                <div className="flex justify-between items-start relative z-10">
                  <div className="bg-blue-950/40 border border-blue-800/40 p-3.5 rounded-2xl text-blue-400">
                    <Coins size={24} />
                  </div>
                  <div className="flex items-center gap-1.5 bg-blue-950/50 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-800/40">
                    <TrendingUp size={12} />
                    Endowment Key
                  </div>
                </div>
                <div className="space-y-1 relative z-10">
                  <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Share Investments Allocated</p>
                  <h2 className="text-4xl font-black tracking-tight text-white font-mono">
                    {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(
                      shares.reduce((acc, s) => acc + (s.amount || 0), 0)
                    )}
                  </h2>
                </div>
                <div className="pt-6 border-t border-slate-800/80 flex justify-between text-[11px] font-bold tracking-wide text-slate-400 relative z-10 mt-4">
                  <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-blue-500" /> {shares.length} Active Shares</span>
                  <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-500" /> Long-term Asset</span>
                </div>
              </div>

              <div className="rounded-3xl p-8 bg-slate-900 border border-slate-800 shadow-2xl flex flex-col justify-between hover:border-slate-705 group/card hover:border-slate-700 transition-all duration-300">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850">
                      <GraduationCap size={24} className="text-blue-500" />
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${
                      studentProfile?.isGraduated 
                        ? 'bg-purple-950/40 text-purple-400 border-purple-800/40' 
                        : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                    }`}>
                      {studentProfile?.isGraduated ? 'Graduated' : 'Active Student'}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Academic Status</p>
                    <h3 className="text-2xl font-black text-white tracking-tight">
                      {studentProfile?.department || 'N/A'}
                      {studentProfile?.level && <span className="text-blue-400 block text-lg font-semibold mt-1">Level {studentProfile.level}</span>}
                    </h3>
                  </div>
                </div>
                <div className="pt-6 flex items-center justify-between border-t border-slate-800/80 mt-6">
                  <div className="flex items-center gap-3">
                    <div className="text-slate-500"><Calendar size={18} /></div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Entry Date</p>
                      <p className="text-sm font-extrabold text-slate-300">{formatDate(studentProfile?.startDate)}</p>
                    </div>
                  </div>
                  <div className="text-slate-600"><ChevronRight size={18} /></div>
                </div>
              </div>
            </div>

            <section className="space-y-6">
              <div className="flex justify-between items-end border-b border-slate-900 pb-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black flex items-center gap-3 text-white tracking-tight uppercase">
                    <Megaphone size={24} className="text-blue-500" />
                    Latest Announcements
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">NGO updates and important dates</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {announcements.length === 0 ? (
                  <div className="md:col-span-3 py-16 text-center bg-slate-900 border border-slate-850 rounded-3xl border-dashed">
                    <Megaphone className="text-slate-700 mx-auto mb-3" size={32} />
                    <p className="text-slate-500 font-bold text-sm">No recent announcements from coordinators.</p>
                  </div>
                ) : announcements.map(ann => (
                  <div key={ann.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group cursor-pointer hover:border-slate-700 hover:shadow-2xl transition-all duration-300">
                    <div className="h-40 bg-slate-950 relative overflow-hidden border-b border-slate-800">
                      {ann.images?.[0] ? (
                        <img src={ann.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-950"><Megaphone className="text-slate-800" size={36} /></div>
                      )}
                      <div className="absolute top-3 right-3 bg-slate-950/95 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-400 border border-slate-800 shadow-xl">
                         {format(new Date(ann.createdAt), 'MMM d')}
                      </div>
                    </div>
                    <div className="p-6 space-y-2">
                      <h4 className="font-extrabold text-white line-clamp-1 group-hover:text-blue-400 transition-colors text-sm uppercase tracking-wide">
                        {ann.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {ann.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="space-y-1 border-b border-slate-900 pb-4">
                <h3 className="text-2xl font-black flex items-center gap-3 text-white tracking-tight uppercase">
                  <Coins size={24} className="text-blue-500" />
                  Educational Endowment Shares
                </h3>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Official ledger of Cow Project share distributions</p>
              </div>
              
              {shares.length === 0 ? (
                <div className="bg-slate-900 border border-slate-805 p-12 text-center rounded-3xl border-dashed border-slate-800">
                  <AlertCircle className="mx-auto mb-4 text-slate-600 animate-pulse" size={48} />
                  <p className="text-slate-350 font-bold">You don't have any share investments allocated yet.</p>
                  <p className="text-xs mt-2 text-slate-500 max-w-sm mx-auto">Get in touch with BatoTutariGito management to coordinate cow-milking allocations under your profile.</p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-800">
                        <tr>
                          <th className="px-6 py-5">Share Reference ID</th>
                          <th className="px-6 py-5">Amount (RWF)</th>
                          <th className="px-6 py-5">Distribution Date</th>
                          <th className="px-6 py-5">Expiry Date</th>
                          <th className="px-6 py-5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {shares.map(s => (
                          <tr key={s.id} className="hover:bg-slate-950/60 transition-colors group">
                            <td className="px-6 py-5 font-mono text-[11px] text-slate-500 tracking-wider">BG-SHARE-{s.id?.substring(0, 8).toUpperCase()}</td>
                            <td className="px-6 py-5 font-black text-blue-400 group-hover:scale-105 transition-transform origin-left text-sm font-mono">
                              {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(s.amount)}
                            </td>
                            <td className="px-6 py-5 text-xs text-slate-400 font-mono">{formatDate(s.shareDate)}</td>
                            <td className="px-6 py-5 text-xs font-semibold text-slate-300 uppercase tracking-widest font-mono">{formatDate(s.expiryDate)}</td>
                            <td className="px-6 py-5 text-right">
                              <span className="px-3 py-1 rounded-full bg-emerald-950/65 text-emerald-400 border border-emerald-800/40 text-[9px] font-black uppercase tracking-widest">
                                 {s.status || "ACTIVE"}
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
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 text-center shadow-2xl relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
              <div className="w-24 h-24 mx-auto rounded-full bg-slate-950 border-4 border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center relative group">
                {studentProfile?.profileImage ? (
                  <img src={studentProfile.profileImage} className="w-full h-full object-cover transition-transform duration-350 group-hover:scale-110" />
                ) : (
                   <User size={40} className="text-slate-600" />
                )}
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xl font-black text-white tracking-tight uppercase">{studentProfile?.name || 'My Account'}</h4>
                <p className="text-xs font-mono text-slate-500 tracking-wide">{authUser?.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center pt-2">
                 <div className="p-3 bg-slate-950/70 border border-slate-850 rounded-2xl">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Gender</p>
                    <p className="text-xs font-extrabold text-slate-300 mt-1 font-sans">{studentProfile?.gender || '-'}</p>
                 </div>
                 <div className="p-3 bg-slate-950/70 border border-slate-850 rounded-2xl">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Dept</p>
                    <p className="text-xs font-extrabold text-slate-300 mt-1 font-sans truncate" title={studentProfile?.department}>{studentProfile?.department || '-'}</p>
                 </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden h-fit shadow-2xl hover:border-slate-700 transition-all duration-300">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <h3 className="font-black flex items-center gap-2.5 text-white tracking-tight uppercase text-sm">
                  <MessageSquare size={18} className="text-blue-500" />
                  Mailbox Inbox
                </h3>
                <span className="bg-slate-950 border border-slate-800 text-[10px] font-mono font-bold px-3 py-0.5 rounded-full text-blue-400">{comments.length}</span>
              </div>
              
              <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
                {comments.length === 0 ? (
                  <div className="p-16 text-center">
                    <MessageSquare size={36} className="mx-auto text-slate-800 mb-3" />
                    <p className="text-xs text-slate-500 font-bold italic">Your inbox is clear.</p>
                  </div>
                ) : comments.map(c => (
                  <div key={c.id} className={`p-6 space-y-2.5 transition-colors ${c.targetUserId === authUser?.id ? 'bg-blue-950/15' : 'hover:bg-slate-950/20'}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${c.targetUserId === authUser?.id ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-slate-800'}`} />
                         <span className="text-xs font-black text-slate-200">{c.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 font-medium">
                        {format(new Date(c.createdAt), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
                      {c.message}
                    </p>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-slate-950/40 border-t border-slate-800 text-center">
                 <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">System Message Center</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
