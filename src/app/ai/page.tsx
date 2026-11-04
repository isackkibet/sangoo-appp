"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import NewsHeader from "@/components/portal/NewsHeader";
import {
  Bot, Send, Mic, MicOff, Paperclip, X, Volume2, VolumeX, Square, BookOpen, Activity, Gift, Newspaper,
  Search, Waves, Gavel, Plus, PanelLeft, Sparkles, User,
} from "lucide-react";
import type { LucideIcon } from "@/types/icon";

// Mobile detection hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: File[];
  speechText?: string;
  isStory?: boolean;
}

interface ProviderStatus {
  configured: Record<string, boolean>;
  models: Record<string, string>;
  activeProvider: string;
}

interface Tool {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}


/** Renders a reply as text with **bold** parts; never as raw HTML. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        /^\*\*[^*]+\*\*$/.test(part) ? <strong key={i}>{part.slice(2, -2)}</strong> : <React.Fragment key={i}>{part}</React.Fragment>
      )}
    </>
  );
}

const TOOL_ICON: Record<string, LucideIcon> = { search: Search, auto_stories: BookOpen, water: Waves, gavel: Gavel };

const SUGGESTIONS: { Icon: LucideIcon; title: string; prompt: string }[] = [
  { Icon: BookOpen, title: "Tell me a Sango story", prompt: "Tell me a story about Sango and the Lake Victoria Basin" },
  { Icon: Activity, title: "How healthy is the basin?", prompt: "What is basin health mining and how is the lake doing?" },
  { Icon: Gift, title: "How do I earn rewards?", prompt: "How can I earn SIHU rewards for stewardship work?" },
  { Icon: Newspaper, title: "Latest news", prompt: "What are the latest news and updates from SIHU?" },
];

export default function AgentSihuPage() {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mobile detection
  const isMobile = useIsMobile();

  // Haptic feedback for mobile
  const hapticFeedback = useCallback(() => {
    if (isMobile && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [isMobile]);

  // Speech synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [tools, setTools] = useState<Tool[]>([
    { id: "search", name: "Knowledge Search", icon: "search", enabled: true },
    { id: "stories", name: "Story Mode", icon: "auto_stories", enabled: true },
    { id: "mining", name: "Basin Mining", icon: "water", enabled: false },
    { id: "governance", name: "Governance", icon: "gavel", enabled: false },
  ]);

  // Scroll only the conversation, never the whole page.
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    const el = chatScrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadProviderStatus = async () => {
      try {
        const response = await fetch("/api/keys");
        if (!response.ok) return;
        const data = (await response.json()) as ProviderStatus;
        setProviderStatus(data);
      } catch (error) {
        console.error("Failed to load AI provider status:", error);
      }
    };

    loadProviderStatus();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const existing = window.localStorage.getItem("sihu_agent_session_id");
    if (existing) {
      setSessionId(existing);
      return;
    }

    const generated = `sihu-${crypto.randomUUID()}`;
    window.localStorage.setItem("sihu_agent_session_id", generated);
    setSessionId(generated);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mobile keyboard visibility detection
  useEffect(() => {
    if (!isMobile || typeof window === "undefined") return;

    const handleResize = () => {
      // Detect keyboard by comparing window height
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const keyboardOpen = viewportHeight < windowHeight * 0.8;
      setKeyboardVisible(keyboardOpen);
    };

    window.visualViewport?.addEventListener("resize", handleResize);
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobile]);

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const startRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Speech Synthesis Setup and Functions
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    synthesisRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const voices = synthesisRef.current?.getVoices() || [];
      setAvailableVoices(voices);

      // Prefer a good English voice
      const preferredVoice = voices.find(
        (v) =>
          v.name.includes("Google US English") ||
          v.name.includes("Samantha") ||
          v.name.includes("Karen") ||
          (v.lang === "en-US" && v.default)
      );

      if (preferredVoice) {
        setSelectedVoice(preferredVoice);
      } else if (voices.length > 0) {
        setSelectedVoice(voices[0]);
      }
    };

    loadVoices();

    // Voices load asynchronously
    if (synthesisRef.current) {
      synthesisRef.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  const speakMessage = (text: string, messageId: string) => {
    if (!synthesisRef.current || !text) return;

    // Stop any current speech
    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = 0.9; // Slightly slower for storytelling
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMessageId(messageId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };

    synthesisRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  };

  const toggleAutoSpeak = () => {
    setAutoSpeak((prev) => !prev);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;
    const messageText = inputValue.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setAttachments([]);
    setIsTyping(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          sessionId,
          history: messages.slice(-6).map((item) => ({
            role: item.role,
            content: item.content,
          })),
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        provider?: string;
        model?: string;
        mode?: string;
        error?: string;
        speechText?: string;
        isStory?: boolean;
      };

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          data.reply ||
          data.error ||
          "I could not generate a response right now.",
        timestamp: new Date(),
        speechText: data.speechText,
        isStory: data.isStory,
      };

      setMessages((prev) => [...prev, aiResponse]);

      // Auto-speak if enabled and this is a story
      if (autoSpeak && data.speechText && data.isStory) {
        setTimeout(() => {
          speakMessage(data.speechText!, aiResponse.id);
        }, 500);
      }
    } catch (error) {
      console.error("AI chat failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "I could not reach the AI service right now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleTool = (toolId: string) => {
    setTools((prev) =>
      prev.map((tool) =>
        tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool
      )
    );
  };

  const pickPrompt = (prompt: string) => {
    hapticFeedback();
    setInputValue(prompt);
    textareaRef.current?.focus();
  };

  const newChat = () => {
    stopSpeaking();
    setMessages([]);
    setInputValue("");
    setAttachments([]);
    setSidebarOpen(false);
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      <button onClick={newChat} className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-slate-900 hover:bg-sky-600 text-white text-[14.5px] font-semibold transition-colors">
        <Plus size={17} /> New chat
      </button>

      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-slate-500 mt-7 mb-2">Try asking</p>
      <div className="space-y-1">
        {SUGGESTIONS.map((s) => (
          <button key={s.title} onClick={() => { pickPrompt(s.prompt); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[14px] text-slate-700 hover:bg-slate-100 transition-colors">
            <s.Icon size={17} className="text-sky-600 shrink-0" /> {s.title}
          </button>
        ))}
      </div>

      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-slate-500 mt-7 mb-2">Tools</p>
      <div className="space-y-1">
        {tools.map((tool) => {
          const Icon = TOOL_ICON[tool.icon] ?? Sparkles;
          return (
            <button key={tool.id} onClick={() => toggleTool(tool.id)} role="switch" aria-checked={tool.enabled}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[14px] text-slate-700 hover:bg-slate-100 transition-colors">
              <Icon size={17} className={tool.enabled ? "text-sky-600" : "text-slate-400"} />
              <span className="flex-1">{tool.name}</span>
              <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${tool.enabled ? "bg-sky-500" : "bg-slate-200"}`}>
                <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${tool.enabled ? "translate-x-4" : ""}`} />
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-slate-500 mt-7 mb-2">Voice</p>
      <button onClick={toggleAutoSpeak} role="switch" aria-checked={autoSpeak}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[14px] text-slate-700 hover:bg-slate-100 transition-colors">
        {autoSpeak ? <Volume2 size={17} className="text-sky-600" /> : <VolumeX size={17} className="text-slate-400" />}
        <span className="flex-1">Read stories aloud</span>
        <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${autoSpeak ? "bg-sky-500" : "bg-slate-200"}`}>
          <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${autoSpeak ? "translate-x-4" : ""}`} />
        </span>
      </button>
      {availableVoices.length > 0 && (
        <select
          value={selectedVoice?.name ?? ""}
          onChange={(e) => setSelectedVoice(availableVoices.find((v) => v.name === e.target.value) ?? null)}
          className="mt-2 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-[13.5px] text-slate-700 focus:outline-none focus:border-sky-500"
          aria-label="Voice"
        >
          {availableVoices.filter((v) => v.lang.startsWith("en")).slice(0, 30).map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
        </select>
      )}

      {providerStatus && (
        <p className="mt-auto pt-6 text-[12px] text-slate-400 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${providerStatus.configured[providerStatus.activeProvider] ? "bg-emerald-500" : "bg-amber-500"}`} />
          {providerStatus.configured[providerStatus.activeProvider] ? "AI connected" : "AI running in offline mode"}
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-[#f6f8fb] text-slate-900">
      <NewsHeader />
      {/* The chat fills the screen under the header, like a messaging app (no site footer here). */}
      <style>{`.site-footer{display:none}`}</style>
      <div className="fixed inset-x-0 bottom-0 top-[72px] z-40 flex bg-[#f6f8fb]">
        {/* Sidebar: desktop */}
        <aside className="hidden lg:flex w-[290px] shrink-0 flex-col bg-white border-r border-slate-200 p-5 overflow-y-auto">{sidebar}</aside>

        {/* Sidebar: phone drawer */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-[60] bg-slate-900/40" onClick={() => setSidebarOpen(false)}>
            <aside className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-white p-5 pt-6 overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <p className="font-heading font-bold text-[18px]">Agent SIHU</p>
                <button onClick={() => setSidebarOpen(false)} aria-label="Close" className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center"><X size={19} /></button>
              </div>
              {sidebar}
            </aside>
          </div>
        )}

        {/* Chat */}
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center gap-3 px-4 md:px-6 h-14 border-b border-slate-200 bg-white/80 backdrop-blur shrink-0">
            <button onClick={() => setSidebarOpen(true)} aria-label="Open menu" className="lg:hidden w-10 h-10 -ml-2 rounded-full hover:bg-slate-100 flex items-center justify-center"><PanelLeft size={19} /></button>
            <span className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center"><Bot size={17} /></span>
            <div className="min-w-0">
              <p className="font-bold text-[15px] leading-tight">Agent SIHU</p>
              <p className="text-[12px] text-slate-500 leading-tight">Storyteller for the Lake Victoria Basin</p>
            </div>
            {messages.length > 0 && (
              <button onClick={newChat} className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-semibold text-slate-600 hover:bg-slate-100"><Plus size={15} /> New chat</button>
            )}
          </div>

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">
              {messages.length === 0 && (
                <div className="text-center pt-6 md:pt-14">
                  <span className="mx-auto w-16 h-16 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/25"><Bot size={30} /></span>
                  <h1 className="font-heading text-[30px] md:text-[38px] font-bold mt-6 leading-tight">How can I help you today?</h1>
                  <p className="text-[16px] text-slate-600 mt-3 max-w-lg mx-auto leading-relaxed">
                    I am Agent SIHU, the storyteller for the Lake Victoria Basin. Ask me about Sango, the health of the lake, rewards or the latest news.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 mt-9 text-left">
                    {SUGGESTIONS.map((s) => (
                      <button key={s.title} onClick={() => pickPrompt(s.prompt)}
                        className="group flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200 text-left hover:border-sky-300 hover:shadow-[0_12px_28px_-16px_rgba(2,132,199,0.5)] transition-all">
                        <span className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors"><s.Icon size={19} /></span>
                        <span>
                          <span className="block font-semibold text-[15px]">{s.title}</span>
                          <span className="block text-[13px] text-slate-500 mt-0.5 line-clamp-2">{s.prompt}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => {
                const mine = message.role === "user";
                const speaking = isSpeaking && speakingMessageId === message.id;
                return (
                  <div key={message.id} className={`flex items-start gap-3 ${mine ? "justify-end" : ""}`}>
                    {!mine && <span className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 mt-1"><Bot size={16} /></span>}
                    <div className={`flex flex-col gap-1.5 max-w-[85%] md:max-w-[78%] ${mine ? "items-end" : "items-start"}`}>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {message.attachments.map((file, index) => (
                            <span key={index} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[12.5px] text-slate-600"><Paperclip size={13} /> {file.name}</span>
                          ))}
                        </div>
                      )}
                      <div className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${mine ? "bg-slate-900 text-white rounded-tr-md" : "bg-white text-slate-800 border border-slate-200 rounded-tl-md"}`}>
                        <RichText text={message.content} />
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-slate-400">
                        {!mine && message.speechText && (
                          <button onClick={() => (speaking ? stopSpeaking() : speakMessage(message.speechText!, message.id))}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold transition-colors ${speaking ? "bg-sky-100 text-sky-700" : "text-slate-500 hover:bg-slate-100"}`}>
                            {speaking ? <><Square size={12} /> Stop</> : <><Volume2 size={13} /> Listen</>}
                          </button>
                        )}
                        {!mine && message.isStory && <span className="inline-flex items-center gap-1 text-sky-700 font-semibold"><BookOpen size={12} /> Story</span>}
                        <span>{mounted ? message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "\u00A0"}</span>
                      </div>
                    </div>
                    {mine && <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-1"><User size={16} /></span>}
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0"><Bot size={16} /></span>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3.5 flex items-center gap-1.5" aria-label="Agent SIHU is typing">
                    {[0, 1, 2].map((d) => <span key={d} className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />)}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Composer */}
          <div className="shrink-0 border-t border-slate-200 bg-white px-3 md:px-6 pt-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}>
            <div className="max-w-3xl mx-auto">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {attachments.map((file, index) => (
                    <span key={index} className="inline-flex items-center gap-1.5 bg-slate-100 rounded-lg pl-3 pr-1 py-1 text-[12.5px] text-slate-700">
                      <Paperclip size={13} /> {file.name}
                      <button onClick={() => removeAttachment(index)} aria-label={`Remove ${file.name}`} className="w-6 h-6 rounded-md hover:bg-slate-200 flex items-center justify-center"><X size={13} /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2 rounded-3xl border border-slate-300 bg-white px-2 py-2 focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-500/15 transition-shadow">
                <button onClick={() => fileInputRef.current?.click()} aria-label="Attach a file" className="w-10 h-10 shrink-0 rounded-full text-slate-500 hover:bg-slate-100 flex items-center justify-center"><Paperclip size={19} /></button>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
                  }}
                  rows={1}
                  placeholder="Message Agent SIHU"
                  className="flex-1 min-w-0 resize-none bg-transparent py-2.5 px-1 text-[15px] leading-relaxed placeholder:text-slate-400 focus:outline-none max-h-40"
                  style={{ height: "auto" }}
                  onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = `${Math.min(t.scrollHeight, 160)}px`; }}
                />
                <button onClick={() => (isRecording ? stopRecording() : startRecording())} aria-label={isRecording ? "Stop voice input" : "Speak your question"}
                  className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-colors ${isRecording ? "bg-rose-600 text-white animate-pulse" : "text-slate-500 hover:bg-slate-100"}`}>
                  {isRecording ? <MicOff size={19} /> : <Mic size={19} />}
                </button>
                <button onClick={() => { hapticFeedback(); void sendMessage(); }} disabled={!inputValue.trim() && attachments.length === 0}
                  aria-label="Send message" className="w-10 h-10 shrink-0 rounded-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center transition-colors">
                  <Send size={17} />
                </button>
              </div>
              <p className={`text-center text-[12px] text-slate-400 mt-2 ${keyboardVisible ? "hidden" : ""}`}>
                Agent SIHU can make mistakes. Check important facts in the <Link href="/portal" className="underline hover:text-slate-600">news</Link>.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
