import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import { Share, Student, Cow, Family, Announcement, Comment, SupportRecord } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Milk, Heart, TrendingUp, Plus, Search, Filter, Edit, Trash2, 
  Calendar, MapPin, GraduationCap, Upload, Download, Eye,
  BarChart3, MessageSquare, Megaphone, Loader2, X, CheckCircle2, AlertCircle, Coins,
  Mail, Lock
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { toast } from "sonner";
import { format, addYears } from "date-fns";
import { useAuth } from "../../context/AuthContext";

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
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    students: [] as Student[],
    graduated: [] as Student[],
    families: [] as Family[],
    cows: [] as Cow[],
    announcements: [] as Announcement[],
    comments: [] as Comment[],
    supportRecords: [] as SupportRecord[],
    shares: [] as Share[]
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const unreadCommentsCount = data.comments.filter(c => c.status === "pending").length;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [students, families, cows, announcements, comments, support, shares] = await Promise.all([
        api.get("/api/resources/students"),
        api.get("/api/resources/families"),
        api.get("/api/resources/cows"),
        api.get("/api/resources/announcements"),
        api.get("/api/resources/comments"),
        api.get("/api/resources/support_records"),
        api.get("/api/resources/shares")
      ]);

      setData({
        students: students.data.filter((s: any) => !s.isGraduated),
        graduated: students.data.filter((s: any) => s.isGraduated),
        families: families.data,
        cows: cows.data,
        announcements: announcements.data,
        comments: comments.data,
        supportRecords: support.data,
        shares: shares.data
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

  const handleDelete = async (tab: string, id: string) => {
    if (!window.confirm(`Are you sure you want to delete this?`)) return;
    
    try {
      await api.delete(`/api/resources/${tab === "graduated" ? "students" : tab === "support" ? "support_records" : tab}/${id}`);
      toast.success("Deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete");
    }
  };

  const menuItems = [
    { id: "overview", label: "Overview", icon: <BarChart3 size={20} /> },
    { id: "students", label: "Students", icon: <Users size={20} /> },
    { id: "graduated", label: "Graduates", icon: <GraduationCap size={20} /> },
    { id: "families", label: "Families", icon: <Heart size={20} /> },
    { id: "cows", label: "Cow Project", icon: <Milk size={20} /> },
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white capitalize">{activeTab}</h1>
            <p className="text-slate-500 dark:text-slate-400">Welcome back, Administrator</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search anything..." 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600 w-64 dark:text-white"
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
        {/* ... Other tab components ... */}
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
      </AnimatePresence>
    </div>
  );
};

// --- Simplified Tab Components and Form ---
const Overview = ({ data }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <StatCard title="Students" value={data.students.length} icon={<Users />} color="bg-blue-600" />
    <StatCard title="Graduates" value={data.graduated.length} icon={<GraduationCap />} color="bg-purple-600" />
    <StatCard title="Families" value={data.families.length} icon={<Heart />} color="bg-red-500" />
    <StatCard title="Cows" value={data.cows.length} icon={<Milk />} color="bg-green-600" />
  </div>
);

const StudentManagement = ({ data, onEdit, onDelete }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
    <table className="w-full text-left text-sm">
      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] font-bold">
        <tr>
          <th className="px-6 py-4">Name</th>
          <th className="px-6 py-4">Email</th>
          <th className="px-6 py-4">Dept</th>
          <th className="px-6 py-4">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {data.map((s: any) => (
          <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td className="px-6 py-4 font-bold dark:text-white">{s.name}</td>
            <td className="px-6 py-4 text-slate-500">{s.email}</td>
            <td className="px-6 py-4 dark:text-slate-300">{s.department}</td>
            <td className="px-6 py-4 space-x-2">
              <button onClick={() => onEdit(s)} className="text-blue-600 hover:text-blue-700 font-bold">Edit</button>
              <button onClick={() => onDelete(s.id)} className="text-red-600 hover:text-red-700 font-bold">Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ManagementForm = ({ type, initialData, onClose }: any) => {
  const [formData, setFormData] = useState(initialData || {});
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalData = { ...formData };
      
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
        if (type === "students") {
          const password = generatePassword();
          await api.post("/api/register-student", { ...finalData, password });
          toast.success("Student registered. Credentials: " + finalData.email + " / " + password);
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                <input required value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                <input required type="email" value={formData.email || ""} onChange={e => setFormData({...formData, email: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
      case "cows":
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Cow Tag/Name</label>
                <input required value={formData.tagId || ""} onChange={e => setFormData({...formData, tagId: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Purchase Amount</label>
                <input required type="number" value={formData.purchaseAmount || ""} onChange={e => setFormData({...formData, purchaseAmount: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Date Received</label>
              <input required type="date" value={formData.dateReceived ? new Date(formData.dateReceived).toISOString().split('T')[0] : ""} onChange={e => setFormData({...formData, dateReceived: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
            </div>
          </>
        );
      case "announcements":
        return (
          <>
            <div className="space-y-1 mb-4">
              <label className="text-xs font-bold text-slate-500 uppercase">Announcement Image</label>
              <input type="file" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
              <input required value={formData.title || ""} onChange={e => setFormData({...formData, title: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
              <textarea required rows={4} value={formData.description || ""} onChange={e => setFormData({...formData, description: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={formData.published || false} onChange={e => setFormData({...formData, published: e.target.checked})} id="published" />
              <label htmlFor="published" className="text-xs font-bold text-slate-500 uppercase">Published</label>
            </div>
          </>
        );
      case "shares":
        return (
          <>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Amount (RWF)</label>
                <input required type="number" value={formData.amount || ""} onChange={e => setFormData({...formData, amount: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Share Date</label>
                  <input required type="date" value={formData.shareDate ? new Date(formData.shareDate).toISOString().split('T')[0] : ""} onChange={e => setFormData({...formData, shareDate: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Expiry Date</label>
                  <input required type="date" value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ""} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="form-input w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2" />
                </div>
              </div>
          </>
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
  }

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
