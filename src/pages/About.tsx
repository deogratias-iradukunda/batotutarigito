import React from "react";
import { motion } from "motion/react";
import { Award, BookOpen, Heart, Landmark, Users, CheckCircle, Shield, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "../components/SEO";

export const About: React.FC = () => {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "mainEntity": {
      "@type": "NGO",
      "name": "BatoTutariGito",
      "description": "BatoTutariGito NGO works towards community development, student education, and agricultural empowerment in Rwanda."
    }
  };

  const values = [
    { 
      icon: <BookOpen className="text-blue-600 dark:text-blue-400" size={24} />, 
      title: "Educational Empowerment", 
      desc: "Sponsoring children and youth from preschool to university, giving them the tools to thrive." 
    },
    { 
      icon: <Heart className="text-rose-500 dark:text-rose-400" size={24} />, 
      title: "Sustainable Nutrition", 
      desc: "Distributing cows and farming equipment to families, securing reliable nourishment and agricultural fertilizer." 
    },
    { 
      icon: <Shield className="text-emerald-500 dark:text-emerald-400" size={24} />, 
      title: "Strict Transparency", 
      desc: "Logging every cow medicine expense, asset sales, and funding directly on our open blockchain-inspired system." 
    },
    { 
      icon: <Globe className="text-amber-500 dark:text-amber-400" size={24} />, 
      title: "Global Collaboration", 
      desc: "Bridging the gap between sponsors worldwide and active transformation projects in Karongi, Rwanda." 
    }
  ];

  const team = [
    { name: "Joshua Uwizeyimana", role: "System Analyst & Lead Planner" },
    { name: "Deogratias Iradukunda", role: "Software Architect & Manager" },
    { name: "Arcene Irakoze", role: "NGO Operations Developer" },
    { name: "Clement Ngirababyeyi", role: "Lead Coordinator - Rwanda" }
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      <SEO 
        title="About Us - Mission & Core Values"
        description="Learn about BatoTutariGito's background, dedicated staff, mission values, and the real impact of our local development initiatives in Rwanda."
        keywords="BatoTutariGito details, Rwanda NGO, NGO mission, cow distribution rules, sponsore students"
        schemaData={aboutSchema}
      />
      {/* Hero Banner Section */}
      <section className="relative py-24 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('/umuganda.webp')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/40 z-0" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-blue-400 uppercase tracking-widest mx-auto"
          >
            <Landmark size={14} /> Our Mission
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none"
          >
            Who We Are at <span className="text-blue-500">Bato</span>TutariGito
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 15 }}
            transition={{ delay: 0.1 }}
            className="text-slate-300 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed"
          >
            BatoTutariGito is a registered Community Support Organization based in Rubengera, Karongi District, Western Province of Rwanda, dedicated to eradicating rural poverty through cow replication and full-scale student sponsorship.
          </motion.p>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">Core Story</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Nurturing Self-Sufficiency and Community Ownership
          </h2>
          <div className="h-1 w-20 bg-blue-600 rounded-full" />
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            Founded with the persistent vision of transforming families in rural Rwanda, BatoTutariGito addresses structural bottlenecks in education and economics. We don't just hand out support; we construct cyclical projects.
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
            Through <span className="text-blue-600 dark:text-blue-400">The Cow Project</span>, when an family's sponsored cow produces its firstborn calf, that calf is passed on to a neighboring family. This chain reaction replicates wealth, social unity, and organic fertilization across our regions.
          </p>
          <div className="flex flex-col gap-3 pt-4">
            {["Locally operated in Rubengera, Karongi, Western Rwanda.", "Over 120+ active student sponsorships from primary to college level.", "Integrated cow tracking and transparent asset accounting."].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 font-semibold">
                <CheckCircle className="text-blue-600 flex-shrink-0" size={18} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 p-8">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-100 dark:bg-blue-900/10 rounded-full blur-3xl" />
          <img 
            src="/kuremera.webp" 
            alt="Students Studying" 
            className="w-full h-80 object-cover rounded-2xl relative z-10 shadow-md border border-slate-100 dark:border-slate-800"
          />
          <div className="relative z-10 mt-6 grid grid-cols-2 gap-6 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
            <div>
              <p className="text-3xl font-black text-blue-600">100%</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">Direct Field Funding</p>
            </div>
            <div>
              <p className="text-3xl font-black text-emerald-500">Active</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">Verification Records</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid Section */}
      <section className="bg-slate-100/50 dark:bg-slate-900/35 py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">The Foundation</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-950 dark:text-white">Our Core Commitments</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto">
              We operate under a strict code of social values that drive every decision at our center.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl w-fit">{v.icon}</div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-lg">{v.title}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Staff Team */}
      <section className="py-20 px-6 max-w-7xl mx-auto space-y-12 text-center">
        <div className="space-y-3">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">The Visionary Team</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">NGO Coordinators & Developers</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto">
            Meet the team responsible for building, planning, and managing the BatoTutariGito system.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-center">
          {team.map((member, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-500 dark:hover:border-slate-700 transition-colors flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xl font-black">
                {member.name.charAt(0)}
              </div>
              <div className="text-center">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{member.name}</h4>
                <p className="text-xs text-slate-400 uppercase tracking-wider block mt-1 font-semibold">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-600 text-white rounded-3xl max-w-7xl mx-auto mb-20 p-12 overflow-hidden relative flex flex-col md:flex-row justify-between items-center gap-8 mx-6">
        <div className="absolute -right-24 -bottom-24 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="space-y-4 max-w-2xl relative z-10">
          <h3 className="text-3xl font-black">Want to become a local or global sponsor?</h3>
          <p className="text-blue-100 text-sm sm:text-base">
            Reach out via our digital message board or register an official account. Your direct contribution directly empowers Karongi families!
          </p>
        </div>
        <div className="flex gap-4 relative z-10 flex-shrink-0">
          <Link to="/contact" className="bg-white text-blue-600 hover:bg-slate-100 font-bold px-8 py-3.5 rounded-2xl block text-sm transition-all shadow-md">
            Message Us
          </Link>
          <Link to="/signup" className="bg-blue-700 text-white hover:bg-blue-800 font-bold px-8 py-3.5 rounded-2xl block text-sm border border-blue-500/20 transition-all shadow-md">
            Create Account
          </Link>
        </div>
      </section>
    </div>
  );
};
