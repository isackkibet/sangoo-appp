import type { Metadata } from "next";
import NewsHeader from "@/components/portal/NewsHeader";

export const metadata: Metadata = {
  title: "News",
  description: "Latest news, podcasts and events from the Lake Victoria Basin, by Sango Information Hub.",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-50 min-h-screen">
      <NewsHeader />
      <main>
        {children}
      </main>
    </div>
  );
}
