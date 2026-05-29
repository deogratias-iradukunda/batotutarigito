import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import { Share, Student, Cow, Family, Announcement, Comment, SupportRecord } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Milk, Heart, TrendingUp, Plus, Search, Filter, Edit, Trash2, 
  Calendar, MapPin, GraduationCap, Upload, Download, Eye,
  BarChart3, MessageSquare, Megaphone, Loader2, X, CheckCircle2, AlertCircle, Coins,
  Mail, Lock, Settings
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { toast } from "sonner";
import { format, addYears } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

// --- Sub-components ---

const generatePassword = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pass = "";
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
};

const StatCard = ({ title, value, icon, color, trend }: any) => (
  <div className="premium-card p-6 flex items-start justify-between">
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{value}</h3>
      {trend && (
        <p className={`text-xs font-semibold ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend > 0 ? '+' : ''}{trend}% from last month
        </p>
      )}
    </div>
    <div className={`p-4 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
      {React.cloneElement(icon, { size: 24, className: color.replace('bg-', 'text-') })}
    </div>
  </div>
);

// --- Main Dashboard ---

export const AdminDashboard: React.FC = () => {
  const { user: authUser } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    students: [] as Student[],
    graduated: [] as Student[],
    families: [] as Family[],
    cows: [] as Cow[],
    calves: [] as any[],
    announcements: [] as Announcement[],
    comments: [] as Comment[],
    supportRecords: [] as SupportRecord[],
    shares: [] as Share[],
    expenses: [] as any[]
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ tab: string; id: string } | null>(null);

  const unreadCommentsCount = data.comments.filter(c => c.status === "pending").length;

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await api.get("/api/dashboard/bulk-data");
      const d = resp.data;

      setData({
        students: (d.students || []).filter((s: any) => !s.isGraduated),
        graduated: (d.students || []).filter((s: any) => s.isGraduated),
        families: d.families || [],
        cows: d.cows || [],
        calves: d.calves || [],
        announcements: d.announcements || [],
        comments: d.comments || [],
        supportRecords: d.supportRecords || [],
        shares: d.shares || [],
        expenses: d.expenses || []
      });
    } catch (error: any) {
      console.error("Dashboard Fetch Error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = (tab: string, id: string) => {
    setDeleteConfirm({ tab, id });
  };

  const executeDelete = async (tab: string, id: string) => {
    const oldData = { ...data };

    setData(prev => {
      const updated = { ...prev };
      if (tab === "students") {
        updated.students = updated.students.filter(s => s.id !== id);
      } else if (tab === "graduated") {
        updated.graduated = updated.graduated.filter(g => g.id !== id);
      } else if (tab === "families") {
        updated.families = updated.families.filter(f => f.id !== id);
      } else if (tab === "cows") {
        updated.cows = updated.cows.filter(c => c.id !== id);
      } else if (tab === "calves") {
        updated.calves = updated.calves.filter(c => c.id !== id);
      } else if (tab === "announcements") {
        updated.announcements = updated.announcements.filter(a => a.id !== id);
      } else if (tab === "support") {
        updated.supportRecords = updated.supportRecords.filter(s => s.id !== id);
      } else if (tab === "comments") {
        updated.comments = updated.comments.filter(c => c.id !== id);
      } else if (tab === "shares") {
        updated.shares = updated.shares.filter(s => s.id !== id);
      } else if (tab === "expenses") {
        updated.expenses = (updated.expenses || []).filter(e => e.id !== id);
      }
      return updated;
    });

    try {
      await api.delete(`/api/resources/${tab === "graduated" ? "students" : tab === "support" ? "support_records" : tab}/${id}`);
      toast.success("Deleted successfully");
      fetchData();
    } catch (error: any) {
      setData(oldData);
      toast.error(error.response?.data?.error || "Failed to delete");
    }
  };

  const menuItems = [
    { id: "overview", label: "Overview", icon: <BarChart3 size={20} /> },
    { id: "students", label: "Students", icon: <Users size={20} /> },
    { id: "graduated", label: "Graduates", icon: <GraduationCap size={20} /> },
    { id: "families", label: "Families", icon: <Heart size={20} /> },
    { id: "cows", label: "Cow Project", icon: <Milk size={20} /> },
    { id: "calves", label: "Calves Transfers", icon: <TrendingUp size={20} /> },
    { id: "announcements", label: "Announcements", icon: <Megaphone size={20} /> },
    { id: "support", label: "Community Support", icon: <Heart size={20} /> },
    { 
      id: "comments", 
      label: "Feedback", 
      icon: (
        <div className="relative">
          <MessageSquare size={20} />
          {unreadCommentsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
              {unreadCommentsCount}
            </span>
          )}
        </div>
      ) 
    },
    { id: "shares", label: "Shares", icon: <Coins size={20} /> },
    { id: "expenses", label: "Expenses", icon: <Coins size={20} /> },
    { id: "settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-[80vh] bg-slate-50 dark:bg-slate-950">
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 space-y-2">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === item.id 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </aside>

      <main className="flex-1 p-6 md:p-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white capitalize">
              {activeTab === "settings" ? "Account Settings" : activeTab}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Welcome back, Administrator</p>
          </div>
          {activeTab !== "settings" && (
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search anything..." 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600 w-64 text-slate-900 dark:text-white font-medium"
                />
              </div>
              <button 
                 onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}
                 className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <Plus size={18} />
                Add New
              </button>
            </div>
          )}
        </header>

        {activeTab === "overview" && <Overview data={data} />}
        {activeTab === "students" && (
          <StudentManagement 
            data={data.students.filter(s => 
              s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              s.email.toLowerCase().includes(searchTerm.toLowerCase())
            )} 
            onEdit={(s) => { setSelectedItem(s); setIsModalOpen(true); }}
            onDelete={(id) => handleDelete("students", id)}
          />
        )}
        {activeTab === "graduated" && (
          <GraduateManagement 
            data={data.graduated.filter(g => 
              g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              g.email.toLowerCase().includes(searchTerm.toLowerCase())
            )} 
            onEdit={(g) => { setSelectedItem(g); setIsModalOpen(true); }}
            onDelete={(id) => handleDelete("graduated", id)}
          />
        )}
        {activeTab === "families" && (
          <FamilyManagement 
            data={data.families.filter(f => 
              f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              (f.username && f.username.toLowerCase().includes(searchTerm.toLowerCase()))
            )} 
            onEdit={(f) => { setSelectedItem(f); setIsModalOpen(true); }}
            onDelete={(id) => handleDelete("families", id)}
          />
        )}
        {activeTab === "cows" && (
          <CowManagement 
            data={data.cows.filter(c => 
              c.cowNumber.toLowerCase().includes(searchTerm.toLowerCase())
            )} 
            onEdit={(c) => { setSelectedItem(c); setIsModalOpen(true); }}
            onDelete={(id) => handleDelete("cows", id)}
          />
        )}
        {activeTab === "calves" && (
          <CalvesManagement 
            data={data.calves.filter(c => 
              (c.cow?.cowNumber && c.cow.cowNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (c.fromFamily?.name && c.fromFamily.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (c.toFamily?.name && c.toFamily.name.toLowerCase().includes(searchTerm.toLowerCase()))
            )} 
            onEdit={(c) => { setSelectedItem(c); setIsModalOpen(true); }}
            onDelete={(id) => handleDelete("calves", id)}
          />
        )}
        {activeTab === "announcements" && (
          <AnnouncementManagement 
            data={data.announcements.filter(a => 
              a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
              a.description.toLowerCase().includes(searchTerm.toLowerCase())
            )} 
            onEdit={(a) => { setSelectedItem(a); setIsModalOpen(true); }}
            onDelete={(id) => handleDelete("announcements", id)}
          />
        )}
        {activeTab === "support" && (
          <SupportManagement 
            data={data.supportRecords.filter(s => 
              s.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) || 
              (s.telephone && s.telephone.includes(searchTerm))
            )} 
            onEdit={(s) => { setSelectedItem(s); setIsModalOpen(true); }}
            onDelete={(id) => handleDelete("support", id)}
          />
        )}
        {activeTab === "comments" && (
          <CommentManagement 
            data={data.comments.filter(c => 
              c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              c.message.toLowerCase().includes(searchTerm.toLowerCase())
            )} 
            onEdit={fetchData} 
            onDelete={(id) => handleDelete("comments", id)}
          />
        )}
        {activeTab === "shares" && (
          <ShareManagement 
            data={data.shares.filter(sh => 
              sh.userName.toLowerCase().includes(searchTerm.toLowerCase())
            )} 
            onEdit={(sh) => { setSelectedItem(sh); setIsModalOpen(true); }}
            onDelete={(id) => handleDelete("shares", id)}
          />
        )}
        {activeTab === "expenses" && (
          <ExpenseManagement 
            data={(data.expenses || []).filter(e => 
              (e.cowNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
              (e.type || "").toLowerCase().includes(searchTerm.toLowerCase())
            )} 
            onEdit={(exp: any) => { setSelectedItem(exp); setIsModalOpen(true); }}
            onDelete={(id: string) => handleDelete("expenses", id)}
          />
        )}
        {activeTab === "settings" && (
          <SettingsPanel onPasswordChanged={fetchData} />
        )}
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                   {selectedItem ? 'Edit' : 'Add New'} {activeTab.slice(0, -1)}
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                   <X size={20} />
                 </button>
              </div>
              <div className="p-8 max-h-[70vh] overflow-y-auto">
                 <ManagementForm 
                    type={activeTab} 
                    initialData={selectedItem} 
                    onClose={() => { setIsModalOpen(false); fetchData(); }} 
                 />
              </div>
            </motion.div>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-6"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Confirm Deletion
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Are you sure you want to permanently delete this item? This action will permanently remove it from the database and cannot be undone.
              </p>
              <div className="flex justify-end gap-3 font-semibold text-xs font-sans">
                <button 
                  onClick={() => setDeleteConfirm(null)} 
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const { tab, id } = deleteConfirm;
                    setDeleteConfirm(null);
                    executeDelete(tab, id);
                  }} 
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-md active:scale-95 duration-200"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Simplified Tab Components and Form ---
// --- Comprehensive Tab Components and Form ---
const Overview = ({ data }: any) => {
  const activeCowCount = data.cows?.filter((c: any) => c.status === "active" || !c.status).length || 0;
  const soldCowCount = data.cows?.filter((c: any) => c.status === "sold").length || 0;
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Students" value={data.students.length} icon={<Users />} color="bg-blue-600" />
        <StatCard title="Graduates" value={data.graduated.length} icon={<GraduationCap />} color="bg-purple-600" />
        <StatCard title="Families" value={data.families.length} icon={<Heart />} color="bg-red-500" />
        <StatCard title="Cows (Active / Sold)" value={`${activeCowCount} / ${soldCowCount}`} icon={<Milk />} color="bg-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Core Statistics Summary Checklist</h4>
          <div className="space-y-3 font-semibold text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between pb-2 border-b border-dashed border-slate-200">
              <span>Total Social Investment (Shares Distributed):</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(
                  data.shares?.reduce((acc: number, val: any) => acc + (val.amount || 0), 0) || 0
                )}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-dashed border-slate-200">
              <span>Feedback Tickets Received:</span>
              <span className="font-bold text-yellow-600">{data.comments?.length || 0} Comments</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-dashed border-slate-200">
              <span>Active Families Registered:</span>
              <span className="font-bold text-red-500">{data.families?.length || 0} Families</span>
            </div>
            <div className="flex justify-between">
              <span>Total Community Support Deliveries:</span>
              <span className="font-bold text-green-600">{data.supportRecords?.length || 0} Activities</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center items-center text-center space-y-2">
          <TrendingUp className="text-blue-600 mb-2" size={32} />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Active Livestock Yield Metrics</h4>
          <p className="text-xs text-slate-400 max-w-sm">
            Tracking animal medicine and glasses expenses continuously calculates exact profit & loss margins across your cattle operations.
          </p>
        </div>
      </div>
    </div>
  );
};

interface SettingsPanelProps {
  onPasswordChanged: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onPasswordChanged }) => {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

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
      onPasswordChanged();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="premium-card p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl mx-auto shadow-sm">
      <div className="space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="text-blue-600" size={22} />
            Change Password
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Update your administrator account password. Keep your login credentials secure.
          </p>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Current Password
            </label>
            <input 
              type="password" 
              required
              value={passwordForm.currentPassword}
              onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white font-medium transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              New Password
            </label>
            <input 
              type="password" 
              required
              value={passwordForm.newPassword}
              onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white font-medium transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Confirm New Password
            </label>
            <input 
              type="password" 
              required
              value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white font-medium transition-all"
            />
          </div>
          <div className="pt-4">
            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Save New Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StudentManagement = ({ data, onEdit, onDelete }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-700">
    <table className="w-full text-left text-sm">
      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] font-bold">
        <tr>
          <th className="px-6 py-4">Name</th>
          <th className="px-6 py-4">Email</th>
          <th className="px-6 py-4">Dept</th>
          <th className="px-6 py-4">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
        {data.length === 0 ? (
          <tr>
            <td colSpan={4} className="text-center py-8 text-slate-400 font-medium">No active students found.</td>
          </tr>
        ) : data.map((s: any) => (
          <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td className="px-6 py-4 font-bold dark:text-white">{s.name}</td>
            <td className="px-6 py-4 text-slate-500 font-medium">{s.email}</td>
            <td className="px-6 py-4 dark:text-slate-300 font-medium">{s.department}</td>
            <td className="px-6 py-4 space-x-2 text-xs">
              <button onClick={() => onEdit(s)} className="text-blue-600 hover:text-blue-700 font-bold">Edit</button>
              <button onClick={() => onDelete(s.id)} className="text-red-600 hover:text-red-700 font-bold">Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const GraduateManagement = ({ data, onEdit, onDelete }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-700">
    <table className="w-full text-left text-sm font-semibold">
      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] font-bold">
        <tr>
          <th className="px-6 py-4">Name</th>
          <th className="px-6 py-4">Email</th>
          <th className="px-6 py-4">Department</th>
          <th className="px-6 py-4">Status</th>
          <th className="px-6 py-4">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {data.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">No graduates found in roster.</td>
          </tr>
        ) : data.map((g: any) => (
          <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td className="px-6 py-4 font-bold dark:text-white text-slate-900">{g.name}</td>
            <td className="px-6 py-4 text-slate-500 font-medium">{g.email}</td>
            <td className="px-6 py-4 dark:text-slate-300 text-slate-600 font-medium">{g.department}</td>
            <td className="px-6 py-4">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 capitalize">
                Graduated
              </span>
            </td>
            <td className="px-6 py-4 space-x-2 text-xs font-bold">
              <button onClick={() => onEdit(g)} className="text-blue-600 hover:text-blue-700 font-bold">Edit</button>
              <button onClick={() => onDelete(g.id)} className="text-red-600 hover:text-red-700 font-bold">Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const FamilyManagement = ({ data, onEdit, onDelete }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] font-bold">
          <tr>
            <th className="px-6 py-4">Family Head</th>
            <th className="px-6 py-4">Username & Tel</th>
            <th className="px-6 py-4">Location</th>
            <th className="px-6 py-4">Cow Project Details</th>
            <th className="px-6 py-4">Calves Source & Amount</th>
            <th className="px-6 py-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-xs">
          {data.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-slate-400">No families registered yet.</td>
            </tr>
          ) : data.map((f: any) => (
            <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="px-6 py-4 font-bold dark:text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/30 text-red-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {f.name.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">{f.name}</p>
                    <p className="text-[9px] text-slate-400 font-mono font-normal">ID: {f.id.substring(0, 8)}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-slate-700 dark:text-slate-300 font-bold font-mono text-xs">@{f.username || 'n/a'}</p>
                <p className="text-[10px] text-slate-400 font-medium">{f.telephone || 'No phone'}</p>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-start gap-1 text-slate-600 dark:text-slate-400 text-xs">
                  <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold block text-slate-800 dark:text-slate-200">{f.sector || '-'}, {f.cell || '-'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">Village: {f.village || '-'}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                {f.cowProjectSource ? (
                  <div className="text-[11px] bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-0.5">
                    <p className="text-slate-400 font-bold uppercase text-[8px]">From Family/Source:</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">{f.cowProjectSource}</p>
                    {f.cowProjectDate && <p className="text-[9px] text-slate-400">{format(new Date(f.cowProjectDate), 'MMM d, yyyy')}</p>}
                    <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 font-mono">
                      {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(f.cowProjectAmount || 0)}
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">No cow project assigned</span>
                )}
              </td>
              <td className="px-6 py-4 font-medium">
                {f.calvesSource ? (
                  <div className="text-[11px] bg-indigo-50/50 dark:bg-indigo-950/10 p-2 rounded-xl border border-indigo-100/30">
                    <p className="text-indigo-400 font-bold uppercase text-[8px]">Passed calf source:</p>
                    <p className="font-bold text-indigo-800 dark:text-indigo-200 leading-tight">{f.calvesSource}</p>
                    <p className="text-indigo-600 dark:text-indigo-400 font-bold font-mono text-[11px] mt-1">
                      {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(f.calvesAmount || 0)}
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">No calves recorded</span>
                )}
              </td>
              <td className="px-6 py-4 text-xs font-bold space-x-2">
                <button onClick={() => onEdit(f)} className="text-blue-600 hover:text-blue-700">Edit</button>
                <button onClick={() => onDelete(f.id)} className="text-red-600 hover:text-red-700">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const CowManagement = ({ data, onEdit, onDelete }: any) => {
  const { t } = useTranslation();
  const totalPurchase = data.reduce((sum: number, c: any) => sum + (c.purchaseAmount || 0), 0);

  const fmt = (num: number) => {
    return new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(num);
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="premium-card p-6 bg-slate-900 dark:bg-slate-950 text-white space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t("cow.inventory")}</p>
          <div className="flex justify-between items-baseline font-mono">
            <h3 className="text-3xl font-extrabold">{data.length}</h3>
          </div>
        </div>

        <div className="premium-card p-6 bg-white dark:bg-slate-900 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t("cow.totalCost")}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{fmt(totalPurchase)}</h3>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 dark:text-white">{t("cow.listTitle")}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-6 py-4">{t("cow.number")}</th>
                <th className="px-6 py-4">{t("cow.purchase")}</th>
                <th className="px-6 py-4">{t("cow.date")}</th>
                <th className="px-6 py-4">{t("cow.sourcedFamily")}</th>
                <th className="px-6 py-4 text-right">{t("cow.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-xs">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">No cows registered in current tracker.</td>
                </tr>
              ) : data.map((c: any) => {
                return (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white shrink-0">{c.cowNumber}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-mono">{fmt(c.purchaseAmount || 0)}</td>
                    <td className="px-6 py-4 text-slate-500 font-normal">
                      {c.dateReceived ? format(new Date(c.dateReceived), 'yyyy-MM-dd') : 'n/a'}
                    </td>
                    <td className="px-6 py-4">
                      {c.family ? (
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{c.family.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold font-mono">@{c.family.username}</p>
                        </div>
                      ) : (
                        <p className="text-slate-400 font-normal italic">{t("cow.noFamily")}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 text-xs font-bold shrink-0">
                      <button onClick={() => onEdit(c)} className="text-blue-600 hover:text-blue-700">Edit</button>
                      <button onClick={() => onDelete(c.id)} className="text-red-600 hover:text-red-700">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AnnouncementManagement = ({ data, onEdit, onDelete }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-slate-700">
    {data.length === 0 ? (
      <div className="col-span-full text-center py-12 premium-card p-6 text-slate-400 bg-white dark:bg-slate-900">
        <Megaphone className="mx-auto text-slate-300 mb-2" size={40} />
        <p>No announcements broadcasted yet.</p>
      </div>
    ) : data.map((ann: any) => (
      <div key={ann.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
        <div>
          {ann.images?.[0] ? (
            <div className="h-44 overflow-hidden relative bg-slate-100">
              <img src={ann.images[0]} referrerPolicy="no-referrer" alt={ann.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute top-3 right-3">
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border ${ann.published ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-150 text-slate-600 border-slate-300'}`}>
                  {ann.published ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-44 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Megaphone size={32} />
            </div>
          )}
          <div className="p-6 space-y-2">
            <span className="text-[10px] font-bold text-slate-450">{format(new Date(ann.createdAt), 'MMMM d, yyyy')}</span>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug line-clamp-1">{ann.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold line-clamp-3">{ann.description}</p>
          </div>
        </div>
        <div className="p-6 border-t border-slate-50 dark:border-slate-800/80 flex justify-between gap-4 text-xs font-bold">
          <button onClick={() => onEdit(ann)} className="text-blue-600 hover:text-blue-700">Edit</button>
          <button onClick={() => onDelete(ann.id)} className="text-red-600 hover:text-red-700 font-bold">Delete</button>
        </div>
      </div>
    ))}
  </div>
);

const ShareManagement = ({ data, onEdit, onDelete }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-700">
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] font-bold">
          <tr>
            <th className="px-6 py-4">Transaction ID</th>
            <th className="px-6 py-4">Recipient Name</th>
            <th className="px-6 py-4">Amount (RWF)</th>
            <th className="px-6 py-4">Share Date</th>
            <th className="px-6 py-4">Expiry Date</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-xs">
          {data.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">No share assignments recorded.</td>
            </tr>
          ) : data.map((sh: any) => (
            <tr key={sh.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="px-6 py-4 font-mono text-xs text-slate-400">{sh.id?.substring(0, 8).toUpperCase()}</td>
              <td className="px-6 py-4 font-bold dark:text-white text-slate-900">{sh.userName}</td>
              <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400 font-mono">
                {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(sh.amount)}
              </td>
              <td className="px-6 py-4 text-slate-500 font-medium">{format(new Date(sh.shareDate), 'MMM d, yyyy')}</td>
              <td className="px-6 py-4 text-slate-500 font-medium">{format(new Date(sh.expiryDate), 'MMM d, yyyy')}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${sh.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-650 border border-red-200'}`}>
                  {sh.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right text-xs shrink-0 font-bold">
                <button onClick={() => onDelete(sh.id)} className="text-red-600 hover:text-red-700">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ExpenseManagement = ({ data, onEdit, onDelete }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-700">
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] font-bold">
          <tr>
            <th className="px-6 py-4">Cow Number / Tag</th>
            <th className="px-6 py-4 font-bold">Expenses Type</th>
            <th className="px-6 py-4 font-bold">Amount (RWF)</th>
            <th className="px-6 py-4 font-bold">Expense Date</th>
            <th className="px-6 py-4 text-right font-bold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-xs">
          {data.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">No expenses recorded yet.</td>
            </tr>
          ) : data.map((exp: any) => (
            <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">{exp.cowNumber}</td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${
                  exp.type === "medicines"
                    ? "bg-purple-50 text-purple-750 border border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800/30"
                    : exp.type === "foods"
                    ? "bg-emerald-50 text-emerald-750 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30"
                    : "bg-blue-50 text-blue-750 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/30"
                }`}>
                  {exp.type}
                </span>
              </td>
              <td className="px-6 py-4 font-bold text-slate-900 dark:text-white font-mono">
                {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(exp.amount)}
              </td>
              <td className="px-6 py-4 text-slate-500 font-medium">{format(new Date(exp.date), 'MMM d, yyyy')}</td>
              <td className="px-6 py-4 text-right space-x-3 text-xs shrink-0 font-bold">
                <button onClick={() => onEdit(exp)} className="text-blue-600 hover:text-blue-750">Edit</button>
                <button onClick={() => onDelete(exp.id)} className="text-red-600 hover:text-red-750">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const SupportManagement = ({ data, onEdit, onDelete }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-700">
    <table className="w-full text-left text-sm font-semibold">
      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] font-bold">
        <tr>
          <th className="px-6 py-4">Beneficiary</th>
          <th className="px-6 py-4">Telephone</th>
          <th className="px-6 py-4">Address</th>
          <th className="px-6 py-4">Support Type</th>
          <th className="px-6 py-4">Date Provided</th>
          <th className="px-6 py-4">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-600">
        {data.length === 0 ? (
          <tr>
            <td colSpan={6} className="text-center py-8 text-slate-400 font-normal">No community support records found.</td>
          </tr>
        ) : data.map((sup: any) => (
          <tr key={sup.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td className="px-6 py-4 font-bold dark:text-white text-slate-900">{sup.beneficiaryName}</td>
            <td className="px-6 py-4 text-slate-500">{sup.telephone || '-'}</td>
            <td className="px-6 py-4 text-xs dark:text-slate-300 text-slate-500">{sup.address || '-'}</td>
            <td className="px-6 py-4">
              <span className="px-2 py-0.5 rounded-full text-[9px] bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-bold uppercase border border-blue-200">
                {sup.supportType}
              </span>
            </td>
            <td className="px-6 py-4 text-slate-500 font-medium">{format(new Date(sup.date), 'MMM d, yyyy')}</td>
            <td className="px-6 py-4 space-x-2 text-xs font-bold">
              <button onClick={() => onEdit(sup)} className="text-blue-600 hover:text-blue-700">Edit</button>
              <button onClick={() => onDelete(sup.id)} className="text-red-600 hover:text-red-700">Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CommentManagement = ({ data, onEdit, onDelete }: any) => {
  const handleResolve = async (id: string, currentStatus: string) => {
    try {
      const targetStatus = currentStatus === "resolved" ? "pending" : "resolved";
      await api.patch(`/api/resources/comments/${id}`, { status: targetStatus });
      toast.success("Feedback status updated completed!");
      onEdit();
    } catch (e: any) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-slate-700">
      {data.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <MessageSquare size={40} className="mx-auto mb-2 text-slate-300" />
          <p>Feedback logs are pristine.</p>
        </div>
      ) : data.map((c: any) => (
        <div key={c.id} className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-900 dark:text-white">{c.name}</span>
              <span className="text-xs text-slate-400 font-mono">({c.email})</span>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                c.status === 'resolved' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}>
                {c.status}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">{c.message}</p>
            <p className="text-[10px] text-slate-400 font-bold">{format(new Date(c.createdAt), 'MMM d, yyyy HH:mm')}</p>
          </div>
          <div className="flex gap-2 shrink-0 text-xs font-bold">
            <button 
              onClick={() => handleResolve(c.id, c.status)} 
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                c.status === 'resolved'
                ? 'bg-slate-50 hover:bg-slate-150 dark:bg-slate-800 text-slate-700 border-slate-200'
                : 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-sm'
              }`}
            >
              {c.status === 'resolved' ? 'Mark Pending' : 'Mark Resolved'}
            </button>
            <button 
              onClick={() => onDelete(c.id)} 
              className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-150 text-red-600 border border-red-100"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const CalvesManagement = ({ data, onEdit, onDelete }: any) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-700">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-800 dark:text-white">Active Calves Tracking & Sourcing</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Origin Cow (Tag)</th>
              <th className="px-6 py-4">From Family</th>
              <th className="px-6 py-4">New Sourced Family</th>
              <th className="px-6 py-4">Transfer Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-xs animate-fade-in">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">No calf transfers registered yet.</td>
              </tr>
            ) : data.map((calf: any) => (
              <tr key={calf.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-4 font-mono text-slate-400">#{calf.id.substring(0, 8).toUpperCase()}</td>
                <td className="px-6 py-4">
                  {calf.cow ? (
                    <div className="flex items-center gap-2">
                      <Milk size={14} className="text-blue-500" />
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{calf.cow.cowNumber}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No assigned cow</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {calf.fromFamily ? (
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{calf.fromFamily.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal">@{calf.fromFamily.username || 'n/a'}</p>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No original family</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {calf.toFamily ? (
                    <div>
                      <p className="font-bold text-indigo-600 dark:text-indigo-400">{calf.toFamily.name}</p>
                      <p className="text-[10px] text-indigo-400">@{calf.toFamily.username || 'n/a'}</p>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No destination family</span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-500 font-medium">
                  {calf.transferDate ? format(new Date(calf.transferDate), 'MMM d, yyyy') : 'n/a'}
                </td>
                <td className="px-6 py-4 text-right space-x-2 text-xs font-bold shrink-0">
                  <button onClick={() => onEdit(calf)} className="text-blue-600 hover:text-blue-700">Edit</button>
                  <button onClick={() => onDelete(calf.id)} className="text-red-600 hover:text-red-700 font-bold">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ManagementForm = ({ type, initialData, onClose }: any) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(initialData || {});
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [cows, setCows] = useState<any[]>([]);

  useEffect(() => {
    if (type === "shares") {
      api.get("/api/resources/students").then(res => {
        setUsers(res.data);
        if (res.data.length > 0 && !formData.userId) {
          setFormData((prev: any) => ({
            ...prev,
            userId: res.data[0].userId,
            userName: res.data[0].name
          }));
        }
      }).catch(err => {
        console.error("Failed to load user list for shares mapping:", err);
      });
    }

    if (type === "cows" || type === "calves") {
      api.get("/api/resources/families").then(res => {
        setFamilies(res.data);
      }).catch(err => {
        console.error("Failed to load family list for cows mapping:", err);
      });
    }

    if (type === "calves" || type === "expenses") {
      api.get("/api/resources/cows").then(res => {
        setCows(res.data);
      }).catch(err => {
        console.error("Failed to load cows list for mapping:", err);
      });
    }
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalData = { ...formData };
      
      if (finalData.cowNumber === "CUSTOM_TAG") {
        finalData.cowNumber = finalData.manualCowNumber || "";
      }
      
      if (type === "families" && !finalData.name) {
        finalData.name = finalData.username || "Family Head";
      }

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("image", imageFile);
        const uploadResp = await api.post("/api/upload", uploadData);
        if (type === "announcements") {
          finalData.images = [uploadResp.data.url];
        } else {
          finalData.profileImage = uploadResp.data.url;
        }
      }

      const collection = type === "graduated" ? "students" : type === "support" ? "support_records" : type;

      if (initialData?.id) {
        await api.patch(`/api/resources/${collection}/${initialData.id}`, finalData);
        toast.success("Updated successfully");
      } else {
        if (type === "students" || type === "graduated") {
          const password = generatePassword();
          const signupPayload = {
            ...finalData,
            isGraduated: type === "graduated",
            status: type === "graduated" ? "graduated" : (finalData.status || "active"),
            password
          };
          await api.post("/api/register-student", signupPayload);
          toast.success(`${type === "graduated" ? "Graduate" : "Student"} registered! Credentials check your mail.`);
        } else {
          await api.post(`/api/resources/${collection}`, finalData);
          toast.success("Added successfully");
        }
      }
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  const renderFields = () => {
    switch (type) {
      case "students":
      case "graduated":
        return (
          <>
            <div className="space-y-1 mb-4">
              <label className="text-xs font-bold text-slate-500 uppercase">Profile Image</label>
              <input type="file" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-slate-700">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                <input required value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                <input required type="email" value={formData.email || ""} onChange={e => setFormData({...formData, email: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-slate-700">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                <input value={formData.department || ""} onChange={e => setFormData({...formData, department: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Level</label>
                <input value={formData.level || ""} onChange={e => setFormData({...formData, level: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
              </div>
            </div>
          </>
        );
      case "families":
        return (
          <div className="space-y-4 text-slate-700">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Username Reference</label>
              <input required value={formData.username || ""} onChange={e => setFormData({...formData, username: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs" placeholder="e.g. kamil-family" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Telephone (tell)</label>
              <input value={formData.telephone || ""} onChange={e => setFormData({...formData, telephone: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" placeholder="e.g. +250 788..." />
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-2 font-semibold">Location (sector, cell, village)</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Sector</label>
                  <input required value={formData.sector || ""} onChange={e => setFormData({...formData, sector: e.target.value})} className="form-input w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Cell</label>
                  <input required value={formData.cell || ""} onChange={e => setFormData({...formData, cell: e.target.value})} className="form-input w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Village</label>
                  <input required value={formData.village || ""} onChange={e => setFormData({...formData, village: e.target.value})} className="form-input w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2" />
                </div>
              </div>
            </div>
          </div>
        );
      case "cows":
        return (
          <div className="space-y-4 text-slate-700 font-semibold">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{t("cow.number")}</label>
                <input required value={formData.cowNumber || ""} onChange={e => setFormData({...formData, cowNumber: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-mono" placeholder="e.g. CO-8291" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{t("cow.purchase")}</label>
                <input required type="number" value={formData.purchaseAmount || ""} onChange={e => setFormData({...formData, purchaseAmount: parseFloat(e.target.value)})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 font-semibold">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{t("cow.date")}</label>
                <input required type="date" value={formData.dateReceived ? new Date(formData.dateReceived).toISOString().split('T')[0] : ""} onChange={e => setFormData({...formData, dateReceived: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{t("cow.sourcedFamily")}</label>
                <select 
                  value={formData.familyId || ""} 
                  onChange={e => setFormData({...formData, familyId: e.target.value || null})} 
                  className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-medium"
                >
                  <option value="">{t("cow.noFamily")}</option>
                  {families.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      case "announcements":
        return (
          <div className="space-y-4 text-slate-700">
            <div className="space-y-1 mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Upload Announcement Image</label>
              <input type="file" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Announce Title</label>
              <input required value={formData.title || ""} onChange={e => setFormData({...formData, title: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Detailed Description</label>
              <textarea required rows={4} value={formData.description || ""} onChange={e => setFormData({...formData, description: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <input type="checkbox" checked={formData.published ?? true} onChange={e => setFormData({...formData, published: e.target.checked})} id="published" />
              <label htmlFor="published" className="text-xs font-bold text-slate-500 uppercase">Publish immediately to Student Feed</label>
            </div>
          </div>
        );
      case "shares":
        return (
          <div className="space-y-4 text-slate-700">
             <div className="space-y-1 font-semibold">
                <label className="text-xs font-bold text-slate-500 uppercase">Assignment Recipient (Student or Graduate)</label>
                <select 
                  required 
                  value={formData.userId || ""} 
                  onChange={e => {
                    const selected = users.find(u => u.userId === e.target.value);
                    setFormData({
                      ...formData,
                      userId: e.target.value,
                      userName: selected ? selected.name : ""
                    });
                  }}
                  className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs"
                >
                  <option value="">-- Choose Recipient student/graduate --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.userId}>
                      {u.name} ({u.isGraduated ? "Graduate" : "Student"})
                    </option>
                  ))}
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase font-semibold">Share amount to give (RWF)</label>
                <input required type="number" value={formData.amount || ""} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-4 font-semibold">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Issue Date</label>
                  <input required type="date" value={formData.shareDate ? new Date(formData.shareDate).toISOString().split('T')[0] : ""} onChange={e => {
                    const nextExp = addYears(new Date(e.target.value), 3).toISOString().split('T')[0];
                    setFormData({...formData, shareDate: e.target.value, expiryDate: nextExp});
                  }} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase font-bold">Expiry Date (3 Year Standard)</label>
                  <input required type="date" value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ""} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-mono text-xs" />
                </div>
              </div>
          </div>
        );
      case "support":
        return (
          <div className="space-y-4 text-slate-700">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Beneficiary Name</label>
              <input required value={formData.beneficiaryName || ""} onChange={e => setFormData({...formData, beneficiaryName: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 font-semibold">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Telephone (tel)</label>
                <input value={formData.telephone || ""} onChange={e => setFormData({...formData, telephone: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Address Location</label>
                <input value={formData.address || ""} onChange={e => setFormData({...formData, address: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 font-semibold">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Support Type Given</label>
                <select value={formData.supportType || "Cow"} onChange={e => setFormData({...formData, supportType: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs">
                  <option value="Cow">🥛 Cow Support</option>
                  <option value="Goat">🐐 Goat Support</option>
                  <option value="Food">🍲 Food Package</option>
                  <option value="Money">💵 Money Grant</option>
                  <option value="School materials">🎒 School materials</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Delivery Date</label>
                <input required type="date" value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ""} onChange={e => setFormData({...formData, date: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-mono" />
              </div>
            </div>
          </div>
        );
      case "calves":
        return (
          <div className="space-y-4 text-slate-700">
            <div className="space-y-1 font-semibold">
              <label className="text-xs font-bold text-slate-500 uppercase">Origin Cow (Select Cow Tag)</label>
              <select 
                required
                value={formData.cowId || ""} 
                onChange={e => setFormData({...formData, cowId: e.target.value})} 
                className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs"
              >
                <option value="">-- Choose Originating Cow --</option>
                {cows.map(c => (
                  <option key={c.id} value={c.id}>{c.cowNumber} (Original Family: {c.family?.name || "None"})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 font-semibold">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">From Family</label>
                <select 
                  required
                  value={formData.fromFamilyId || ""} 
                  onChange={e => setFormData({...formData, fromFamilyId: e.target.value})} 
                  className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs"
                >
                  <option value="">-- Choose Origin Family --</option>
                  {families.map(f => (
                    <option key={f.id} value={f.id}>{f.name} (@{f.username})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">New Destination Family</label>
                <select 
                  required
                  value={formData.toFamilyId || ""} 
                  onChange={e => setFormData({...formData, toFamilyId: e.target.value})} 
                  className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs"
                >
                  <option value="">-- Choose New Family --</option>
                  {families.map(f => (
                    <option key={f.id} value={f.id}>{f.name} (@{f.username})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1 font-semibold">
              <label className="text-xs font-bold text-slate-500 uppercase">Transfer Date</label>
              <input 
                required 
                type="date" 
                value={formData.transferDate ? new Date(formData.transferDate).toISOString().split('T')[0] : ""} 
                onChange={e => setFormData({...formData, transferDate: e.target.value})} 
                className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-mono text-xs" 
              />
            </div>
          </div>
        );
      case "expenses":
        return (
          <div className="space-y-4 text-slate-700">
            <div className="grid grid-cols-2 gap-4 font-semibold">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Cow Tag / Number</label>
                <select 
                  required
                  value={formData.cowNumber || ""} 
                  onChange={e => {
                    const val = e.target.value;
                    setFormData({
                      ...formData, 
                      cowNumber: val,
                      manualCowNumber: val === "CUSTOM_TAG" ? "" : undefined
                    });
                  }} 
                  className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs"
                >
                  <option value="">-- Choose Cow tag --</option>
                  {cows.map(c => (
                    <option key={c.id} value={c.cowNumber}>{c.cowNumber}</option>
                  ))}
                  <option value="CUSTOM_TAG">-- Enter tag manually --</option>
                </select>
                {(formData.cowNumber === "CUSTOM_TAG" || !cows.some(c => c.cowNumber === formData.cowNumber)) && formData.cowNumber !== "" && (
                  <input 
                    required 
                    placeholder="Enter cow tag manually, e.g. CO-8291"
                    value={formData.manualCowNumber || formData.cowNumber || ""}
                    onChange={e => setFormData({...formData, manualCowNumber: e.target.value, cowNumber: "CUSTOM_TAG"})}
                    className="form-input w-full mt-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs"
                  />
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Expense Type</label>
                <select 
                  required
                  value={formData.type || "medicines"} 
                  onChange={e => setFormData({...formData, type: e.target.value})} 
                  className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs"
                >
                  <option value="medicines">Medicines</option>
                  <option value="foods">Foods</option>
                  <option value="vet">Vet</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 font-semibold">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Expense Amount (RWF)</label>
                <input 
                  required
                  type="number"
                  placeholder="Expense cost in RWF"
                  value={formData.amount || ""} 
                  onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} 
                  className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-mono text-xs" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase font-semibold">Date Incurred</label>
                <input 
                  required 
                  type="date" 
                  value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ""} 
                  onChange={e => setFormData({...formData, date: e.target.value})} 
                  className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-mono text-xs" 
                />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Name/Title</label>
            <input 
              value={formData.name || formData.title || ""} 
              onChange={e => setFormData({ ...formData, [formData.name !== undefined ? 'name' : 'title']: e.target.value })}
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 dark:text-white"
            />
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {renderFields()}
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" /> : "Save Changes"}
      </button>
    </form>
  );
};
