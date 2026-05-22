import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Heart, Users, Milk, Star, Mail, MapPin, Phone, ArrowRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const { user: authUser, role: userRole, loading } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  // Redirect logged-in users to their respective dashboards
  useEffect(() => {
    if (authUser && !loading) {
      if (userRole === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [authUser, userRole, loading, navigate]);
  const [stats, setStats] = useState({ students: 0, families: 0, cows: 0 });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "", targetUserId: "" });
  const [admins, setAdmins] = useState<any[]>([]);

  // Fetch admins to allow directed messages
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await api.get("/api/resources/admins");
        setAdmins(response.data);
      } catch (error) {
        console.error("Failed to fetch admins:", error);
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
      toast.success("Message sent successfully!");
      setFormData({ name: "", email: "", message: "", targetUserId: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send message");
    } finally {
      setFormLoading(false);
    }
  };

  const HeroSlides = [
    {
      image: "/umuganda.png",
      title: "Community Impact",
      description: "Working together to build a sustainable future for our community in Karongi.",
      cta: "Learn More",
      link: "/about"
    },
    {
      image: "/cow.png",
      title: "The Cow Project",
      description: "Providing nutrition and economic stability to families through cow sponsorship and distribution.",
      cta: "Support a Family",
      link: "/login"
    },
    {
      image: "/staff.png",
      title: "Our Dedicated Staff",
      description: "Meet the passionate individuals working on the front lines to transform lives.",
      cta: "Meet the Team",
      link: "/about"
    },
    {
      image: "/support.png",
      title: "Student Sponsorship",
      description: "Empowering the next generation through education and long-term sponsorship programs.",
      cta: "Sponsor Now",
      link: "/login"
    },
    {
      image: "/kwibuka.png",
      title: "Preserving History",
      description: "Honoring our history while building a bright future for all members of our society.",
      cta: "Our History",
      link: "/about"
    },
    {
      image: "/admin.jpg",
      title: "Leadership & Vision",
      description: "Guided by transparency and a commitment to serving those who need it most.",
      cta: "Contact Us",
      link: "/#contact"
    },
    {
      image: "/members.png",
      title: "Global Partnership",
      description: "Connecting supporters from around the world to local initiatives that matter.",
      cta: "Join Us",
      link: "/signup"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % HeroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, familiesRes, cowsRes, annRes] = await Promise.allSettled([
          api.get("/api/resources/students"),
          api.get("/api/resources/families"),
          api.get("/api/resources/cows"),
          api.get("/api/resources/announcements")
        ]);

        const getCount = (res: PromiseSettledResult<any>, fallback: number) => 
          res.status === 'fulfilled' ? res.value.data.length : fallback;

        setStats({
          students: getCount(studentsRes, 124),
          families: getCount(familiesRes, 45),
          cows: getCount(cowsRes, 32)
        });

        if (annRes.status === 'fulfilled') {
          setAnnouncements(annRes.value.data.slice(0, 3));
        }
      } catch (error) {
        console.error("Home data fetch partially failed:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero Slider */}
      <section className="relative h-[80vh] bg-slate-900 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${HeroSlides[currentSlide].image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent" />
            </div>
            <div className="absolute inset-0 flex items-center px-6 md:px-24">
              <div className="max-w-2xl text-white space-y-6">
                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-5xl md:text-7xl font-bold leading-tight"
                >
                  {HeroSlides[currentSlide].title}
                </motion.h1>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg md:text-xl text-slate-200"
                >
                  {HeroSlides[currentSlide].description}
                </motion.p>
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="pt-4"
                >
                  <Link 
                    to={HeroSlides[currentSlide].link}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold inline-flex items-center gap-2 group transition-all"
                  >
                    {HeroSlides[currentSlide].cta}
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slider Controls */}
        <div className="absolute bottom-12 left-24 flex gap-4">
          <button 
            onClick={() => setCurrentSlide(prev => (prev - 1 + HeroSlides.length) % HeroSlides.length)}
            className="p-2 border border-white/20 rounded-full text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft />
          </button>
          <button 
            onClick={() => setCurrentSlide(prev => (prev + 1) % HeroSlides.length)}
            className="p-2 border border-white/20 rounded-full text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight />
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-white dark:bg-slate-900 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { icon: <Users size={40} />, label: t('stats.students'), value: stats.students, color: "text-blue-600" },
            { icon: <Heart size={40} />, label: t('stats.families'), value: stats.families, color: "text-red-500" },
            { icon: <Milk size={40} />, label: t('stats.cows'), value: stats.cows, color: "text-green-600" }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center space-y-4"
            >
              <div className={`${stat.color} flex justify-center`}>{stat.icon}</div>
              <h3 className="text-4xl font-bold text-slate-900 dark:text-white">{stat.value}+</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2">
            <img 
              src="/kuremera.png" 
              alt="Our Impact" 
              className="rounded-3xl shadow-2xl w-full h-[500px] object-cover"
            />
          </div>
          <div className="md:w-1/2 space-y-6">
            <span className="text-blue-600 font-bold uppercase tracking-widest text-sm">{t('mission.label')}</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
              {t('mission.title')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
              {t('mission.desc')}
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg w-fit"><Star size={20} fill="currentColor" /></div>
                <h4 className="font-bold">Education First</h4>
                <p className="text-sm text-slate-500">Sponsoring students from nursery to university level.</p>
              </div>
              <div className="space-y-2">
                <div className="bg-green-100 text-green-600 p-2 rounded-lg w-fit"><Heart size={20} fill="currentColor" /></div>
                <h4 className="font-bold">Sustainability</h4>
                <p className="text-sm text-slate-500">Providing cows for income, nutrition, and organic fertilizer.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements */}
      <section id="announcements" className="py-24 bg-white dark:bg-slate-900 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex justify-between items-end">
            <div className="space-y-4">
              <span className="text-blue-600 font-bold uppercase tracking-widest text-sm">Updates</span>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white">Latest Announcements</h2>
            </div>
            <Link to="/announcements" className="text-blue-600 font-semibold hover:underline flex items-center gap-2">
              View All <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {announcements.length > 0 ? announcements.map((ann, i) => (
              <motion.div 
                key={ann.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="premium-card overflow-hidden group"
              >
                <div className="h-48 overflow-hidden">
                  <img 
                    src={ann.images?.[0] || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop"} 
                    alt={ann.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <span className="text-xs text-slate-500">{new Date(ann.createdAt).toDateString()}</span>
                  <h3 className="text-xl font-bold text-slate-900 leading-snug">{ann.title}</h3>
                  <p className="text-slate-600 text-sm line-clamp-2">{ann.description}</p>
                </div>
              </motion.div>
            )) : (
               [1, 2, 3].map(i => (
                <div key={i} className="premium-card h-80 bg-slate-100 flex items-center justify-center text-slate-400">
                  Announcement Placeholder
                </div>
               ))
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-slate-900 text-white px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-24">
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold">Have Questions? Get in Touch</h2>
              <p className="text-slate-400 text-lg">
                We're here to answer any questions you may have about our programs or how you can participate.
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="bg-blue-600 p-4 rounded-2xl"><Mail size={24} /></div>
                <div>
                  <h4 className="font-bold">Email Us</h4>
                  <p className="text-slate-400">cngirababyeyi@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="bg-blue-600 p-4 rounded-2xl"><Phone size={24} /></div>
                <div>
                  <h4 className="font-bold">Call Us</h4>
                  <p className="text-slate-400">+250 722 529 202</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="bg-blue-600 p-4 rounded-2xl"><MapPin size={24} /></div>
                <div>
                  <h4 className="font-bold">Location</h4>
                  <p className="text-slate-400">Rwanda, Western Province, Karongi, Rubengera</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 text-slate-900 space-y-6 shadow-2xl">
            <h3 className="text-2xl font-bold">Send us a Message</h3>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Full Name</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email Address</label>
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Send To (Optional)</label>
                <select 
                  value={formData.targetUserId}
                  onChange={e => setFormData({...formData, targetUserId: e.target.value})}
                  className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">General (Admin Team)</option>
                  {admins.map(admin => (
                    <option key={admin.id} value={admin.id}>Staff: {admin.email}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 italic">Select a name to send a private message.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Message</label>
                <textarea 
                  required
                  rows={4} 
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600" 
                />
              </div>
              <button 
                disabled={formLoading}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {formLoading ? <Loader2 className="animate-spin" /> : "Submit Message"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};
