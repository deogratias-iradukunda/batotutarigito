import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, X, Bot, User, Loader2, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import { sendMessageStream, GeminiError } from "../services/geminiService";
import { Message, Role } from "../types";

const FAQs = [
  "How do I register as a student?",
  "How do families receive support?",
  "What is the Cow project?",
  "How do I contact the administrator?"
];

const STORAGE_KEY = "batotutarigito-chat-history";

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    }
    return [
      { 
        role: Role.MODEL, 
        content: "Hello! I'm the BatoTutariGito assistant. How can I help you today?",
        timestamp: Date.now()
      }
    ];
  });
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<{ message: string; type: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    setError(null);
    const userMessage: Message = { 
      role: Role.USER, 
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const modelMessage: Message = {
      role: Role.MODEL,
      content: "",
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, modelMessage]);

    try {
      const history = messages.filter(m => m.content !== "");
      const stream = sendMessageStream(history, text);
      let fullContent = "";

      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === Role.MODEL) {
            lastMsg.content = fullContent;
          }
          return newMessages;
        });
      }
    } catch (err: any) {
      console.error("Chat Error:", err);
      const isGeminiError = err instanceof GeminiError;
      const errorMessage = isGeminiError ? err.message : "Error connecting to support helper. Please try again.";
      
      setError({ 
        message: errorMessage, 
        type: isGeminiError ? err.type : 'UNKNOWN' 
      });

      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.content === "") {
          return newMessages.slice(0, -1);
        }
        return newMessages;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const startNewChat = () => {
    const defaultMessages = [
      { 
        role: Role.MODEL, 
        content: "Hello! I'm the BatoTutariGito assistant. How can I help you today?",
        timestamp: Date.now()
      }
    ];
    setMessages(defaultMessages);
    localStorage.removeItem(STORAGE_KEY);
    setError(null);
  };

  const retryLastMessage = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === Role.USER);
    if (lastUserMessage) {
      setMessages(prev => {
        let lastIndex = prev.length - 1;
        while (lastIndex >= 0 && prev[lastIndex].role !== Role.USER) {
          lastIndex--;
        }
        return prev.slice(0, lastIndex);
      });
      handleSend(lastUserMessage.content);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="mb-4 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-150 dark:border-slate-800 flex flex-col h-[525px]"
            id="chatbot-container"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4.5 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full pointer-events-none -mr-8 -mt-8" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center relative">
                  <Bot size={20} className="text-white" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-blue-600" />
                </div>
                <div>
                  <span className="font-bold text-sm block leading-tight">Virtual Guide</span>
                  <span className="text-[10px] text-blue-100 font-medium flex items-center gap-1">
                    Online & Ready
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 relative z-10">
                <button 
                  onClick={startNewChat} 
                  title="Clear Chat History"
                  className="hover:bg-white/10 p-2 rounded-xl transition-colors text-white/90 hover:text-white"
                  id="chatbot-clear-btn"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="hover:bg-white/10 p-2 rounded-xl transition-colors text-white/90 hover:text-white"
                  id="chatbot-close-btn"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 p-4.5 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-950 custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[85%] ${msg.role === Role.USER ? 'flex-row-reverse' : 'flex-row'} gap-2.5`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      msg.role === Role.USER ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-slate-200 dark:bg-slate-800'
                    }`}>
                      {msg.role === Role.USER ? (
                        <User size={14} className="text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Bot size={14} className="text-slate-600 dark:text-slate-400" />
                      )}
                    </div>
                    <div className={`p-3 px-4 rounded-2xl text-sm ${
                      msg.role === Role.USER 
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-sm' 
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-none shadow-sm'
                    }`}>
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      <div className={`text-[9px] mt-1 opacity-50 ${msg.role === Role.USER ? 'text-right text-blue-100' : 'text-left text-slate-400 font-mono'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-xs font-semibold">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    {error.message}
                  </div>
                  <button 
                    onClick={retryLastMessage}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 dark:text-red-400 hover:text-red-700 transition-colors uppercase tracking-wider"
                  >
                    <RefreshCw size={10} /> Retry Message
                  </button>
                </div>
              )}

              {isTyping && messages[messages.length - 1]?.content === "" && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-900 p-3 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 rounded-tl-none shadow-sm flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 font-mono">Suggestions</p>
                <div className="flex flex-wrap gap-1.5">
                  {FAQs.map(faq => (
                    <button 
                      key={faq}
                      onClick={() => handleSend(faq)}
                      className="text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 px-3 py-1.5 rounded-full text-slate-700 dark:text-slate-300 hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 dark:hover:border-blue-500 transition-all active:scale-95 text-left font-medium"
                    >
                      {faq}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isTyping}
                className="flex-1 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all disabled:opacity-50"
              />
              <button 
                type="submit" 
                disabled={isTyping || !input.trim()}
                className="bg-blue-600 text-white p-2.5 rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 transition-all flex items-center justify-center active:scale-95 shadow-md hover:shadow-lg"
                id="chatbot-submit-btn"
              >
                {isTyping ? <Loader2 className="animate-spin" size={20} /> : <Send size={18} />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white p-4.5 rounded-full shadow-2xl flex items-center justify-center group relative overflow-hidden"
        id="chatbot-toggle-button"
        aria-label="Open Virtual Guide"
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>
    </div>
  );
};
