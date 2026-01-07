
import { GoogleGenAI } from "@google/genai";
import { EditResult, Resolution, AspectRatio } from "../types";

export const processImageWithGemini = async (
  prompt: string,
  options: {
    base64Data?: string;
    mimeType?: string;
    resolution?: Resolution;
    aspectRatio?: AspectRatio;
    maskBase64?: string;
  }
): Promise<EditResult> => {
  const { base64Data, mimeType, resolution = '1K', aspectRatio = '1:1', maskBase64 } = options;
  
  try {
    let model = 'gemini-2.5-flash-image';
    let imageConfig: any = {
      aspectRatio: aspectRatio
    };
    
    // Switch to Gemini 3 Pro for High Resolution
    if (resolution === '2K' || resolution === '4K') {
      model = 'gemini-3-pro-image-preview';
      imageConfig.imageSize = resolution;

      const win = window as any;
      if (win.aistudio) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
           await win.aistudio.openSelectKey();
           const hasKeyNow = await win.aistudio.hasSelectedApiKey();
           if (!hasKeyNow) {
             throw new Error("API Key selection is required for High Resolution.");
           }
        }
      }
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const parts: any[] = [];
    
    // Add source image if provided (Editing mode)
    if (base64Data && mimeType) {
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
    }

    // Add mask if provided
    if (maskBase64) {
      parts.push({
        inlineData: {
          data: maskBase64,
          mimeType: 'image/png',
        },
      });
    }

    // Add prompt
    const effectivePrompt = maskBase64 
      ? `Apply this change to the masked area: ${prompt}`
      : prompt;
      
    parts.push({ text: effectivePrompt });

    const response = await ai.models.generateContent({
      model: model, 
      contents: { parts },
      config: { imageConfig }
    });

    let result: EditResult = {};

    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
            result.imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          } else if (part.text) {
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
    console.error("Error processing with Gemini:", error);
    throw error;
  }
};

// Deprecated in favor of processImageWithGemini but kept for compatibility if needed
export const editImageWithGemini = (
  base64Data: string,
  mimeType: string,
  prompt: string,
  resolution: Resolution = '1K',
  maskBase64?: string
) => processImageWithGemini(prompt, { base64Data, mimeType, resolution, maskBase64 });
