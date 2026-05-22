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
    <div className="flex items-center gap-3 group select-none">
      <div className="flex-shrink-0 flex items-center justify-center">
        <Logo size="sm" />
      </div>
      <span className={`text-xl font-bold tracking-tight hidden sm:inline-flex items-center leading-none ${dark ? 'text-white' : 'text-slate-900 group-hover:text-blue-600 transition-colors'}`}>
        Bato<span className="text-blue-600 group-hover:text-slate-200 dark:group-hover:text-blue-500 font-extrabold italic mx-[2px] tracking-tight">Tutari</span>Gito
      </span>
    </div>
  );
};
