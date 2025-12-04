import { GoogleGenAI, Type } from "@google/genai";
import { AppEvent, HelpService } from '../types';

// ВСТАВЬТЕ ВАШ API KEY СЮДА (внутри кавычек), если деплоите на свой хостинг.
// Получить ключ: https://aistudio.google.com/app/apikey
// Если оставить пустым, поиск работать не будет (или будет брать из env, если настроено).
const MANUAL_API_KEY = "AIzaSyDmAPQkMU-mAEsmDOLZu1Vm1efPxnAvgTk"; 

const apiKey = process.env.API_KEY || MANUAL_API_KEY;

// Initialize Gemini client safely
let ai: GoogleGenAI | null = null;
try {
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  }
} catch (e) {
  console.error("Failed to initialize GoogleGenAI", e);
}

export interface SearchResult {
  relevantEventIds: string[];
  relevantHelpIds: string[];
  reasoning: string;
}

export const searchWithGemini = async (
  userQuery: string, 
  currentEvents: AppEvent[], 
  currentHelp: HelpService[]
): Promise<SearchResult> => {
  if (!ai) {
    console.warn("API Key missing, returning empty search");
    return { relevantEventIds: [], relevantHelpIds: [], reasoning: "Поиск временно недоступен (API ключ не настроен)." };
  }

  // Prepare context from dynamic data
  const context = {
    events: currentEvents.map(e => ({ 
      id: e.id, 
      title: e.title, 
      desc: e.description, 
      category: e.category, 
      district: e.district, 
      date: e.date 
    })),
    help: currentHelp.map(h => ({ 
      id: h.id, 
      org: h.orgName, 
      type: h.helpType, 
      desc: h.description, 
      district: h.district 
    }))
  };

  const modelId = "gemini-2.5-flash"; // Fast and capable for this task

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `
        You are a helpful assistant for people with disabilities in Moscow.
        Here is the current database of events and help services:
        ${JSON.stringify(context)}

        The user asks: "${userQuery}"

        Analyze the user's request. Find the IDs of the items that best match their need.
        Be smart about synonyms (e.g., "fun" -> Events, "lawyer" -> Legal Help, "wheelchair repair" -> Tech Help).
        Return a JSON object with lists of IDs and a short reasoning message in Russian.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            relevantEventIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            relevantHelpIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            reasoning: {
              type: Type.STRING,
              description: "A short, encouraging message explaining why these were chosen (in Russian)."
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as SearchResult;
    }
    throw new Error("Empty response from Gemini");

  } catch (error) {
    console.error("Gemini Search Error:", error);
    return { relevantEventIds: [], relevantHelpIds: [], reasoning: "Произошла ошибка при поиске. Попробуйте ручные фильтры." };
  }
};
