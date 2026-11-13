import type { Metadata } from "next";
import { Inter, Merriweather, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import SihuAuthProvider from "@/components/auth/SihuAuth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const metadataBaseUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
  : process.env.VERCEL_URL
  ? new URL(`https://${process.env.VERCEL_URL}`)
  : new URL("http://localhost:3000");

export const metadata: Metadata = {
  title: "Sango Information Hub | Info Portal",
  description: "Knowledge management and information sharing on natural resources and environmental protection around the Lake Victoria Basin in Kenya.",
  keywords: ["Sango", "Information Hub", "Lake Victoria", "Environment", "News", "Kenya"],
  metadataBase: metadataBaseUrl,
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sango Hub",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable} ${plusJakartaSans.variable} antialiased`} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body className="min-h-screen bg-slate-950 text-foreground flex flex-col font-sans relative overflow-x-hidden">
        <SihuAuthProvider>
        {/* Technical Overlays */}
        <div className="fixed inset-0 bg-grid pointer-events-none z-0 opacity-40" />
        <div className="fixed inset-0 bg-gradient-to-tr from-[#020617] via-slate-900/20 to-primary/10 pointer-events-none z-0" />
        <div className="fixed top-0 right-0 w-[220px] h-[220px] sm:w-[320px] sm:h-[320px] md:w-[500px] md:h-[500px] bg-primary/5 blur-[120px] pointer-events-none z-0" />
        <div className="fixed bottom-0 left-0 w-[220px] h-[220px] sm:w-[320px] sm:h-[320px] md:w-[500px] md:h-[500px] bg-basin-indigo/5 blur-[120px] pointer-events-none z-0" />
        
        {/* Viewport for children */}
        <main className="flex-1 relative z-10">
          {children}
        </main>

        {/* Footer */}
        <footer className="site-footer relative z-10 bg-slate-950 text-white pt-20 pb-10 border-t border-white/5">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
               <div className="md:col-span-2">
                  <h3 className="font-heading font-bold text-2xl mb-5 text-white">Sango Information Hub</h3>
                  <p className="text-slate-400 text-lg font-light leading-relaxed max-w-md">
                    A registered community media initiative for knowledge, environmental protection and development across the Lake Victoria Basin.
                  </p>
                   <div className="mt-10 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-primary transition-all cursor-pointer">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                    </div>
                    <a href="https://t.me/SihuHubBot" target="_blank" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-[#229ED9] hover:border-[#229ED9] transition-all cursor-pointer text-white">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.35-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.35-.49.96-.75 3.78-1.65 6.31-2.74 7.58-3.27 3.61-1.51 4.35-1.77 4.84-1.78.11 0 .35.03.5.16.12.1.16.23.18.33.02.08.03.22.02.35z"/></svg>
                    </a>
                    <a href="https://wa.me/254722318820" target="_blank" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-[#25D366] hover:border-[#25D366] transition-all cursor-pointer text-white">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                  </div>
               </div>
               <div>
                  <h4 className="font-bold mb-5 text-[14px] text-white">News</h4>
                  <ul className="space-y-4 text-slate-400 font-medium text-sm">
                    <li><a href="/portal" className="hover:text-white transition-colors">Latest News</a></li>
                    <li><a href="/portal#podcasts" className="hover:text-white transition-colors">Podcasts</a></li>
                    <li><a href="/portal#events" className="hover:text-white transition-colors">Events</a></li>
                    <li><Link href="/ai" className="hover:text-white transition-colors">AI Assistant</Link></li>
                  </ul>
               </div>
               <div>
                  <h4 className="font-bold mb-5 text-[14px] text-white">Explore</h4>
                  <ul className="space-y-4 text-slate-400 font-medium text-sm">
                    <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                    <li><Link href="/dapp" className="hover:text-white transition-colors">DApp Dashboard</Link></li>
                    <li><Link href="/login?next=/media/feed" className="hover:text-white transition-colors">Member Log In</Link></li>
                    <li><Link href="/#contact" className="hover:text-white transition-colors">Contact us</Link></li>
                  </ul>
               </div>
            </div>
            <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="text-slate-400 text-[13px]">
                  © {new Date().getFullYear()} Sango Information Hub. All rights reserved.
               </div>
               <div className="flex gap-6 text-[13px] text-slate-400">
                  <span>Fort Jesus Road, Busia Town</span>
                  <a href="mailto:sangoinformationhub@gmail.com" className="hover:text-white transition-colors">sangoinformationhub@gmail.com</a>
               </div>
            </div>
          </div>
        </footer>
        </SihuAuthProvider>
      </body>
    </html>
  );
}
