export type SangoNewsVideo = {
  id: string;
  url: string;
  title: string;
  description: string;
  publishedAt: string;
  source: string;
};

export const sangoNewsVideos: SangoNewsVideo[] = [
  {
    id: "bumbe-fish-cage",
    url: "https://youtu.be/PLbB6m2UlV0",
    title: "New fish cage technology transforms fishing in Bumbe Village, Busia",
    description:
      "A fishing revolution in Bumbe Village, Bunyala, Busia County, is quietly transforming lives along the shores of Lake Victoria. Fish cage farming has taken root, offering a safer and more sustainable alternative to traditional fishing methods.",
    publishedAt: "2025-07-27T03:54:56-07:00",
    source: "KBC Channel 1",
  },
  {
    id: "samia-bunyala-fish-farming",
    url: "https://youtu.be/Bbijkfj3Sss",
    title: "Fishermen in Samia and Bunyala in Busia County embrace tech in fish farming",
    description:
      "Fishermen in Samia and Bunyala in Busia County are embracing technology in fish farming.",
    publishedAt: "2025-07-31T03:43:23-07:00",
    source: "KTN News Kenya",
  },
];
