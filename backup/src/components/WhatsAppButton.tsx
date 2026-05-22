import React from "react";
import { motion } from "motion/react";
import { MessageCircle } from "lucide-react";

export const WhatsAppButton: React.FC = () => {
  return (
    <motion.a
      href="https://wa.me/250722529202?text=Hello%20BatoTutariGito"
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-24 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 transition-colors"
    >
      <MessageCircle size={28} />
    </motion.a>
  );
};
