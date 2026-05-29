import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Heart, Users, Milk, Star, Mail, MapPin, Phone, ArrowRight, Settings, Plus, Trash2, Upload, X, Loader2, Maximize2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { SEO } from "../components/SEO";

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const { user: authUser, role: userRole, loading } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const [stats, setStats] = useState({ students: 0, families: 0, cows: 0 });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "", targetUserId: "" });
  const [admins, setAdmins] = useState<any[]>([]);

  // Image Lighbox State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Hero Slider States
  const [slides, setSlides] = useState<any[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [newSlideData, setNewSlideData] = useState({
    title: "",
    description: "",
    cta: "Learn More",
    link: "/about"
  });

  const defaultBanners = [
    {
      id: "1",
      image: "/umuganda.webp",
      title: "Community Impact",
      description: "Working together to build a sustainable future for our community in Karongi.",
      cta: "Learn More",
      link: "/about"
    },
    {
      id: "2",
      image: "/cow2.webp",
      title: "The Cow Project",
      description: "Providing nutrition and economic stability to families through cow sponsorship and distribution.",
      cta: "Support a Family",
      link: "/login"
    },
    {
      id: "3",
      image: "/gufasha.webp",
      title: "Our Dedicated Staff",
      description: "Meet the passionate individuals working on the front lines to transform lives.",
      cta: "Meet the Team",
      link: "/about"
    },
    {
      id: "4",
      image: "/gufasha2.webp",
      title: "Student Sponsorship",
      description: "Empowering the next generation through education and long-term sponsorship programs.",
      cta: "Sponsor Now",
      link: "/login"
    },
    {
      id: "5",
      image: "/kwibuka.webp",
      title: "Preserving History",
      description: "Honoring our history while building a bright future for all members of our society.",
      cta: "Our History",
      link: "/about"
    },
    {
      id: "6",
      image: "/admin.webp",
      title: "Leadership & Vision",
      description: "Guided by transparency and a commitment to serving those who need it most.",
      cta: "Contact Us",
      link: "/contact"
    },
    {
      id: "7",
      image: "/kuremera.webp",
      title: "Global Partnership",
      description: "Connecting supporters from around the world to local initiatives that matter.",
      cta: "Join Us",
      link: "/signup"
    }
  ];

  const fetchBanners = async () => {
    try {
      const response = await api.get("/api/home-banners");
      if (response.data && response.data.length > 0) {
        setSlides(response.data);
      } else {
        setSlides(defaultBanners);
      }
    } catch {
      setSlides(defaultBanners);
    } finally {
      setBannersLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides]);

  // Fetch stats and admins
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
          // Keep only first 3 published announcements
          const published = annRes.value.data.filter((a: any) => a.published);
          setAnnouncements(published.slice(0, 3));
        }
      } catch (error) {
        console.error("Home data fetch partially failed:", error);
      }
    };
    fetchData();
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

  // Slider image uploads
  const handleAddSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error("Please drag/select a homepage hero image file");
      return;
    }

    setUploadLoading(true);
    try {
      // 1. Upload slide to Cloudinary via Express proxy
      const upData = new FormData();
      upData.append("image", imageFile);
      const uploadRes = await api.post("/api/upload", upData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const imageUrl = uploadRes.data.url;

      // 2. Submit saved layout schema properties
      await api.post("/api/home-banners", {
        image: imageUrl,
        title: newSlideData.title,
        description: newSlideData.description,
        cta: newSlideData.cta,
        link: newSlideData.link
      });

      toast.success("New slideshow banner added successfully!");
      setImageFile(null);
      setNewSlideData({ title: "", description: "", cta: "Learn More", link: "/about" });
      fetchBanners();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to setup homepage slider");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    try {
      await api.delete(`/api/home-banners/${id}`);
      toast.success("Banner slide deleted");
      fetchBanners();
    } catch (err: any) {
      toast.error("Unable to delete slider");
    }
  };

  const isAdmin = authUser && userRole === "admin";
  const activeSlides = slides.length > 0 ? slides : defaultBanners;

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Batotutarigito",
    "url": "https://batotutarigito.vercel.app",
    "logo": "https://batotutarigito.vercel.app/logo.png",
    "description": "Batotutarigito is a Rwanda community support platform helping families through cow donation projects and social support programs.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Rubengera",
      "addressRegion": "Western Province",
      "addressCountry": "Rwanda"
    }
  };

  return (
    <div className="overflow-hidden bg-slate-50 dark:bg-slate-950">
      <SEO 
        title="Batotutarigito Rwanda - Community Support & Cow Donation Program"
        description="Batotutarigito is a Rwanda community support platform located in Rubengera, Karongi District, Western Province, helping families through cow donation projects, calf tracking, and community support services."
        keywords="Batotutarigito, Batotutarigito Rwanda, Community Support Rwanda, Cow Donation Program Rwanda, Karongi Community Support, Rubengera community support, cow donation Rwanda, calves tracking, family support Rwanda, Western Province, NGO Rwanda"
        canonicalUrl="https://batotutarigito.vercel.app"
        schemaData={homeSchema}
      />
      
      {/* Hero Slider */}
      <section className="relative h-[80vh] bg-slate-900 overflow-hidden">
        
        {/* Dynamic slides custom upload settings */}
        {isAdmin && (
          <div className="absolute top-6 right-6 z-30">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-2xl transition-all border border-blue-500/20 text-xs tracking-wider cursor-pointer"
            >
              <Settings size={16} /> ADMINISTRATE BANNER SLIDES
            </button>
          </div>
        )}

        {bannersLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeSlides[currentSlide] && (
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0"
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center cursor-pointer transition-all duration-700 hover:scale-[1.01]"
                  style={{ backgroundImage: `url(${activeSlides[currentSlide].image})` }}
                  onClick={() => setLightboxImage(activeSlides[currentSlide].image)}
                  title="Click to view entire image in full aspect ratio"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/45 to-slate-950/20" />
                </div>
                <div className="absolute inset-0 flex items-center px-6 md:px-24">
                  <div className="max-w-2xl text-white space-y-6 z-10">
                    <motion.h1 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-4xl md:text-6xl font-black leading-tight tracking-tight text-white uppercase"
                    >
                      {activeSlides[currentSlide].title}
                    </motion.h1>
                    <motion.p 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-sm md:text-lg text-slate-200 leading-relaxed font-normal"
                    >
                      {activeSlides[currentSlide].description}
                    </motion.p>
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="flex flex-wrap items-center gap-4 pt-4"
                    >
                      <Link 
                        to={activeSlides[currentSlide].link}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold inline-flex items-center gap-2 group transition-all text-sm uppercase tracking-wider shadow-lg"
                      >
                        {activeSlides[currentSlide].cta}
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <button 
                        onClick={() => setLightboxImage(activeSlides[currentSlide].image)}
                        className="bg-slate-900/60 hover:bg-slate-950/80 text-white px-6 py-4 rounded-2xl font-bold inline-flex items-center gap-2 border border-white/15 transition-all text-sm uppercase tracking-wider cursor-pointer"
                        title="View photo with full height and width details"
                      >
                        <Maximize2 size={16} />
                        View Full Photo
                      </button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Slider Controls */}
        {activeSlides.length > 1 && (
          <div className="absolute bottom-12 right-12 z-20 flex gap-4">
            <button 
              onClick={() => setCurrentSlide(prev => (prev - 1 + activeSlides.length) % activeSlides.length)}
              className="p-3 border border-white/20 rounded-full text-white hover:bg-white/10 transition-colors bg-black/20 backdrop-blur-md cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setCurrentSlide(prev => (prev + 1) % activeSlides.length)}
              className="p-3 border border-white/20 rounded-full text-white hover:bg-white/10 transition-colors bg-black/20 backdrop-blur-md cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
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
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white leading-none">{stat.value}+</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About Section preview */}
      <section className="py-24 bg-slate-100/50 dark:bg-slate-950 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <img 
              src="/kuremera.webp" 
              alt="Our Impact" 
              onClick={() => setLightboxImage("/kuremera.webp")}
              className="rounded-3xl shadow-2xl w-full h-[500px] object-cover border border-slate-200 dark:border-slate-800 cursor-zoom-in transition-all duration-300 hover:scale-[1.01]"
              title="Click to view image in full width and height"
            />
          </div>
          <div className="lg:w-1/2 space-y-6">
            <span className="text-blue-600 font-bold uppercase tracking-widest text-xs bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-full inline-block">{t('mission.label')}</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
              {t('mission.title')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              {t('mission.desc')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl w-fit"><Star size={20} fill="currentColor" /></div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider mt-1">Education First</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Sponsoring student tuition and supplies from preschool up to college.</p>
              </div>
              <div className="space-y-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="bg-green-100 text-green-600 p-2.5 rounded-xl w-fit"><Heart size={20} fill="currentColor" /></div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider mt-1">Sustainability</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Distributing milk cows, medical records logs and passage of calves.</p>
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
              <span className="text-blue-600 font-bold uppercase tracking-widest text-xs bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-full inline-block">Updates</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Latest Announcements</h2>
            </div>
            <Link to="/announcements" className="text-blue-600 font-extrabold hover:text-blue-700 flex items-center gap-1 text-xs uppercase tracking-widest">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {announcements.length > 0 ? announcements.map((ann, i) => {
              const mainImage = ann.images?.[0];
              const hasImage = mainImage && !mainImage.includes("placeholder");
              return (
                <motion.div 
                  key={ann.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-slate-50 dark:bg-slate-950 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-150 dark:border-slate-800 flex flex-col h-full group"
                >
                  <div 
                    className="h-48 overflow-hidden bg-slate-100 cursor-zoom-in relative"
                    onClick={() => {
                      if (hasImage) setLightboxImage(mainImage);
                    }}
                    title={hasImage ? "Click to view full uncropped image" : undefined}
                  >
                    {hasImage ? (
                      <img 
                        src={mainImage} 
                        alt={ann.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Users size={32} />
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(ann.createdAt).toDateString()}</span>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">{ann.title}</h3>
                      <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm line-clamp-3 leading-relaxed">{ann.description}</p>
                    </div>

                    <Link to="/announcements" className="text-xs font-bold text-blue-600 uppercase pt-2 block tracking-wider group-hover:underline">Read full story &rarr;</Link>
                  </div>
                </motion.div>
              );
            }) : (
               [1, 2, 3].map(i => (
                <div key={i} className="bg-slate-50 dark:bg-slate-850 h-80 rounded-3xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm font-semibold">
                  Announcement Placeholder
                </div>
               ))
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-slate-900 text-white px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24">
          <div className="space-y-12">
            <div className="space-y-4">
              <span className="text-blue-400 font-bold uppercase tracking-widest text-xs bg-blue-500/10 px-4 py-1.5 rounded-full inline-block">Online Communication</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-white">Have Questions? Get in Touch</h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                We're here to answer any questions you may have about school sponsorships or how you can participate in Rubengera.
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="bg-blue-600 p-4 rounded-2xl text-white"><Mail size={24} /></div>
                <div>
                  <h4 className="font-extrabold text-white text-sm uppercase tracking-wider">Email Us</h4>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5">cngirababyeyi@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="bg-blue-600 p-4 rounded-2xl text-white"><Phone size={24} /></div>
                <div>
                  <h4 className="font-extrabold text-white text-sm uppercase tracking-wider">Call Us</h4>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5">+250 722 529 202</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="bg-blue-600 p-4 rounded-2xl text-white"><MapPin size={24} /></div>
                <div>
                  <h4 className="font-extrabold text-white text-sm uppercase tracking-wider">Location</h4>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Rwanda, Western Province, Karongi, Rubengera</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-3xl p-8 sm:p-10 space-y-6 shadow-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-2xl font-black">Send us a Message</h3>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 flex flex-col">
                  <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="E.g., Gasana Jean"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium" 
                  />
                </div>
                <div className="space-y-2 flex flex-col">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="E.g., name@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium" 
                  />
                </div>
              </div>
              
              <div className="space-y-2 flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase">Send To (Optional)</label>
                <select 
                  value={formData.targetUserId}
                  onChange={e => setFormData({...formData, targetUserId: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white text-xs font-bold"
                >
                  <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">General Inbox (Admin Team)</option>
                  {admins.filter(a => a.email?.toLowerCase().trim() === "cngirababyeyi@gmail.com").length > 0 ? (
                    admins
                      .filter(a => a.email?.toLowerCase().trim() === "cngirababyeyi@gmail.com")
                      .map(admin => (
                        <option key={admin.id} value={admin.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Staff: {admin.name} ({admin.email})</option>
                      ))
                  ) : (
                    <option value="cngirababyeyi" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Staff: Clement Ngirababyeyi (cngirababyeyi@gmail.com)</option>
                  )}
                </select>
                <p className="text-[10px] text-slate-400 italic font-semibold">Select a name to target a specific coordinator.</p>
              </div>

              <div className="space-y-2 flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase">Message</label>
                <textarea 
                  required
                  rows={4} 
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  placeholder="Tell us what you would like to know..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 font-normal" 
                />
              </div>
              <button 
                disabled={formLoading}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-extrabold"
              >
                {formLoading ? <Loader2 className="animate-spin" /> : "Submit Message"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ADMIN CONTROL MODAL FOR HOMEPAGE BANNER PICTURES */}
      <AnimatePresence>
        {isModalOpen && isAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-800 relative z-10"
            >
              
              <div className="p-6 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Settings className="text-blue-600" size={20} />
                  <span className="font-black text-slate-900 dark:text-white text-lg">Homepage Image Slides Control Panel</span>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-200 dark:bg-slate-700 p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-300">
                
                {/* 1. Existing Sliders list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Slideshow Images</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-900/50">
                    {activeSlides.map((slide, i) => (
                      <div key={slide.id || i} className="flex items-center justify-between gap-4 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <img 
                            src={slide.image} 
                            alt={slide.title} 
                            className="w-12 h-12 rounded-lg object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="font-extrabold text-xs text-slate-900 dark:text-white">{slide.title}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-xs">{slide.description}</p>
                          </div>
                        </div>
                        {slide.id !== "1" && slide.id !== "2" && slide.id !== "5" && (
                          <button 
                            onClick={() => handleDeleteSlide(slide.id)}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-2 rounded-xl transition-colors"
                            title="Delete custom slides"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Upload Add Slider Form */}
                <form onSubmit={handleAddSlide} className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upload New Slideshow Banner</h4>
                  
                  {/* Image input selector */}
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-600 rounded-2xl p-6 text-center transition-colors cursor-pointer relative bg-slate-50/20">
                    <input 
                      required
                      type="file" 
                      accept="image/*"
                      onChange={e => setImageFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="space-y-2 flex flex-col items-center justify-center text-slate-400">
                      <Upload size={32} className="text-slate-400" />
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {imageFile ? `Selected: ${imageFile.name}` : "Select files or Drag and Drop Banner image"}
                      </p>
                      <p className="text-[10px]">Supports PNG, JPG, JPEG, WEBP up to 5MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Slide Headline Title</label>
                      <input 
                        required
                        value={newSlideData.title}
                        onChange={e => setNewSlideData({...newSlideData, title: e.target.value})}
                        placeholder="E.g., EMPOWERING FAMILIES"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Description message</label>
                      <input 
                        required
                        value={newSlideData.description}
                        onChange={e => setNewSlideData({...newSlideData, description: e.target.value})}
                        placeholder="Explain slide's key action/program"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Button CTA text</label>
                      <input 
                        required
                        value={newSlideData.cta}
                        onChange={e => setNewSlideData({...newSlideData, cta: e.target.value})}
                        placeholder="E.g., Sponsor Cow"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Button Target Route</label>
                      <select 
                        value={newSlideData.link}
                        onChange={e => setNewSlideData({...newSlideData, link: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 dark:text-white"
                      >
                        <option value="/">Home Dashboard</option>
                        <option value="/about">About Us Page "/about"</option>
                        <option value="/announcements">Announcements Page "/announcements"</option>
                        <option value="/contact">Contact Page "/contact"</option>
                        <option value="/login">Log-in Portal "/login"</option>
                        <option value="/signup">Register Portal "/signup"</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    disabled={uploadLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg disabled:opacity-50 text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    {uploadLoading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <>
                        <Plus size={16} /> UPLOAD AND SAVE HERO SLIDE
                      </>
                    )}
                  </button>
                </form>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Lightbox Modal for Full Image Exposure with perfect width/height containment */}
      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxImage(null)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md cursor-zoom-out"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-[95vw] sm:max-w-5xl w-auto max-h-[85vh] flex flex-col items-center justify-center z-10 select-none"
            >
              <img
                src={lightboxImage}
                alt="Full preview"
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                referrerPolicy="no-referrer"
              />
              <p className="text-white/60 text-xs mt-4 font-mono tracking-widest uppercase text-center">Click anywhere to return</p>
            </motion.div>
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-6 right-6 z-20 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-md border border-white/10 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
