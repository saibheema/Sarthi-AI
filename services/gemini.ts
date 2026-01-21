
import { GoogleGenAI, Type } from "@google/genai";
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

    // Optimized context building
    const systemInstruction = `
      You are "SARATHI the charioteer", a stateful academic mentor.
      
      LONG-TERM MEMORY OF STUDENT:
      ${user.learnedTraits || "No traits learned yet. Observe and adapt to this student."}

      SESSION CONTEXT (PREVIOUS CHATS):
      ${contextSummary || "New session."}

      STRICT RULES:
      - Answer academic queries for Class 1-12 ONLY.
      - Return JSON error { "error": { "code": 403, "message": "..." } } for non-academic content.
      - Use [PROBLEM_START/END], [STEP_1...], and [VISUAL: ...] tags as previously defined.
      - If user asks your name: "I am SARATHI, your charioteer."
      - Act as a personal friend/mentor who remembers past struggles and wins.
    `;

    const contents: any[] = history.slice(-8).map(h => ({
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
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction,
        temperature: 0.6,
      }
    });

    return response.text;
  },

  // Learns about the user from the current conversation
  async learnFromUser(messages: Message[], currentTraits: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const content = messages.map(m => `${m.role}: ${m.text}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on this conversation, update the student's learning profile. 
      Identify their interests, strengths, and areas where they need more help.
      Current Profile: ${currentTraits}
      
      Conversation:
      ${content}
      
      Provide a concise, updated bulleted profile of the student.`,
    });

    return response.text || currentTraits;
  },

  // Generates a lean summary of the session
  async summarizeSession(messages: Message[]): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const content = messages.map(m => `${m.role}: ${m.text}`).join('\n');

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize this academic session in 3-4 sentences. Focus on the core concepts discussed and the student's progress.
      
      Chat:
      ${content}`
    });

    return response.text || "Summary unavailable.";
  },

  async generateImage(prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { 
        parts: [{ 
          text: `Educational diagram for: ${prompt}. White background, clear labels, academic style.` 
        }] 
      },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image generated");
  },

  async researchSubject(subject: string, board: string): Promise<Partial<RagEntry>> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Class 1-12 curriculum for ${subject} (${board}).`,
      config: { tools: [{ googleSearch: {} }] }
    });
    return {
      subject,
      board: board as any,
      content: response.text,
      sourceUrls: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web?.uri).filter(Boolean) || []
    };
  }
};
