import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify",
  description: "Help verify environmental data for the Lake Victoria Basin with SIHU.",
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
