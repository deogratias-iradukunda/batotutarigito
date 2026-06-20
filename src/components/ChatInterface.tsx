import { useState, useRef, useEffect } from "react";
import { Message, Role } from "../types";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { sendMessageStream, GeminiError } from "../services/geminiService";
import { Bot, Sparkles, Trash2, AlertCircle, RefreshCw, PlusCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function ChatInterface() {
  const { user: authUser } = useAuth();
  const storageKey = authUser ? `batotutarigito-chat-history-${authUser.id}` : "batotutarigito-chat-history-guest";

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(storageKey);
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
        content: "Hello! I'm your Virtual Guide. How can I help you today?",
        timestamp: Date.now(),
      },
    ];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; type: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
        return;
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    }
    setMessages([
      {
        role: Role.MODEL,
        content: "Hello! I'm your Virtual Guide. How can I help you today?",
        timestamp: Date.now(),
      },
    ]);
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
    scrollToBottom();
  }, [messages, storageKey]);

  const handleSendMessage = async (content: string) => {
    setError(null);
    const userMessage: Message = {
      role: Role.USER,
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const modelMessage: Message = {
      role: Role.MODEL,
      content: "",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, modelMessage]);

    try {
      const history = messages.filter(m => m.content !== ""); // Exclude empty loading messages
      const stream = sendMessageStream(history, content);
      let fullContent = "";
      
      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === Role.MODEL) {
            lastMsg.content = fullContent;
          }
          return newMessages;
        });
      }
    } catch (err: any) {
      console.error("Failed to get response:", err);
      const isGeminiError = err instanceof GeminiError;
      const errorMessage = isGeminiError ? err.message : "Something went wrong. Please try again.";
      
      setError({ 
        message: errorMessage, 
        type: isGeminiError ? err.type : 'UNKNOWN' 
      });

      setMessages((prev) => {
        const newMessages = [...prev];
        // Remove the empty model message if it failed immediately
        if (newMessages[newMessages.length - 1]?.content === "") {
          return newMessages.slice(0, -1);
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const retryLastMessage = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === Role.USER);
    if (lastUserMessage) {
      // Remove the last message(s) that might be user/bot pairs that failed
      setMessages(prev => {
        let lastIndex = prev.length - 1;
        while (lastIndex >= 0 && prev[lastIndex].role !== Role.USER) {
          lastIndex--;
        }
        return prev.slice(0, lastIndex);
      });
      handleSendMessage(lastUserMessage.content);
    }
  };

  const startNewChat = () => {
    const defaultMessages = [
      {
        role: Role.MODEL,
        content: "Hello! I'm your Virtual Guide. How can I help you today?",
        timestamp: Date.now(),
      },
    ];
    setMessages(defaultMessages);
    localStorage.setItem(storageKey, JSON.stringify(defaultMessages));
    setError(null);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl overflow-hidden p-1 flex items-center justify-center">
            <img src="/logo.png" alt="BatoTutariGito Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Virtual Guide
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Online Assistant
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={startNewChat}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="Start New Chat"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
          
          <button 
            onClick={startNewChat}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear History"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-8 custom-scrollbar">
        <div className="flex flex-col">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">{error.message}</p>
                <button 
                  onClick={retryLastMessage}
                  className="mt-2 flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Retry Message
                </button>
              </div>
            </div>
          )}

          {isLoading && messages[messages.length - 1]?.content === "" && (
            <div className="flex items-center gap-2 text-gray-400 p-4">
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce [animation-delay:0.4s]"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 md:p-6 bg-white">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        <p className="mt-3 text-center text-[10px] text-gray-400">
          Our Virtual Guide can answer general questions about the BatoTutariGito community.
        </p>
      </div>
    </div>
  );
}
