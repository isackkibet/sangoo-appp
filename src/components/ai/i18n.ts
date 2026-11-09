import type { Language } from "./types";

type Dictionary = {
  brandSubtitle: string;
  newChat: string;
  aiAssistant: string;
  discover: string;
  articles: string;
  podcasts: string;
  videos: string;
  topics: string;
  recent: string;
  noRecent: string;
  language: string;
  appearance: string;
  light: string;
  dark: string;
  welcomeHeadline: string;
  welcomeLead: string;
  suggestionsTitle: string;
  inputPlaceholder: string;
  voiceInput: string;
  listening: string;
  transcript: string;
  editTranscript: string;
  cancel: string;
  send: string;
  useText: string;
  voiceUnsupported: string;
  searching: string;
  finding: string;
  preparing: string;
  searchingSiHU: string;
  checkingWeb: string;
  comparingEvidence: string;
  preparingAnswer: string;
  insufficientEvidence: string;
  sihuInformation: string;
  externalWebInformation: string;
  combinedEvidence: string;
  sources: string;
  related: string;
  viewSources: string;
  hideSources: string;
  listen: string;
  stop: string;
  pause: string;
  play: string;
  copy: string;
  copied: string;
  followUp: string;
  open: string;
  read: string;
  watch: string;
  clear: string;
  clearConfirmTitle: string;
  clearConfirmBody: string;
  clearAll: string;
  delete: string;
  confirm: string;
  offline: string;
  online: string;
  disclaimer: string;
  emptySources: string;
  discoverTitle: string;
  discoverSub: string;
  latestSources: string;
  sourceSihu: string;
  sourceWeb: string;
  sourceResearch: string;
  sourceCommunity: string;
  sourceAi: string;
  typeArticle: string;
  typePodcast: string;
  typeVideo: string;
  typeReport: string;
  typeKnowledge: string;
  retry: string;
  errorReply: string;
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
  close: string;
  menu: string;
  panelSources: string;
  thinking: string;
};

