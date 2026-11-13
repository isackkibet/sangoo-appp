import NewsHeader from "@/components/portal/NewsHeader";

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
