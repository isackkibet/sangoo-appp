import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Sango Information Hub (SIHU) account.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
