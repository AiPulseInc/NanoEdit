import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUpload } from './components/ImageUpload';
import { ComparisonView } from './components/ComparisonView';
import { PromptInput } from './components/PromptInput';
import { HistoryStrip } from './components/HistoryStrip';
import { editImageWithGemini } from './services/geminiService';
import { ProcessedImage, AppStatus, EditHistoryItem, Resolution } from './types';
import { AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<ProcessedImage | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  
  // History Management
  const [history, setHistory] = useState<EditHistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  
  // Masking
  const [activeMaskBase64, setActiveMaskBase64] = useState<string | null>(null);
  
  // Non-history results (text messages/errors)
  const [resultText, setResultText] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Derived state for the current view
  const activeHistoryItem = history.find(item => item.id === activeHistoryId);
  const currentResultUrl = activeHistoryItem?.imageUrl;
  const currentPrompt = activeHistoryItem?.prompt;

  const handleImageSelected = useCallback((image: ProcessedImage) => {
    setSourceImage(image);
    setStatus(AppStatus.IDLE);
    setHistory([]);
    setActiveHistoryId(null);
    setResultText(undefined);
    setErrorMessage(null);
    setActiveMaskBase64(null);
  }, []);

  const handleReset = useCallback(() => {
    setSourceImage(null);
    setStatus(AppStatus.IDLE);
    setHistory([]);
    setActiveHistoryId(null);
    setResultText(undefined);
    setErrorMessage(null);
    setActiveMaskBase64(null);
  }, []);

  const handleUseAsInput = useCallback((imageUrl: string) => {
    // Extract base64 from data URL
    const base64Data = imageUrl.split(',')[1];
    if (base64Data) {
      setSourceImage({
        previewUrl: imageUrl,
        base64Data: base64Data,
        mimeType: 'image/png' // Generated images are PNG
      });
      // Reset history as we are starting a new chain
      setHistory([]);
      setActiveHistoryId(null);
      setResultText(undefined);
      setActiveMaskBase64(null);
    }
  }, []);

  const handleHistorySelect = (item: EditHistoryItem) => {
    setActiveHistoryId(item.id);
    setResultText(undefined); 
    setErrorMessage(null);
  };

  const handlePromptSubmit = async (prompt: string, resolution: Resolution) => {
    if (!sourceImage) return;

    setStatus(AppStatus.PROCESSING);
    setErrorMessage(null);
    setResultText(undefined);

    try {
      // Use active mask if available
      const maskToSend = activeMaskBase64 || undefined;

      const result = await editImageWithGemini(
        sourceImage.base64Data,
        sourceImage.mimeType,
        prompt,
        resolution,
        maskToSend
      );

      if (result.imageUrl) {
        const newItem: EditHistoryItem = {
          id: Date.now().toString(),
          imageUrl: result.imageUrl,
          prompt: prompt,
          timestamp: Date.now()
        };
        
        setHistory(prev => [...prev, newItem]);
        setActiveHistoryId(newItem.id);
        setStatus(AppStatus.SUCCESS);
      } else if (result.text) {
        setResultText(result.text);
        setStatus(AppStatus.SUCCESS);
      } else {
        throw new Error("No valid output received from the model.");
      }
    } catch (error: any) {
      console.error("Processing error:", error);
      setStatus(AppStatus.ERROR);
      setErrorMessage(error.message || "Failed to process image. Please try again.");
    }
  };

  return (
    <div className="h-[100dvh] bg-slate-950 flex flex-col font-sans overflow-hidden">
      <Header />

      <main className="flex-1 flex flex-col p-4 max-w-7xl mx-auto w-full overflow-y-auto">
        {!sourceImage ? (
          <div className="flex-1 flex flex-col items-center justify-center fade-in py-8">
            <div className="text-center mb-4">
              <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-2">
                Reimagine Your Photos
              </h2>
              <p className="text-base text-slate-400 max-w-xl mx-auto">
                Upload an image and tell Nano Banana what to change.
              </p>
            </div>
            <ImageUpload onImageSelected={handleImageSelected} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-3 animate-fade-in-up h-full justify-start pt-2">
            
            {status === AppStatus.ERROR && errorMessage && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-center gap-2 animate-shake text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            <ComparisonView 
              original={sourceImage}
              resultUrl={currentResultUrl}
              resultText={resultText}
              currentPrompt={currentPrompt}
              isProcessing={status === AppStatus.PROCESSING}
              onReset={handleReset}
              onUseAsInput={handleUseAsInput}
              onMaskChange={setActiveMaskBase64}
            />

            <HistoryStrip 
              items={history} 
              activeId={activeHistoryId} 
              onSelect={handleHistorySelect} 
            />

            <PromptInput 
              onSubmit={handlePromptSubmit} 
              isLoading={status === AppStatus.PROCESSING}
              onMaskModeSuggestion={!!activeMaskBase64}
            />
          </div>
        )}
      </main>

      <footer className="py-3 text-center text-slate-600 text-xs border-t border-slate-900 bg-slate-950">
        <p>© {new Date().getFullYear()} NanoEdit.</p>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default App;