export const dictionary: Record<Language, Dictionary> = {
  en: {
    brandSubtitle: "Your intelligent guide to Lake Victoria",
    newChat: "New conversation",
    aiAssistant: "AI Assistant",
    discover: "Discover",
    articles: "Articles",
    podcasts: "Podcasts",
    videos: "Videos",
    topics: "Topics",
    recent: "Recent conversations",
    noRecent: "No conversations yet",
    language: "Language",
    appearance: "Appearance",
    light: "Light",
    dark: "Dark",
    welcomeHeadline: "Your intelligent guide to Lake Victoria",
    welcomeLead: "Explore knowledge. Discover stories. Understand communities.",
    suggestionsTitle: "Suggested prompts",
    inputPlaceholder: "Ask SIHU AI...",
    voiceInput: "Speak your question",
    listening: "Listening...",
    transcript: "Transcript",
    editTranscript: "Edit before sending",
    cancel: "Cancel",
    send: "Send",
    useText: "Use this text",
    voiceUnsupported: "Voice input is not supported in this browser. Type your question instead.",
    searching: "Searching SIHU knowledge",
    finding: "Finding relevant articles",
    preparing: "Preparing your answer",
    searchingSiHU: "Searching SIHU...",
    checkingWeb: "Checking external sources...",
    comparingEvidence: "Comparing available evidence...",
    preparingAnswer: "Preparing grounded answer...",
    insufficientEvidence: "I couldn't find enough reliable evidence to answer this question accurately.",
    sihuInformation: "SIHU information",
    externalWebInformation: "External web information",
    combinedEvidence: "Combined evidence",
    sources: "Sources",
    related: "Related content",
    viewSources: "View sources",
    hideSources: "Hide sources",
    listen: "Listen",
    stop: "Stop",
    pause: "Pause",
    play: "Play",
    copy: "Copy",
    copied: "Copied",
    followUp: "Ask follow-up",
    open: "Open",
    read: "Read",
    watch: "Watch",
    clear: "Clear conversation",
    clearConfirmTitle: "Clear this conversation?",
    clearConfirmBody: "This removes the messages from this device. It cannot be undone.",
    clearAll: "Clear all",
    delete: "Delete",
    confirm: "Clear",
    offline: "AI running in offline mode",
    online: "AI connected",
    disclaimer: "SIHU AI can make mistakes. Check important facts in the sources.",
    emptySources: "Sources will appear here as you ask questions.",
    discoverTitle: "Discover SIHU",
    discoverSub: "Real stories, podcasts and videos from the basin.",
    latestSources: "From this answer",
    sourceSihu: "SIHU",
    sourceWeb: "Web",
    sourceResearch: "Research",
    sourceCommunity: "Community",
    sourceAi: "AI synthesis",
    typeArticle: "Article",
    typePodcast: "Podcast",
    typeVideo: "Video",
    typeReport: "Report",
    typeKnowledge: "Knowledge",
    retry: "Try again",
    errorReply: "I could not reach the AI service right now. Please try again in a moment.",
    justNow: "Just now",
    minutesAgo: "m ago",
    hoursAgo: "h ago",
    daysAgo: "d ago",
    close: "Close",
    menu: "Open menu",
    panelSources: "Open sources",
    thinking: "SIHU AI is thinking",
  },
  sw: {
    brandSubtitle: "Mwongozo wako mahiri wa Ziwa Victoria",
    newChat: "Mazungumzo mapya",
    aiAssistant: "Msaidizi wa AI",
    discover: "Gundua",
    articles: "Makala",
    podcasts: "Podikasti",
    videos: "Video",
    topics: "Mada",
    recent: "Mazungumzo ya hivi karibuni",
    noRecent: "Hakuna mazungumzo bado",
    language: "Lugha",
    appearance: "Muonekano",
    light: "Mwangaza",
    dark: "Giza",
    welcomeHeadline: "Mwongozo wako mahiri wa Ziwa Victoria",
    welcomeLead: "Gundua maarifa. Gundua hadithi. Elewa jamii.",
    suggestionsTitle: "Maswali yaliyopendekezwa",
    inputPlaceholder: "Uliza SIHU AI...",
    voiceInput: "Zungumza swali lako",
    listening: "Inasikiliza...",
    transcript: "Maandishi",
    editTranscript: "Hariri kabla ya kutuma",
    cancel: "Ghairi",
    send: "Tuma",
    useText: "Tumia maandishi haya",
    voiceUnsupported: "Ingizo la sauti halitumiki kwenye kivinjari hiki. Andika swali lako badala yake.",
    searching: "Inatafuta maarifa ya SIHU",
    finding: "Inatafuta makala husika",
    preparing: "Inaandaa jibu lako",
    searchingSiHU: "Inatafuta SIHU...",
    checkingWeb: "Inachanganya vyanzo vya nje...",
    comparingEvidence: "Inalinganisha haki zilizopatikana...",
    preparingAnswer: "Inaandaa jibu iliyotumikia...",
    insufficientEvidence: "Sitaki kutafuta maelezo ya ajili ya maswali hili kwa kutumia zana ambazo hawiwezi kuthibitishwa.",
    sihuInformation: "Maarifa ya SIHU",
    externalWebInformation: "Maarifa kutoka vyanzo vya nje",
    combinedEvidence: "Haki zilichanganyika",
    sources: "Vyanzo",
    related: "Maudhui husika",
    viewSources: "Tazama vyanzo",
    hideSources: "Ficha vyanzo",
    listen: "Sikiliza",
    stop: "Simamisha",
    pause: "Sitisha",
    play: "Cheza",
    copy: "Nakili",
    copied: "Imenakiliwa",
    followUp: "Uliza zaidi",
    open: "Fungua",
    read: "Soma",
    watch: "Tazama",
    clear: "Futa mazungumzo",
    clearConfirmTitle: "Futa mazungumzo haya?",
    clearConfirmBody: "Hii itaondoa ujumbe kwenye kifaa hiki. Haiwezi kutenduliwa.",
    clearAll: "Futa yote",
    delete: "Futa",
    confirm: "Futa",
    offline: "AI inafanya kazi bila mtandao",
    online: "AI imeunganishwa",
    disclaimer: "SIHU AI inaweza kukosea. Hakikisha ukweli muhimu kwenye vyanzo.",
    emptySources: "Vyanzo vitaonekana hapa unapouliza maswali.",
    discoverTitle: "Gundua SIHU",
    discoverSub: "Hadithi, podikasti na video halisi kutoka bonde.",
    latestSources: "Kutoka jibu hili",
    sourceSihu: "SIHU",
    sourceWeb: "Wavuti",
    sourceResearch: "Utafiti",
    sourceCommunity: "Jamii",
    sourceAi: "Muunganiko wa AI",
    typeArticle: "Makala",
    typePodcast: "Podikasti",
    typeVideo: "Video",
    typeReport: "Ripoti",
    typeKnowledge: "Maarifa",
    retry: "Jaribu tena",
    errorReply: "Sikuweza kufikia huduma ya AI kwa sasa. Tafadhali jaribu tena baadaye.",
    justNow: "Sasa hivi",
    minutesAgo: "dakika zilizopita",
    hoursAgo: "saa zilizopita",
    daysAgo: "siku zilizopita",
    close: "Funga",
    menu: "Fungua menyu",
    panelSources: "Fungua vyanzo",
    thinking: "SIHU AI inafikiria",
  },
};

