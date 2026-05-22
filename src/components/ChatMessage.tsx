import React from "react";
import { motion } from "motion/react";
import { Role, Message } from "../types";
import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full mb-6 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? "bg-blue-100 ml-3" : "bg-gray-100 mr-3"}`}>
          {isUser ? <User className="w-5 h-5 text-blue-600" /> : <Bot className="w-5 h-5 text-gray-600" />}
        </div>
        
        <div className={`px-4 py-3 rounded-2xl ${
          isUser 
            ? "bg-blue-600 text-white rounded-tr-none" 
            : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200"
        }`}>
          <div className="text-sm md:text-base whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </div>
          <div className={`text-[10px] mt-1 opacity-50 ${isUser ? "text-right" : "text-left"}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
