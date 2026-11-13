"use client";

import React, { useState } from "react";
import { MessageCircle, Send, X, MessageSquareText, Bot } from "lucide-react";
import Link from "next/link";

export default function FloatingBots() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
      {/* Expanded Menu */}
      {isOpen && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* AI Assistant */}
          <Link 
            href="/ai" 
            className="flex items-center gap-3 bg-primary text-slate-950 px-5 py-3 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all group border border-white/20"
          >
            <div className="bg-slate-900/20 p-2 rounded-xl">
              <Bot size={20} className="text-slate-900" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Intelligence</p>
              <p className="text-sm font-bold">AI Assistant</p>
            </div>
          </Link>

          {/* Telegram Bot */}
          <a 
            href="https://t.me/SihuHubBot" 
            target="_blank" 
            className="flex items-center gap-3 bg-[#229ED9] text-white px-5 py-3 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all group"
          >
            <div className="bg-white/20 p-2 rounded-xl">
              <Send size={20} fill="white" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Updates</p>
              <p className="text-sm font-bold">Telegram Bot</p>
            </div>
          </a>

          {/* WhatsApp Bot */}
          <a 
            href="https://wa.me/254722318820" 
            target="_blank" 
            className="flex items-center gap-3 bg-[#25D366] text-white px-5 py-3 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all group"
          >
            <div className="bg-white/20 p-2 rounded-xl">
              <MessageCircle size={20} fill="white" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Chat</p>
              <p className="text-sm font-bold">WhatsApp Hub</p>
            </div>
          </a>
        </div>
      )}

      {/* Main Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all duration-500 group ${
          isOpen ? "bg-slate-900 rotate-90" : "bg-primary hover:scale-110"
        }`}
      >
        {isOpen ? (
          <X className="text-white" size={28} />
        ) : (
          <div className="relative">
            <MessageSquareText className="text-white" size={28} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-primary animate-pulse"></span>
          </div>
        )}
      </button>
    </div>
  );
}
