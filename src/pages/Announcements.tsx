import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Calendar, ChevronRight, ArrowLeft, Image as ImageIcon, X, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../lib/api";

interface Announcement {
  id: string;
  title: string;
  description: string;
  images?: string[];
  createdAt: string;
  published: boolean;
}

export const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await api.get("/api/resources/announcements");
        // Display only published announcements
        const publishedOnes = response.data.filter((a: Announcement) => a.published);
        // Sort by date descending
        publishedOnes.sort((a: Announcement, b: Announcement) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setAnnouncements(publishedOnes);
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const filteredAnnouncements = announcements.filter(ann => 
    ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ann.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Breadcrumb & Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <ChevronRight size={12} />
            <span className="text-slate-900 dark:text-white">Announcements</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                Latest Updates & <span className="text-blue-600 dark:text-blue-500">Announcements</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-sm sm:text-base">
                Stay informed with BatoTutariGito's latest stories, project updates, and community actions directly from Rwanda.
              </p>
            </div>

            {/* Premium Search input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input 
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900 dark:text-white text-sm transition-all shadow-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading announcements feed...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800 space-y-4 max-w-lg mx-auto shadow-sm">
            <div className="bg-slate-100 dark:bg-slate-800 text-slate-400 p-4 rounded-full w-fit mx-auto">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Announcements Found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {searchQuery ? "No matches found for your search query. Try typing something else." : "There are currently no official announcements posted by the administration."}
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest pt-2"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredAnnouncements.map((ann, index) => {
              const mainImage = ann.images?.[0] || "";
              const hasImage = mainImage !== "" && !mainImage.includes("placeholder");

              return (
                <motion.div
                  key={ann.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  onClick={() => setSelectedAnnouncement(ann)}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group cursor-pointer hover:shadow-xl hover:border-blue-100 dark:hover:border-slate-800 transition-all duration-300 flex flex-col h-full"
                >
                  <div className="h-56 relative bg-slate-100 dark:bg-slate-900 overflow-hidden flex-shrink-0">
                    {hasImage ? (
                      <img 
                        src={mainImage} 
                        alt={ann.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 space-y-2">
                        <ImageIcon size={40} />
                        <span className="text-[10px] uppercase font-bold tracking-wider">No Image Provided</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={12} />
                      {new Date(ann.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 transition-colors">
                        {ann.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 leading-relaxed">
                        {ann.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                      <span>READ MORE</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Announcement Detail Drawer/Modal */}
        <AnimatePresence>
          {selectedAnnouncement && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedAnnouncement(null)}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              />

              {/* Modal Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-800"
              >
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedAnnouncement(null)}
                  className="absolute top-4 right-4 z-10 bg-slate-950/60 hover:bg-slate-950 text-white p-2 rounded-full transition-colors backdrop-blur-md shadow-lg"
                >
                  <X size={20} />
                </button>

                {/* Cover Image */}
                <div className="h-64 sm:h-80 bg-slate-100 dark:bg-slate-900 relative flex-shrink-0">
                  {selectedAnnouncement.images?.[0] && !selectedAnnouncement.images[0].includes("placeholder") ? (
                    <img 
                      src={selectedAnnouncement.images[0]} 
                      alt={selectedAnnouncement.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 space-y-2">
                      <ImageIcon size={48} />
                      <span className="text-xs uppercase font-bold tracking-widest">Official Update</span>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-6 bg-slate-950/70 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-white flex items-center gap-2">
                    <Calendar size={14} />
                    {new Date(selectedAnnouncement.createdAt).toDateString()}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                    {selectedAnnouncement.title}
                  </h2>
                  <div className="h-1 w-20 bg-blue-600 rounded-full" />
                  <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line pt-2">
                    {selectedAnnouncement.description}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button 
                    onClick={() => setSelectedAnnouncement(null)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-colors"
                  >
                    Close Reading
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
