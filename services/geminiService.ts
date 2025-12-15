import { GoogleGenAI, Type } from "@google/genai";
import { AISongSuggestion } from "../types";

// Ensure API Key is treated as a string to prevent TS errors during build
const apiKey = process.env.API_KEY as string;
const ai = new GoogleGenAI({ apiKey: apiKey });

export const getLiturgicalSuggestions = async (
  liturgyName: string,
  focus: string
): Promise<AISongSuggestion[]> => {
  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      Você é um especialista em música litúrgica católica.
      Eu preciso de sugestões de músicas para uma celebração: "${liturgyName}".
      O foco litúrgico ou tempo é: "${focus}".
      
      Por favor, sugira músicas apropriadas para os momentos principais da missa (Entrada, Ofertório, Comunhão, etc.).
      Dê preferência a músicas populares na igreja católica brasileira.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: "Você é um assistente útil para coordenadores de pastoral da música.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              part: {
                type: Type.STRING,
                description: "O momento litúrgico (Ex: Entrada, Comunhão)",
              },
              title: {
                type: Type.STRING,
                description: "Título da música",
              },
              artist: {
                type: Type.STRING,
                description: "Compositor ou intérprete conhecido",
              },
              reasoning: {
                type: Type.STRING,
                description: "Uma breve explicação litúrgica do porquê essa música serve para este momento e tempo.",
              },
            },
            required: ["part", "title", "artist", "reasoning"],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AISongSuggestion[];
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar sugestões:", error);
    throw new Error("Falha ao conectar com o serviço de IA.");
  }
};