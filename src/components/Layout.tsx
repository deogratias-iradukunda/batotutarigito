import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, LogOut, LogIn, Menu, X, Heart, Users, Milk, Info, Phone, Moon, Sun, Globe } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Chatbot } from "./Chatbot";
import { WhatsAppButton } from "./WhatsAppButton";
import { LogoWithText } from "./Logo";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <LogoWithText dark />
          <p className="text-sm">
            Empowering communities through sustainable support, education, and animal husbandry projects.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 uppercase text-xs tracking-wider">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-blue-400 transition-colors">Home</Link></li>
            <li><Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
            <li><Link to="/announcements" className="hover:text-blue-400 transition-colors">Announcements</Link></li>
            <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 uppercase text-xs tracking-wider">Contact Info</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Phone size={14} /> +250 722 529 202</li>
            <li className="text-xs break-all">cngirababyeyi@gmail.com</li>
            <li>Rwanda, Western Province, Karongi, Rubengera</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 uppercase text-xs tracking-wider">Credits</h4>
          <div className="text-xs space-y-1">
            <p>Developers: Arcene Irakoze, Deogratias Iradukunda</p>
            <p>System Analyst: Joshua Uwizeyimana</p>
            <p className="pt-4 text-blue-500 font-medium">Powered by BatoTutariGito Management System</p>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 text-center text-xs">
        &copy; {new Date().getFullYear()} BatoTutariGito. All rights reserved.
      </div>
    </footer>
  );
};

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: t('nav.home'), path: "/", icon: <Info size={18} /> },
    { name: t('nav.about'), path: "/about", icon: <Info size={18} /> },
    { name: t('nav.announcements'), path: "/announcements", icon: <Info size={18} /> },
    { name: t('nav.contact'), path: "/contact", icon: <Phone size={18} /> },
  ];

  const isAdmin = role === "admin";

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <LogoWithText />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <Link 
              key={link.path} 
              to={link.path}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.path ? 'text-blue-600' : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4 ml-2">
            {/* Lang Dropdown */}
            <div className="relative group">
              <button 
                className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">
                  {i18n.language}
                </div>
                <Globe size={16} className="text-slate-400" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">Select Language</p>
                </div>
                {[
                  { code: 'en', label: 'English', sub: 'Default' },
                  { code: 'rw', label: 'Kinyarwanda', sub: 'Ururimi rw\'Icyubaka' },
                  { code: 'fr', label: 'Français', sub: 'French' },
                  { code: 'sw', label: 'Kiswahili', sub: 'Swahili' }
                ].map(lang => (
                  <button 
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group/item ${i18n.language === lang.code ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                  >
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold ${i18n.language === lang.code ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}>
                        {lang.label}
                      </span>
                      <span className="text-[10px] text-slate-400">{lang.sub}</span>
                    </div>
                    {i18n.language === lang.code && <div className="w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/30" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              <Link 
                to={isAdmin ? "/admin" : "/dashboard"}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600"
              >
                <LayoutDashboard size={18} />
                {t('nav.dashboard')}
              </Link>
              <button 
                onClick={logout}
                className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                to="/login"
                className="text-slate-600 dark:text-slate-400 px-4 py-2 text-sm font-semibold hover:text-blue-600 transition-colors"
              >
                {t('nav.login')}
              </Link>
              <Link 
                to="/signup"
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <button onClick={toggleTheme}>
             {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map(link => (
                <Link 
                  key={link.path} 
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-medium text-slate-600 dark:text-slate-400"
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                {[
                  { code: 'en', label: 'EN' },
                  { code: 'rw', label: 'RW' },
                  { code: 'fr', label: 'FR' },
                  { code: 'sw', label: 'SW' }
                ].map(lang => (
                  <button 
                    key={lang.code} 
                    onClick={() => changeLanguage(lang.code)} 
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                      i18n.language === lang.code 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              {user ? (
                <>
                  <Link 
                    to={isAdmin ? "/admin" : "/dashboard"}
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-medium text-slate-600 dark:text-slate-400"
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={() => { logout(); setIsOpen(false); }}
                    className="text-sm font-medium text-red-600 text-left"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <Link 
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-medium text-blue-600"
                >
                  {t('nav.login')}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <Chatbot />
      <WhatsAppButton />
    </div>
  );
};
