import React, { useState } from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function ContactSection() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section id="contact" className="py-32 bg-background border-t border-border/50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
          <RevealOnScroll>
            <span className="text-primary font-black text-xs tracking-[0.3em] uppercase mb-4 block">Connect</span>
            <h2 className="text-4xl md:text-6xl font-black mb-8 text-nyc-header text-foreground uppercase leading-[0.9]">Start a <br /><span className="text-transparent" style={{ WebkitTextStroke: '1px var(--foreground)' }}>Conversation</span></h2>
            <p className="text-xl text-muted-foreground mb-12 font-light leading-relaxed max-w-md">
              Partner with the Lake Victoria Basin&apos;s leading community media network. Reach out for stories, tips, or professional collaborations.
            </p>
            
            <div className="space-y-8">
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-1">Direct Email</h4>
                  <p className="text-lg font-bold text-foreground">sangoinformationhub@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center transition-transform group-hover:-rotate-12">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-1">Elite Support</h4>
                  <p className="text-lg font-bold text-foreground">0722 318 820</p>
                </div>
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={200}>
            <div className="glass-premium p-10 md:p-14 rounded-[3rem] border border-slate-200/50 dark:border-white/5 shadow-2xl relative overflow-hidden">
              {submitted ? (
                <div className="text-center py-16 animate-fade-in relative z-10">
                  <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-8">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h3 className="text-3xl font-black mb-4 uppercase tracking-tight">Receipt Confirmed</h3>
                  <p className="text-muted-foreground font-light text-lg">We&apos;ve logged your request into our priority queue.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-400">Identity</label>
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary transition-all font-medium" placeholder="Full Name" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-400">Digital Reach</label>
                      <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary transition-all font-medium" placeholder="Email Address" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-400">Your Intel</label>
                    <textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} rows={5} className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none font-medium" placeholder="What&apos;s on your mind?"></textarea>
                  </div>
                  <button type="submit" className="w-full py-5 bg-slate-900 dark:bg-primary text-white font-black rounded-2xl hover:bg-primary dark:hover:bg-white dark:hover:text-primary transition-all shadow-xl uppercase tracking-widest text-xs scale-[1.02] active:scale-95">
                    Transmit Message
                  </button>
                </form>
              )}
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
