"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Article, Podcast, Event } from "@/constants/articles";
import { articleService } from "@/services/articleService";
import { podcastService } from "@/services/podcastService";
import { eventService } from "@/services/eventService";

type TickerItem = { id: string; text: string };
type AIProvider = "groq" | "openai" | "gemini" | "anthropic";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'article' | 'podcast' | 'event' | 'ticker'>('article');

  // ==== AI API GATEWAY ====
  const [activeProvider, setActiveProvider] = useState<AIProvider>("groq");
  const [groqKey, setGroqKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [groqModel, setGroqModel] = useState("llama-3.3-70b-versatile");
  const [openaiModel, setOpenaiModel] = useState("gpt-4.1-mini");
  const [geminiModel, setGeminiModel] = useState("gemini-1.5-flash");
  const [anthropicModel, setAnthropicModel] = useState("claude-3-5-sonnet-latest");
  const [apiSaving, setApiSaving] = useState(false);
  const [savedKeys, setSavedKeys] = useState<{ groq: boolean; openai: boolean; gemini: boolean; anthropic: boolean }>({ groq: false, openai: false, gemini: false, anthropic: false });
  const [maskedKeys, setMaskedKeys] = useState<{ groq: string | null; openai: string | null; gemini: string | null; anthropic: string | null }>({ groq: null, openai: null, gemini: null, anthropic: null });
  
  // States for Article
  const [articleTitle, setArticleTitle] = useState("");
  const [articleCategory, setArticleCategory] = useState("Politics");
  const [articleExcerpt, setArticleExcerpt] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [articleImage, setArticleImage] = useState("");
  const [articleAuthor, setArticleAuthor] = useState("");

  // States for Podcast
  const [podTitle, setPodTitle] = useState("");
  const [podEpisode, setPodEpisode] = useState("");
  const [podDuration, setPodDuration] = useState("");
  const [podImage, setPodImage] = useState("");

  // States for Event
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  // States for Ticker
  const [tickerText, setTickerText] = useState("");

  const [toast, setToast] = useState<{message: string, isError: boolean} | null>(null);
  
  // Lists
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [recentPodcasts, setRecentPodcasts] = useState<Podcast[]>([]);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);

  const loadData = async () => {
    try {
      const [articles, podcasts, events] = await Promise.all([
        articleService.getArticles(),
        podcastService.getPodcasts(),
        eventService.getEvents()
      ]);
      setRecentArticles(articles);
      setRecentPodcasts(podcasts);
      setRecentEvents(events);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setToast({ message: 'Error loading data', isError: true });
    }
  };

  const showToast = (message: string, isError: boolean = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveApiKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    // The server only accepts changes with the SIHU admin key (SIHU_ADMIN_KEY in Vercel).
    let adminKey = '';
    try { adminKey = sessionStorage.getItem('sihu_admin_key') || ''; } catch { /* storage blocked */ }
    if (!adminKey) adminKey = window.prompt('Enter the SIHU admin key to save these settings') || '';
    if (!adminKey) return;
    setApiSaving(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({
          groq: groqKey,
          openai: openaiKey,
          gemini: geminiKey,
          anthropic: anthropicKey,
          activeProvider,
          models: {
            groq: groqModel,
            openai: openaiModel,
            gemini: geminiModel,
            anthropic: anthropicModel,
          },
        }),
      });
      if (res.status === 401) {
        try { sessionStorage.removeItem('sihu_admin_key'); } catch { /* ignore */ }
        showToast('Wrong admin key', true);
        return;
      }
      if (!res.ok) throw new Error('Failed to save keys');
      try { sessionStorage.setItem('sihu_admin_key', adminKey); } catch { /* ignore */ }
      setSavedKeys({
        groq: savedKeys.groq || !!groqKey,
        openai: savedKeys.openai || !!openaiKey,
        gemini: savedKeys.gemini || !!geminiKey,
        anthropic: savedKeys.anthropic || !!anthropicKey
      });
      setGroqKey(""); setOpenaiKey(""); setGeminiKey(""); setAnthropicKey("");
      await loadGatewayConfig();
      showToast("AI gateway settings saved!");
    } catch {
      showToast("Failed to save API keys", true);
    } finally {
      setApiSaving(false);
    }
  };

  const loadGatewayConfig = async () => {
    try {
      const response = await fetch("/api/keys");
      if (!response.ok) return;
      const data = await response.json() as {
        activeProvider: AIProvider;
        models: Record<AIProvider, string>;
        configured: Record<AIProvider, boolean>;
        maskedKeys: { groq: string | null; openai: string | null; gemini: string | null; anthropic: string | null };
      };

      setActiveProvider(data.activeProvider);
      setGroqModel(data.models.groq);
      setOpenaiModel(data.models.openai);
      setGeminiModel(data.models.gemini);
      setAnthropicModel(data.models.anthropic);
      setSavedKeys({
        groq: data.configured.groq,
        openai: data.configured.openai,
        gemini: data.configured.gemini,
        anthropic: data.configured.anthropic,
      });
      setMaskedKeys(data.maskedKeys);
    } catch (error) {
      console.error("Error loading AI gateway config:", error);
    }
  };

  useEffect(() => {
     
    const initializeData = async () => {
      await loadData();
      await loadGatewayConfig();
      const storedTicker = localStorage.getItem("sango_ticker");
      if (storedTicker) setTickerItems(JSON.parse(storedTicker));
    };

    initializeData();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
          setter(reader.result as string);
      };
      reader.readAsDataURL(file);
  };

  const handlePostArticle = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!articleTitle || !articleExcerpt || !articleImage || !articleAuthor) {
          showToast("Please fill all fields", true);
          return;
      }

      const newArticle: Article = {
          id: articleTitle.toLowerCase().replace(/\s+/g, '-'), // Better URL slugs
          title: articleTitle,
          category: articleCategory,
          excerpt: articleExcerpt,
          content: articleContent,
          image: articleImage,
          author: articleAuthor,
          time: "Just now",
          type: 'article'
      };

      try {
        await articleService.addArticle(newArticle);
        setRecentArticles([newArticle, ...recentArticles]);

        // Reset Form
        setArticleTitle(""); setArticleExcerpt(""); setArticleContent(""); setArticleImage(""); setArticleAuthor("");
        showToast("Article published successfully to the portal!");
      } catch (error) {
        console.error('Error posting article:', error);
        showToast("Error publishing article", true);
      }
  };

  const handlePostPodcast = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!podTitle || !podEpisode || !podDuration || !podImage) {
          showToast("Please fill all fields", true);
          return;
      }

      const newPodcast: Podcast = {
          id: Date.now().toString(),
          title: podTitle,
          episode: podEpisode,
          duration: podDuration,
          image: podImage,
          type: 'podcast'
      };

      try {
        await podcastService.addPodcast(newPodcast);
        const updatedPodcasts = [newPodcast, ...recentPodcasts];
        setRecentPodcasts(updatedPodcasts);
        
        // Reset Form
        setPodTitle(""); setPodEpisode(""); setPodDuration(""); setPodImage("");
        showToast("Podcast published successfully to the portal!");
      } catch (error) {
        showToast("Error publishing podcast", true);
      }
  };

  const handlePostEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName || !eventDate || !eventLocation) {
        showToast("Please fill all fields", true);
        return;
    }

    const newEvent: Event = {
        id: Date.now().toString(),
        title: eventName,
        date: eventDate,
        location: eventLocation,
        image: "https://images.unsplash.com/photo-1595844784400-d85c493ecb05?w=400&q=80",
        description: "New event listed via Admin panel.",
        type: 'event'
    };

    const updated = [newEvent, ...recentEvents];
    eventService.saveEvents(updated);
    setRecentEvents(updated);
    setEventName(""); setEventDate(""); setEventLocation("");
    showToast("Event listed successfully!");
  };

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerText) return;

    const newItem = { id: Date.now().toString(), text: tickerText };
    const updated = [...tickerItems, newItem];
    localStorage.setItem("sango_ticker", JSON.stringify(updated));
    setTickerItems(updated);
    setTickerText("");
    showToast("Ticker item added!");
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      await articleService.deleteArticle(id);
      const updatedArticles = await articleService.getArticles();
      setRecentArticles(updatedArticles);
      showToast("Article deleted");
    } catch (error) {
      console.error('Error deleting article:', error);
      showToast("Error deleting article", true);
    }
  }

  const handleDeletePodcast = async (id: string) => {
      await podcastService.deletePodcast(id);
      setRecentPodcasts(await podcastService.getPodcasts());
      showToast("Podcast deleted");
  }

  const handleDeleteEvent = (id: string) => {
      eventService.deleteEvent(id);
      setRecentEvents(eventService.getEvents());
      showToast("Event deleted");
  }

  const handleDeleteTicker = (id: string) => {
    const updated = tickerItems.filter(item => item.id !== id);
    localStorage.setItem("sango_ticker", JSON.stringify(updated));
    setTickerItems(updated);
  };

  const CATEGORIES = ["Politics", "Business", "Agriculture", "Health", "Education", "Environment", "News", "Sports"];

  return (
    <div className="max-w-6xl mx-auto py-8">
        {/* Admin Header with Logo */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
            <Link href="/" className="flex items-center">
                <Image 
                    src="/images/logo-main.png" 
                    alt="Sango Administration" 
                    width={200} 
                    height={54} 
                    className="h-12 w-auto"
                    priority
                />
            </Link>
            <div className="text-center md:text-right">
                <h1 className="text-2xl font-heading font-bold text-slate-900 leading-tight">Post Management Terminal</h1>
                <p className="text-slate-500 text-sm">Welcome back. You are currently managing live portal content.</p>
            </div>
        </div>

        {toast && (
            <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-xl text-white font-medium z-50 animate-fade-in-up ${toast.isError ? 'bg-red-500' : 'bg-emerald-500'}`}>
                {toast.message}
            </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left: Forms */}
            <div className="xl:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex border-b border-slate-200">
                        <button 
                            onClick={() => setActiveTab('article')}
                            className={`flex-1 py-4 font-bold text-sm tracking-wide transition-colors ${activeTab === 'article' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <i className="fas fa-newspaper mr-2"></i> Articles
                        </button>
                        <button 
                            onClick={() => setActiveTab('podcast')}
                            className={`flex-1 py-4 font-bold text-sm tracking-wide transition-colors ${activeTab === 'podcast' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <i className="fas fa-podcast mr-2"></i> Podcasts
                        </button>
                        <button 
                            onClick={() => setActiveTab('event')}
                            className={`flex-1 py-4 font-bold text-sm tracking-wide transition-colors ${activeTab === 'event' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <i className="fas fa-calendar mr-2"></i> Events
                        </button>
                        <button 
                            onClick={() => setActiveTab('ticker')}
                            className={`flex-1 py-4 font-bold text-sm tracking-wide transition-colors ${activeTab === 'ticker' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <i className="fas fa-bolt mr-2"></i> Ticker
                        </button>
                    </div>

                    <div className="p-6 md:p-8">
                        {/* ARTICLE FORM */}
                        {activeTab === 'article' && (
                            <form onSubmit={handlePostArticle} className="space-y-6 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Headline Title</label>
                                    <input type="text" value={articleTitle} onChange={e => setArticleTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-slate-50 outline-none" placeholder="e.g. Action to enhance climate change resilience" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                                        <select value={articleCategory} onChange={e => setArticleCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-slate-50 outline-none">
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Author Name</label>
                                        <input type="text" value={articleAuthor} onChange={e => setArticleAuthor(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-slate-50 outline-none" placeholder="e.g. Sango Info Hub" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Cover Image Upload</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, setArticleImage)} 
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-slate-50 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
                                    />
                                    {articleImage && (
                                        <div className="mt-4 w-32 h-24 relative rounded-xl overflow-hidden shadow-sm border border-slate-200">
                                            <img src={articleImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Short Excerpt (Summary)</label>
                                    <input type="text" value={articleExcerpt} onChange={e => setArticleExcerpt(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-slate-50 outline-none" placeholder="A brief summary for the preview card..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Full Story Content</label>
                                    <textarea 
                                        value={articleContent} 
                                        onChange={e => setArticleContent(e.target.value)}
                                        rows={8} 
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-slate-50 outline-none resize-none" 
                                        placeholder="Write the full story here... This will be read by the AI voice narration."
                                    ></textarea>
                                </div>
                                <div className="pt-2">
                                    <button type="submit" className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-md">
                                        Publish to Portal
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* PODCAST FORM */}
                        {activeTab === 'podcast' && (
                            <form onSubmit={handlePostPodcast} className="space-y-6 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Podcast Show Name</label>
                                    <input type="text" value={podTitle} onChange={e => setPodTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-slate-50 outline-none" placeholder="e.g. Busia Today Podcast" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Episode Title</label>
                                    <input type="text" value={podEpisode} onChange={e => setPodEpisode(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-slate-50 outline-none" placeholder="e.g. Episode 4: Lake Victoria Water Levels" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Duration</label>
                                    <input type="text" value={podDuration} onChange={e => setPodDuration(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-slate-50 outline-none" placeholder="e.g. 45 min" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Cover Artwork Upload</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, setPodImage)} 
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-slate-50 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#38bdf8]/10 file:text-[#38bdf8] hover:file:bg-[#38bdf8]/20" 
                                    />
                                    {podImage && (
                                        <div className="mt-4 w-24 h-24 relative rounded-xl overflow-hidden shadow-sm border border-slate-200">
                                            <img src={podImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                                <div className="pt-2">
                                    <button type="submit" className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-md">
                                        Publish Episode
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* EVENT FORM */}
                        {activeTab === 'event' && (
                            <form onSubmit={handlePostEvent} className="space-y-6 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Event Name</label>
                                    <input type="text" value={eventName} onChange={e => setEventName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-slate-50 outline-none" placeholder="e.g. Sango Climate Summit" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Date & Time</label>
                                    <input type="text" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-slate-50 outline-none" placeholder="e.g. April 15th, 2026 at 10:00 AM" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Location/Venue</label>
                                    <input type="text" value={eventLocation} onChange={e => setEventLocation(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-slate-50 outline-none" placeholder="e.g. Busia Town Hall" />
                                </div>
                                <div className="pt-2">
                                    <button type="submit" className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-md">
                                        List Event
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* TICKER FORM */}
                        {activeTab === 'ticker' && (
                            <form onSubmit={handleAddTicker} className="space-y-6 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Ticker Text</label>
                                    <input type="text" value={tickerText} onChange={e => setTickerText(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-slate-50 outline-none" placeholder="e.g. New flood alerts for River Nzoia..." />
                                </div>
                                <div className="pt-2">
                                    <button type="submit" className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-md">
                                        Add to Live Ticker
                                    </button>
                                </div>

                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Recent Stats & Posts */}
            <div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h3 className="font-heading font-bold text-lg text-slate-900 mb-4">Content Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                            <div className="text-3xl font-bold text-primary mb-1">{recentArticles.length}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Articles</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                            <div className="text-3xl font-bold text-[#38bdf8] mb-1">{recentPodcasts.length}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Podcasts</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center col-span-2">
                            <div className="text-2xl font-bold text-emerald-500 mb-1">{recentEvents.length}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Upcoming Events</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-heading font-bold text-sm text-slate-700 uppercase tracking-wider">
                            {activeTab === 'article' ? 'Recent Articles' : 
                             activeTab === 'podcast' ? 'Recent Podcasts' : 
                             activeTab === 'event' ? 'Upcoming Events' : 'Ticker Items'}
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                        {activeTab === 'article' && recentArticles.map((article) => (
                            <div key={article.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <img src={article.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-semibold text-slate-900 truncate">{article.title}</p>
                                        <p className="text-[10px] text-slate-500 uppercase">{article.category} • {article.time}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteArticle(article.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        ))}
                        {activeTab === 'podcast' && recentPodcasts.map((podcast) => (
                            <div key={podcast.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <img src={podcast.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-semibold text-slate-900 truncate">{podcast.title}</p>
                                        <p className="text-[10px] text-slate-500 uppercase">{podcast.episode}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDeletePodcast(podcast.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        ))}
                        {activeTab === 'event' && recentEvents.map((event) => (
                            <div key={event.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-semibold text-slate-900 truncate">{event.title}</p>
                                        <p className="text-[10px] text-slate-500 uppercase">{event.date} • {event.location}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteEvent(event.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        ))}
                        {activeTab === 'ticker' && tickerItems.map((item) => (
                            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <span className="text-sm text-slate-700 truncate">{item.text}</span>
                                <button onClick={() => handleDeleteTicker(item.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors shrink-0">
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* ===== AI API GATEWAY SECTION ===== */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.5 2.798H4.3c-1.53 0-2.5-1.798-1.5-2.798L4.18 15.23" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">AI API Gateway</h2>
              <p className="text-xs text-slate-500">Configure AI provider keys for the chatbot engine</p>
            </div>
          </div>

          <form onSubmit={handleSaveApiKeys} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">

              {/* Groq */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">Groq</p>
                    <p className="text-[10px] text-slate-400">Llama 3.3, fast inference</p>
                  </div>
                  {activeProvider === "groq" && <span className="text-[9px] font-black uppercase tracking-widest text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">Active</span>}
                  {savedKeys.groq && <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">Saved</span>}
                </div>
                <button type="button" onClick={() => setActiveProvider("groq")} className={`w-full rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeProvider === "groq" ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                  Use Groq in Agent SIHU
                </button>
                <input
                  type="text"
                  value={groqModel}
                  onChange={e => setGroqModel(e.target.value)}
                  placeholder="llama-3.3-70b-versatile"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                />
                <div className="relative">
                  <input
                    id="admin-groq-key"
                    type="password"
                    value={groqKey}
                    onChange={e => setGroqKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all pr-10"
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
                </div>
                {maskedKeys.groq && <p className="text-[11px] text-slate-500">Stored: {maskedKeys.groq}</p>}
              </div>

              {/* OpenAI */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path className="text-emerald-600" d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 004.981 4.18a5.985 5.985 0 00-3.998 2.9 6.046 6.046 0 00.743 7.097 5.98 5.98 0 00.51 4.911 6.051 6.051 0 006.515 2.9A5.985 5.985 0 0013.26 24a6.056 6.056 0 005.772-4.206 5.99 5.99 0 003.997-2.9 6.056 6.056 0 00-.747-7.073zM13.26 22.43a4.476 4.476 0 01-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 00.392-.681v-6.737l2.02 1.168a.071.071 0 01.038.052v5.583a4.504 4.504 0 01-4.494 4.494zM3.6 18.304a4.47 4.47 0 01-.535-3.014l.142.085 4.783 2.759a.771.771 0 00.78 0l5.843-3.369v2.332a.08.08 0 01-.033.062L9.74 19.95a4.5 4.5 0 01-6.14-1.646zM2.34 7.896a4.485 4.485 0 012.366-1.973V11.6a.766.766 0 00.388.676l5.815 3.355-2.02 1.168a.076.076 0 01-.071 0l-4.83-2.786A4.504 4.504 0 012.34 7.896zm16.597 3.855l-5.843-3.372 2.02-1.163a.077.077 0 01.071 0l4.83 2.775a4.5 4.5 0 01-.676 8.125V12.56a.786.786 0 00-.402-.81zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 00-.785 0L9.409 9.23V6.897a.066.066 0 01.028-.061l4.83-2.787a4.5 4.5 0 016.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 01-.038-.057V6.075a4.5 4.5 0 017.375-3.453l-.142.08L8.704 5.46a.795.795 0 00-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">OpenAI</p>
                    <p className="text-[10px] text-slate-400">GPT‑4o, GPT‑4 Turbo</p>
                  </div>
                  {activeProvider === "openai" && <span className="text-[9px] font-black uppercase tracking-widest text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">Active</span>}
                  {savedKeys.openai && <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Saved</span>}
                </div>
                <button type="button" onClick={() => setActiveProvider("openai")} className={`w-full rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeProvider === "openai" ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                  Use OpenAI in Agent SIHU
                </button>
                <input
                  type="text"
                  value={openaiModel}
                  onChange={e => setOpenaiModel(e.target.value)}
                  placeholder="gpt-4.1-mini"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                />
                <div className="relative">
                  <input
                    id="admin-openai-key"
                    type="password"
                    value={openaiKey}
                    onChange={e => setOpenaiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all pr-10"
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
                </div>
                {maskedKeys.openai && <p className="text-[11px] text-slate-500">Stored: {maskedKeys.openai}</p>}
              </div>

              {/* Gemini */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 19.5h20L12 2z" fill="#4285F4"/><path d="M12 8l5 9.5H7L12 8z" fill="#34A853"/></svg>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">Gemini</p>
                    <p className="text-[10px] text-slate-400">Gemini 1.5 Pro, Flash</p>
                  </div>
                  {activeProvider === "gemini" && <span className="text-[9px] font-black uppercase tracking-widest text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">Active</span>}
                  {savedKeys.gemini && <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Saved</span>}
                </div>
                <button type="button" onClick={() => setActiveProvider("gemini")} className={`w-full rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeProvider === "gemini" ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                  Use Gemini in Agent SIHU
                </button>
                <input
                  type="text"
                  value={geminiModel}
                  onChange={e => setGeminiModel(e.target.value)}
                  placeholder="gemini-1.5-flash"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                />
                <div className="relative">
                  <input
                    id="admin-gemini-key"
                    type="password"
                    value={geminiKey}
                    onChange={e => setGeminiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all pr-10"
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
                </div>
                {maskedKeys.gemini && <p className="text-[11px] text-slate-500">Stored: {maskedKeys.gemini}</p>}
              </div>

              {/* Anthropic */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.424 2.016L5.048 18h3.093l1.286-3.4h5.138L15.851 18h3.101L12.576 2.016h-1.152zm-.33 9.796l1.712-4.53 1.712 4.53H11.094z" fill="#D97706"/></svg>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">Anthropic</p>
                    <p className="text-[10px] text-slate-400">Claude 3.5 Sonnet, Opus</p>
                  </div>
                  {activeProvider === "anthropic" && <span className="text-[9px] font-black uppercase tracking-widest text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">Active</span>}
                  {savedKeys.anthropic && <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">Saved</span>}
                </div>
                <button type="button" onClick={() => setActiveProvider("anthropic")} className={`w-full rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeProvider === "anthropic" ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                  Use Claude in Agent SIHU
                </button>
                <input
                  type="text"
                  value={anthropicModel}
                  onChange={e => setAnthropicModel(e.target.value)}
                  placeholder="claude-3-5-sonnet-latest"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                />
                <div className="relative">
                  <input
                    id="admin-anthropic-key"
                    type="password"
                    value={anthropicKey}
                    onChange={e => setAnthropicKey(e.target.value)}
                    placeholder="sk-ant-api..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all pr-10"
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
                </div>
                {maskedKeys.anthropic && <p className="text-[11px] text-slate-500">Stored: {maskedKeys.anthropic}</p>}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 max-w-xl">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                Local temp mode: keys are stored only in a local server file for development. This is not secure enough for shared production hosting yet.
              </p>
              <button
                type="submit"
                disabled={apiSaving || (!groqKey && !openaiKey && !geminiKey && !anthropicKey)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:shadow-violet-200 hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
              >
                {apiSaving ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Saving...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Save Keys</>
                )}
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}
