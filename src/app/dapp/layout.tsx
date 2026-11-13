import NewsHeader from "@/components/portal/NewsHeader";
import DappNav from "@/components/dapp/DappNav";

/* Every DApp page: the site header, then the DApp tabs. */
export default function DappLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NewsHeader />
      <div className="h-[72px]" />
      <DappNav />
      {children}
    </div>
  );
}
