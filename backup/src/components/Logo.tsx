import React from "react";

export const Logo: React.FC<{ className?: string, size?: "sm" | "md" | "lg" }> = ({ className = "", size = "md" }) => {
  const iconSize = size === "sm" ? 40 : size === "lg" ? 120 : 64;
  
  return (
    <div 
      className={`relative flex items-center justify-center transition-transform duration-300 hover:scale-105 rounded-xl overflow-hidden ${className}`} 
      style={{ width: iconSize, height: iconSize }}
    >
      <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
    </div>
  );
};

export const LogoWithText: React.FC<{ dark?: boolean }> = ({ dark = false }) => {
  return (
    <div className="flex items-center gap-3 group">
      <Logo size="sm" />
      <span className={`text-xl font-bold tracking-tight hidden sm:block ${dark ? 'text-white' : 'text-slate-900 group-hover:text-blue-600 transition-colors'}`}>
        Bato<span className="text-blue-600 group-hover:text-current font-extrabold italic">Tutari</span>Gito
      </span>
    </div>
  );
};
