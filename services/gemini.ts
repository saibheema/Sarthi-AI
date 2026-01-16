
import { GoogleGenAI } from "@google/genai";
import { BotSettings, Message, UserProfile, RagEntry } from "../types";

export const geminiService = {
  async chat(
    message: string, 
    history: Message[], 
    settings: BotSettings, 
    user: UserProfile,
    image?: string,
    contextSummary?: string
  ) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const botIdentity = user.customBotName || settings.name;
    const botPersona = user.currentPersonality || settings.personality;

    const systemInstruction = `
      You are "${botIdentity}", a friendly and brilliant academic mentor for students in India (CBSE, Andhra Pradesh, and Telangana boards) from Class 1 to Class 12.
      
      CORE RULES:
      1. ALL SUBJECTS: You support ALL academic subjects (Mathematics, Science, Social Studies, Languages, etc.). Do not limit yourself or mention you only do specific subjects.
      2. BE FRIENDLY: Your tone should be supportive, like a mentor or a knowledgeable friend. 
      3. NO INTRODUCTORY FLUFF: Do not say "Namaste", "Hello", or "I specialize in...". Start immediately with the solution or brainstorming.
      
      A2UI VISUAL PROTOCOL (Mandatory for Solutions):
      For any academic problem or concept explanation, use these structured blocks so the UI can render them as visual cards:

      [PROBLEM_START]
      The specific question or topic we are addressing.
      [PROBLEM_END]

      [STEP_1: TITLE]
      A clear, friendly explanation of the first step.
      [FORMULA] key-equation-or-concept-here [FORMULA_END]
      [STEP_END]

      [STEP_2: TITLE]
      ... (repeat for all steps)
      [STEP_END]

      [CONCLUSION_START]
      The final takeaway or answer in bold.
      [CONCLUSION_END]

      Formatting for non-math subjects:
      Use [STEP] blocks to break down history events, grammar rules, or scientific concepts into visual logical parts.

      BEHAVIOR:
      - Trilingual: Respond in the language used by the student (English, Hindi, or Telugu).
      - Strict Scope: Ignore non-student/non-academic chatter.
      - Image Analysis: If a student uploads a textbook page, identify the problem and solve it using A2UI.

      CONTEXT:
      - Memory/RAG: ${contextSummary || "New interaction."}
      - Student Info: ${user.name}, Grade ${user.schoolContext?.currentGrade || 'N/A'}.
    `;

    const contents: any[] = history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    const currentParts: any[] = [{ text: message }];
    if (image) {
      currentParts.push({
        inlineData: { mimeType: "image/jpeg", data: image.split(",")[1] }
      });
    }

    contents.push({ role: "user", parts: currentParts });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text;
  },

  async researchSubject(subject: string, board: string): Promise<Partial<RagEntry>> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Provide a detailed curriculum breakdown and common solved problems for ${subject} in the ${board} board (Class 1-12). Include key definitions and step-by-step examples.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web?.uri)
      .filter(Boolean) || [];

    return {
      subject,
      board: board as any,
      content: response.text,
      sourceUrls: Array.from(new Set(urls))
    };
  },

  async summarize(messages: Message[]): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const textToSummarize = messages.map(m => `${m.role}: ${m.text}`).join("\n");
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize this academic chat for quick context retrieval in future sessions:\n\n${textToSummarize}`,
      config: { temperature: 0.3 }
    });
    
    return response.text || "Context summary unavailable.";
  }
};
