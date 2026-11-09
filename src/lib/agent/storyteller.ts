// Enhanced Storytelling Response Builder for Agent SIHU
// Transforms factual responses into engaging narrative experiences

import type { AgentKnowledgeItem, AgentIntent } from "@/lib/agent/types";
import {
  detectMood,
  detectConversationContext,
  isFollowUpQuestion,
} from "@/lib/agent/intent";
import {
  sangoStories,
  getStoriesByTopic,
  getStoryById,
  storytellingTemplates,
  type StorySegment,
} from "@/lib/agent/stories";

// Track conversation context for storytelling flow
interface StoryContext {
  currentStoryId?: string;
  storyTopic?: string;
  depth: number;
  userWantsStory: boolean;
}

// Detect if user is asking for a story/narrative
function detectStoryRequest(message: string): boolean {
  const storyKeywords = [
    "tell me", "story", "narrative", "explain like", 
    "describe", "picture", "imagine", "what if", "how does it work",
    "why is", "what happens", "who are", "green economy", 
    "blue economy", "basin health", "mining", "blockchain",
    "community", "guardian", "sango", "lake victoria"
  ];
  
  const lowerMessage = message.toLowerCase();
  return storyKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Determine which topic the user is interested in
function detectTopicInterest(message: string): StorySegment["topic"] | null {
  const lower = message.toLowerCase();
  
  if (lower.includes("green") || lower.includes("tree") || lower.includes("forest") || lower.includes("carbon") || lower.includes("plant")) {
    return "green-economy";
  }
  if (lower.includes("blue") || lower.includes("fish") || lower.includes("water") || lower.includes("lake") || lower.includes("fishing") || lower.includes("wetland")) {
    return "blue-economy";
  }
  if (lower.includes("health") || lower.includes("mining") || lower.includes("monitor") || lower.includes("data") || lower.includes("quality")) {
    return "basin-health";
  }
  if (lower.includes("community") || lower.includes("people") || lower.includes("guardian") || lower.includes("elder") || lower.includes("steward")) {
    return "community";
  }
  if (lower.includes("blockchain") || lower.includes("token") || lower.includes("nft") || lower.includes("avalanche") || lower.includes("hedera") || lower.includes("verify")) {
    return "blockchain";
  }
  
  return null;
}

// Select the best story for the context
function selectStory(
  message: string, 
  intent: string, 
  topic: StorySegment["topic"] | null,
  history: Array<{ user_message?: string; bot_response?: string }>
): StorySegment | null {
  // Check if we're continuing a previous story
  const lastBotResponse = history[history.length - 1]?.bot_response || "";
  const storyMentioned = sangoStories.find(s => lastBotResponse.includes(s.title));
  
  // If user wants to continue or asks follow-up, keep the same topic
  const continuationWords = ["more", "continue", "next", "then", "what else", "tell me more", "go on"];
  const isContinuation = continuationWords.some(word => message.toLowerCase().includes(word));
  
  if (isContinuation && storyMentioned) {
    // Find a related story
    const relatedStories = getStoriesByTopic(storyMentioned.topic).filter(s => s.id !== storyMentioned.id);
    if (relatedStories.length > 0) {
      return relatedStories[0];
    }
  }
  
  // Welcome/first interaction
  if (history.length === 0 || intent === "general_chat") {
    if (!topic || topic === "basin-health") {
      return getStoryById("welcome") || null;
    }
  }
  
  // Topic-based selection
  if (topic) {
    const stories = getStoriesByTopic(topic);
    if (stories.length > 0) {
      // Pick based on conversation depth
      const depth = history.filter(h => h.bot_response && sangoStories.some(s => h.bot_response?.includes(s.title))).length;
      return stories[depth % stories.length];
    }
  }
  
  // Default to welcome story
  return getStoryById("welcome") || null;
}

// Build a narrative response
function buildNarrativeResponse(
  story: StorySegment,
  knowledge: AgentKnowledgeItem[],
  isFollowUp: boolean
): string {
  let response = "";
  
  // Opening for new stories
  if (!isFollowUp) {
    const opener = storytellingTemplates.opening[Math.floor(Math.random() * storytellingTemplates.opening.length)];
    if (opener.includes("{topic}")) {
      response = opener.replace("{topic}", story.title) + "\n\n";
    } else if (opener.includes("{scenario}")) {
      response = opener.replace("{scenario}", story.content.split(".")[0] + ".") + "\n\n";
    } else {
      response = opener + "\n\n";
    }
  }
  
  // Add the story content
  response += story.content;
  
  // Add invitation for follow-up
  const invitation = storytellingTemplates.invitation[Math.floor(Math.random() * storytellingTemplates.invitation.length)];
  response += "\n\n" + invitation.replace("{topic}", "this");
  
  // Add suggested questions as bullet points
  if (story.followUpQuestions.length > 0) {
    response += "\n\nYou could ask:\n";
    story.followUpQuestions.slice(0, 3).forEach((q, i) => {
      response += `• ${q}${i < 2 ? "\n" : ""}`;
    });
  }
  
  return response;
}

// Build a simple but engaging factual response
function buildFactualResponse(
  knowledge: AgentKnowledgeItem[],
  mood: ReturnType<typeof detectMood> = "neutral"
): string {
  if (knowledge.length === 0) {
    // Context-aware fallback based on mood
    const fallbacks: Record<typeof mood, string> = {
      excited: "I'd love to share amazing stories about the Lake Victoria Basin! The communities here are doing incredible work with the Green Economy, Blue Economy, and Basin Health Mining. Which adventure interests you most?",
      curious: "The Lake Victoria Basin holds fascinating stories of innovation and hope. Would you like to explore how the Green Economy works, discover the Blue Economy, or learn about Basin Health Mining?",
      neutral: "I'd love to tell you a story about the Lake Victoria Basin and how communities are protecting it. Would you like to hear about the Green Economy, the Blue Economy, or how Basin Health Mining works?",
      concerned: "I understand there are many challenges facing our environment. But in the Lake Victoria Basin, there's also hope - communities are creating solutions through the Green Economy, Blue Economy, and Basin Health Mining. Would you like to hear a story of what's working?",
      grateful: "Thank you for your interest in the Lake Victoria Basin. I'd be honored to share stories about the Green Economy, the Blue Economy, or Basin Health Mining. Which resonates with you?",
    };
    return fallbacks[mood];
  }

  const top = knowledge[0];

  // Transform factual content into narrative format with mood-appropriate opening
  const openings: Record<typeof mood, string[]> = {
    excited: ["Here's something fascinating! ", "You'll find this interesting! ", "Amazingly enough... "],
    curious: ["Let me share what we know... ", "Here's the story behind this... ", "It's quite interesting... "],
    neutral: ["", "Here's what I found: ", ""],
    concerned: ["I understand this matters deeply. Here's what we know: ", "This is important. ", "Let me share what the guardians have learned: "],
    grateful: ["Thank you for asking about this. ", "I'm happy to share: ", "Here's what I've learned: "],
  };

  const intros = openings[mood];
  let response = intros[Math.floor(Math.random() * intros.length)];

  if (top.title) {
    response += `**${top.title}**\n\n`;
  }

  // Break content into narrative paragraphs
  const sentences = (top.content || "").split(/[.!?]+/).filter((s) => s.trim().length > 0);

  if (sentences.length > 0) {
    // Group into 2-3 sentence paragraphs for readability
    for (let i = 0; i < sentences.length; i += 2) {
      const chunk = sentences.slice(i, i + 2).join(". ") + ".";
      response += chunk + "\n\n";
    }
  }

  if (top.source) {
    response += `*Source: ${top.source}*`;
  }

  return response.trim();
}

// Context-aware greeting responses
function buildGreetingResponse(
  context: ReturnType<typeof detectConversationContext>,
  mood: ReturnType<typeof detectMood>
): { reply: string; isStory: boolean; followUpQuestions: string[] } {
  const greetings = {
    firstTime: {
      excited: "Welcome! I'm Agent SIHU, your storyteller for the Lake Victoria Basin! I'm thrilled to meet you! Would you like me to tell you a story about Sango and the guardians of this magnificent ecosystem?",
      curious: "Hello and welcome! I'm Agent SIHU, your guide to the Lake Victoria Basin. I'm curious - what brings you here today? Are you interested in the green economy, the blue waters, or perhaps the blockchain that protects it all?",
      neutral: "Welcome! I'm Agent SIHU, your guide to the Sango ecosystem and the Lake Victoria Basin. How can I help you explore this world where forests whisper to the lake?",
      concerned: "Welcome, friend. I'm Agent SIHU, and I'm here to share stories of hope from the Lake Victoria Basin. Many challenges exist here, but so do incredible solutions. Would you like to hear about the communities working to restore balance?",
      grateful: "Hello! What a wonderful day to meet someone new. I'm Agent SIHU, your storyteller for the Lake Victoria Basin. I'm grateful you're here to learn about this incredible ecosystem. Where shall we begin?",
    },
    returning: {
      excited: "Welcome back! I was hoping you'd return! I have so many more stories to share about the Basin. What adventure shall we embark on today?",
      curious: "Hello again! I'm glad you're back. Your curiosity last time was wonderful. What new aspect of the Lake Victoria Basin would you like to explore today?",
      neutral: "Welcome back! It's good to see you again. Ready to continue our journey through the Lake Victoria Basin stories?",
      concerned: "Hello again, friend. I sense you may have questions or concerns. I'm here to listen and share stories of how communities are addressing challenges in the Basin. What would you like to know?",
      grateful: "Welcome back! Thank you for returning. Your presence here means a lot. Shall I tell you a new story about the guardians of the Basin?",
    },
  };

  const category = context.isReturningUser ? "returning" : "firstTime";
  const reply = greetings[category][mood];

  return {
    reply,
    isStory: false,
    followUpQuestions: [
      "Tell me the Sango origin story",
      "What is the Green Economy?",
      "How does Basin Health Mining work?",
      "Who are the guardians of the lake?",
    ],
  };
}

// Context-aware farewell responses
function buildFarewellResponse(
  context: ReturnType<typeof detectConversationContext>,
  mood: ReturnType<typeof detectMood>
): { reply: string; isStory: boolean } {
  const farewells = {
    brief: {
      excited: "What a wonderful chat! Come back soon for more stories!",
      curious: "Until next time! Keep that curiosity burning bright!",
      neutral: "Goodbye! Feel free to return anytime.",
      concerned: "Take care. Remember, there's always hope in the Basin.",
      grateful: "Thank you for sharing this time with me. Farewell!",
    },
    engaged: {
      excited: "What an incredible journey we've had today! The stories of the Lake Victoria Basin never cease to amaze me, and I'm so glad you got to experience them too. Come back soon - the guardians always have new tales to share!",
      curious: "It's been wonderful exploring these ideas with you. Your curiosity is a gift - never stop asking questions about the world around you. I'll be here whenever you're ready to dive deeper into the Basin's stories!",
      neutral: "Thank you for spending time learning about the Lake Victoria Basin today. The stories of this ecosystem are endless, and I look forward to sharing more with you whenever you return.",
      concerned: "I appreciate you taking the time to learn about both the challenges and solutions in the Basin. There's real work being done, real hope growing. Come back anytime you need to hear stories of what's working.",
      grateful: "Thank you so much for this meaningful conversation. These stories matter, and so does your interest in them. Until we meet again, may the wisdom of the Basin guide you!",
    },
  };

  const category = context.userEngagement === "high" ? "engaged" : "brief";
  const reply = farewells[category][mood];

  return {
    reply,
    isStory: false,
  };
}

// Main storytelling response builder - now context-aware and interactive
export function buildStorytellerResponse(params: {
  message: string;
  intent: AgentIntent;
  knowledge: AgentKnowledgeItem[];
  history: Array<{ user_message?: string; bot_response?: string }>;
}): {
  reply: string;
  isStory: boolean;
  storyId?: string;
  followUpQuestions: string[];
  speechText: string;
} {
  const { message, intent, knowledge, history } = params;

  // Detect conversation context and mood
  const context = detectConversationContext(message, history);
  const mood = detectMood(message);
  const lastBotResponse = history[history.length - 1]?.bot_response;
  const isFollowUp = isFollowUpQuestion(message, lastBotResponse);

  // Handle greetings contextually
  if (intent === "greeting") {
    const response = buildGreetingResponse(context, mood);
    return {
      ...response,
      speechText: getSpeechFriendlyText(response.reply || ""),
    };
  }

  // Handle farewells contextually
  if (intent === "farewell") {
    const response = buildFarewellResponse(context, mood);
    return {
      ...response,
      followUpQuestions: [],
      speechText: getSpeechFriendlyText(response.reply || ""),
    };
  }

  // Check if user wants a story experience
  const wantsStory = detectStoryRequest(message);
  const topic = detectTopicInterest(message);

  // Determine if this is a follow-up to a previous story
  const lastResponse = history[history.length - 1]?.bot_response || "";
  const wasPreviousStory = sangoStories.some((s) => lastResponse.includes(s.title));

  // Select appropriate story
  const story = selectStory(message, intent, topic, history);

  // Build adaptive opening based on mood and context
  let reply = "";

  if (story && (wantsStory || wasPreviousStory || intent === "general_chat" || intent === "story_request")) {
    const isFollowUpStory = wasPreviousStory && !isFollowUp;

    // Add mood-appropriate opening
    if (!isFollowUpStory) {
      const openers: Record<typeof mood, string[]> = {
        excited: ["Oh, this is one of my favorite stories!", "You're in for a treat! ", "I'm excited to share this with you! "],
        curious: ["Ah, an excellent question! Let me weave you a tale...", "Curiosity like yours deserves a good story. ", "Let me paint you a picture..."],
        neutral: ["Let me tell you about...", "Here's the story...", "Picture this..."],
        concerned: ["I understand your concern. Let me share a story of hope...", "There's hope in this story...", "The guardians have been working on this..."],
        grateful: ["Thank you for asking. This story means a lot...", "I'm grateful to share this with you...", "This is a beautiful story..."],
      };

      const moodOpeners = openers[mood];
      reply += moodOpeners[Math.floor(Math.random() * moodOpeners.length)] + "\n\n";
    }

    reply += buildNarrativeResponse(story, knowledge, isFollowUpStory);

    return {
      reply,
      isStory: true,
      storyId: story.id ?? undefined,
      followUpQuestions: story.followUpQuestions.slice(0, 3),
      speechText: getSpeechFriendlyText(reply || ""),
    };
  }

  // Handle follow-up questions contextually
  if (isFollowUp && lastBotResponse) {
    reply = buildFollowUpResponse(message, lastBotResponse, knowledge, mood);
    return {
      reply,
      isStory: false,
      followUpQuestions: [
        "Tell me more about this",
        "How does this affect the Basin?",
        "What can communities do?",
      ],
      speechText: getSpeechFriendlyText(reply || ""),
    };
  }

  // Handle clarification requests
  if (intent === "clarification") {
    reply = buildClarificationResponse(message, lastBotResponse || "", knowledge, mood);
    return {
      reply,
      isStory: false,
      followUpQuestions: [
        "Can you give me an example?",
        "How does this work in practice?",
        "What does this mean for local people?",
      ],
      speechText: getSpeechFriendlyText(reply || ""),
    };
  }

  // Fallback to factual but engaging response
  reply = buildFactualResponse(knowledge, mood);

  return {
    reply,
    isStory: false,
    followUpQuestions: [
      "Tell me a story about this",
      "How does this connect to the Lake Victoria Basin?",
      "What does this mean for local communities?",
    ],
    speechText: getSpeechFriendlyText(reply),
  };
}

// Build contextual follow-up response
function buildFollowUpResponse(
  message: string,
  previousResponse: string,
  knowledge: AgentKnowledgeItem[],
  mood: ReturnType<typeof detectMood>
): string {
  const followUpIntros: Record<typeof mood, string[]> = {
    excited: ["Great follow-up! ", "I'm glad you're excited to learn more! ", "Absolutely! Let me expand on that..."],
    curious: ["That's a natural next question. ", "Curiosity leads us deeper. ", "Let me elaborate..."],
    neutral: ["Good question. ", "Let me explain further. ", "Here's more detail..."],
    concerned: ["I understand your concern. ", "Let me address that worry. ", "The situation is complex, but..."],
    grateful: ["Thank you for asking. ", "I appreciate your engagement. ", "Let me share more..."],
  };

  const intros = followUpIntros[mood];
  let response = intros[Math.floor(Math.random() * intros.length)] + "\n\n";

  // Try to find relevant knowledge
  if (knowledge.length > 0) {
    const top = knowledge[0];
    response += top.content || "";
  } else {
    response += "Building on what I just shared, the connection runs deeper. The Lake Victoria Basin is an intricate web where every action creates ripples. Communities here have learned this over generations - that the forest and the lake speak to each other, and we must learn to listen.";
  }

  return response;
}

// Build clarification response
function buildClarificationResponse(
  message: string,
  previousResponse: string,
  knowledge: AgentKnowledgeItem[],
  mood: ReturnType<typeof detectMood>
): string {
  const clarifyIntros: Record<typeof mood, string[]> = {
    excited: ["Let me make this clearer! ", "No problem, let me rephrase! ", "I'll explain it better!"],
    curious: ["Let me clarify that for you. ", "Here's a clearer explanation...", "I can break this down better..."],
    neutral: ["Let me rephrase that. ", "Here's a simpler way to understand it...", "Allow me to clarify..."],
    concerned: ["Don't worry, let me explain more clearly. ", "I understand the confusion. Here's a clearer picture...", "Let me address this step by step..."],
    grateful: ["Thank you for asking for clarification. ", "I'm happy to explain this better. ", "Let me try a different approach..."],
  };

  const intros = clarifyIntros[mood];
  let response = intros[Math.floor(Math.random() * intros.length)] + "\n\n";

  // Simplify and clarify
  if (knowledge.length > 0) {
    const sentences = (knowledge[0].content || "").split(/[.!?]+/).filter((s) => s.trim().length > 0);
    // Take first 2-3 sentences and simplify
    const simplified = sentences.slice(0, 3).join(". ") + ".";
    response += `Think of it this way: ${simplified}\n\n`;
    response += "Imagine you're standing at the edge of Lake Victoria. You can see the water, feel the breeze, hear the birds. The concepts we're discussing are as real and tangible as that experience.";
  } else {
    response += "Think of the Lake Victoria Basin like a living body. The forests are the lungs, breathing in carbon and exhaling oxygen. The lake is the heart, pumping water and life through the entire region. When we plant a tree or protect a wetland, we're strengthening this living system.";
  }

  return response;
}

// Get welcome message for new conversations
export function getWelcomeStory(): string {
  const welcome = getStoryById("welcome");
  if (!welcome) {
    return "Welcome! I'm Agent SIHU, your guide to the Lake Victoria Basin ecosystem.";
  }
  
  return welcome.content + "\n\nWhat would you like to explore?";
}

// Get speech-friendly version of text (remove markdown, format for TTS)
export function getSpeechFriendlyText(text: string): string {
  return text
    .replace(/\*\*/g, "") // Remove bold markers
    .replace(/\*/g, "") // Remove italic markers
    .replace(/•/g, "") // Remove bullet points
    .replace(/\n\n/g, " ") // Convert paragraphs to pauses
    .replace(/\n/g, " ") // Convert newlines to spaces
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}
