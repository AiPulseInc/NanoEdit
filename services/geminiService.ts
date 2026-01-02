import { GoogleGenAI } from "@google/genai";
import { EditResult, Resolution } from "../types";

// Initialize the API client
// Note: process.env.API_KEY is guaranteed to be available in this environment
// We will create a fresh instance if we need to use a user-selected key for Pro models
let ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Edits an image using the Gemini Nano Banana model (gemini-2.5-flash-image)
 * or Gemini 3 Pro for higher resolutions.
 */
export const editImageWithGemini = async (
  base64Data: string,
  mimeType: string,
  prompt: string,
  resolution: Resolution = '1K',
  maskBase64?: string
): Promise<EditResult> => {
  try {
    let model = 'gemini-2.5-flash-image';
    let imageConfig: any = undefined;
    
    // Switch to Gemini 3 Pro for High Resolution
    if (resolution === '2K' || resolution === '4K') {
      model = 'gemini-3-pro-image-preview';
      imageConfig = {
        imageSize: resolution
      };

      // Handle API Key Selection for Pro models
      const win = window as any;
      if (win.aistudio) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
           await win.aistudio.openSelectKey();
           // Re-check after dialog
           const hasKeyNow = await win.aistudio.hasSelectedApiKey();
           if (!hasKeyNow) {
             throw new Error("API Key selection is required for High Resolution editing.");
           }
        }
        // Re-initialize AI with the (potentially new) key environment
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      }
    }

    const parts: any[] = [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
      {
        text: prompt,
      },
    ];

    // If a mask is provided, add it as another image part
    if (maskBase64) {
      parts.splice(1, 0, {
        inlineData: {
          data: maskBase64,
          mimeType: 'image/png', // Masks are generated as PNGs
        },
      });
    }

    const response = await ai.models.generateContent({
      model: model, 
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: imageConfig
      }
    });

    let result: EditResult = {};

    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
            // Found the generated image
            result.imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          } else if (part.text) {
            // Found text output (could be a refusal or explanation)
            result.text = part.text;
          }
        }
      }
    }

    if (!result.imageUrl && !result.text) {
      throw new Error("The model did not return an image or text.");
    }

    return result;

  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};