import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Assistant",
  description: "Ask SIHU AI about news, environment and development across the Lake Victoria Basin.",
};

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
