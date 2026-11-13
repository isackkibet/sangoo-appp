import type { Metadata } from "next";
import NewsHeader from "@/components/portal/NewsHeader";
import MapExplorer from "./MapExplorer";

export const metadata: Metadata = {
  title: "Basin map",
  description: "Interactive map of the Lake Victoria Basin in Kenya: counties, rivers, wetlands, forests and the SIHU office in Busia.",
};

export default function MapPage() {
  return (
    <>
      <NewsHeader />
      <MapExplorer />
    </>
  );
}