export type PromptSuggestion = {
  icon: "waves" | "fish" | "leaf" | "ship" | "newspaper" | "languages";
  title: string;
  prompt: string;
};

export const suggestions: Record<Language, PromptSuggestion[]> = {
  en: [
    { icon: "waves", title: "Pollution in Lake Victoria", prompt: "Why is pollution a problem in Lake Victoria?" },
    { icon: "fish", title: "Fisheries and communities", prompt: "What are the biggest fisheries challenges around Lake Victoria?" },
    { icon: "leaf", title: "Conservation projects", prompt: "What conservation projects is SIHU covering around the lake?" },
    { icon: "ship", title: "The blue economy", prompt: "Explain the blue economy around Lake Victoria." },
    { icon: "newspaper", title: "Latest from SIHU", prompt: "What has SIHU published recently about Lake Victoria?" },
    { icon: "languages", title: "Kiswahili", prompt: "Nieleze kuhusu uchafuzi wa Ziwa Victoria." },
  ],
  sw: [
    { icon: "waves", title: "Uchafuzi wa Ziwa Victoria", prompt: "Kwa nini uchafuzi ni tatizo katika Ziwa Victoria?" },
    { icon: "fish", title: "Uvuvi na jamii", prompt: "Changamoto kubwa za uvuvi karibu na Ziwa Victoria ni zipi?" },
    { icon: "leaf", title: "Miradi ya uhifadhi", prompt: "SIHU inaripoti miradi gani ya uhifadhi karibu na ziwa?" },
    { icon: "ship", title: "Uchumi wa bluu", prompt: "Nieleze kuhusu uchumi wa bluu katika Ziwa Victoria." },
    { icon: "newspaper", title: "Habari za hivi karibuni", prompt: "SIHU imechapisha nini hivi karibuni kuhusu Ziwa Victoria?" },
    { icon: "languages", title: "English", prompt: "Why is pollution a problem in Lake Victoria?" },
  ],
};

export function timeAgo(timestamp: number, language: Language): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const t = dictionary[language];
  if (minutes < 1) return t.justNow;
  if (minutes < 60) return `${minutes}${language === "sw" ? " " : ""}${t.minutesAgo}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${language === "sw" ? " " : ""}${t.hoursAgo}`;
  const days = Math.floor(hours / 24);
  return `${days}${language === "sw" ? " " : ""}${t.daysAgo}`;
}
