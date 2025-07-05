
import { GoogleGenAI } from "@google/genai";
import { ExtractedData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper function to convert File to base64
const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                resolve(''); // Should not happen with readAsDataURL
            }
        };
        reader.readAsDataURL(file);
    });
    const base64EncodedData = await base64EncodedDataPromise;
    return {
        inlineData: {
            data: base64EncodedData,
            mimeType: file.type,
        },
    };
};

export const extractDataFromFile = async (file: File, userPrompt: string): Promise<ExtractedData> => {
    const model = 'gemini-2.5-flash-preview-04-17';

    const systemInstruction = `You are an expert data extraction API.
    Your task is to analyze the provided file (image or PDF) and extract structured data based on the user's request.
    The user will describe the data they want to extract.
    You MUST return the extracted data as a JSON array of objects.
    Each object in the array represents a single record or item.
    The keys of the objects should be consistent across all items.
    Do NOT return any text, explanation, or markdown formatting before or after the JSON array. Your entire response must be the JSON data itself.`;
    
    const imagePart = await fileToGenerativePart(file);
    const textPart = { text: userPrompt };

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [textPart, imagePart] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            },
        });
        
        let jsonStr = response.text.trim();
        
        // Remove potential markdown fences
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        try {
            const parsedData = JSON.parse(jsonStr);
            if (Array.isArray(parsedData)) {
                return parsedData;
            } else {
                 throw new Error("AI returned data in a non-array format. Please check your prompt and try again.");
            }
        } catch (e) {
            console.error("Failed to parse JSON response:", e, "Raw response:", jsonStr);
            throw new Error("The AI returned an invalid data structure. Please try again or refine your prompt for a clearer structure.");
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to communicate with the AI service. Please check your connection and API key.");
    }
};
