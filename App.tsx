
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUpload } from './components/ImageUpload';
import { ImageGenerator } from './components/ImageGenerator';
import { ComparisonView } from './components/ComparisonView';
import { PromptInput } from './components/PromptInput';
import { HistoryStrip } from './components/HistoryStrip';
import { processImageWithGemini } from './services/geminiService';
import { ProcessedImage, AppStatus, EditHistoryItem, Resolution, AspectRatio } from './types';
import { AlertTriangle, WifiOff, Sparkles, Upload } from 'lucide-react';

const App: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<ProcessedImage | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [startMode, setStartMode] = useState<'upload' | 'generate'>('upload');
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);
  
  const [history, setHistory] = useState<EditHistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [activeMaskBase64, setActiveMaskBase64] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    setStartMode('upload');
  }, []);

  const handleUseAsInput = useCallback((imageUrl: string) => {
    const base64Data = imageUrl.split(',')[1];
    if (base64Data) {
      setSourceImage({
        previewUrl: imageUrl,
        base64Data: base64Data,
        mimeType: 'image/png'
      });
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

  const executeProcessing = async (prompt: string, options: { res: Resolution, ar?: AspectRatio, isScratch?: boolean }) => {
    if (!isOnline) {
      setErrorMessage("You are currently offline. Please reconnect.");
      return;
    }

    setStatus(AppStatus.PROCESSING);
    setErrorMessage(null);
    setResultText(undefined);

    try {
      // If it's a scratch generation, we pass no sourceImage data
      const result = await processImageWithGemini(prompt, {
        base64Data: options.isScratch ? undefined : sourceImage?.base64Data,
        mimeType: options.isScratch ? undefined : sourceImage?.mimeType,
        resolution: options.res,
        aspectRatio: options.ar,
        maskBase64: activeMaskBase64 || undefined
      });

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

        // If it was from scratch, we set a "Genesis" placeholder as source image 
        // until the user clicks "Edit This"
        if (options.isScratch && !sourceImage) {
          setSourceImage({
            previewUrl: 'GENESIS', // Flag for ComparisonView
            base64Data: '',
            mimeType: 'image/png'
          });
        }
      } else if (result.text) {
        setResultText(result.text);
        setStatus(AppStatus.SUCCESS);
      } else {
        throw new Error("No output received.");
      }
    } catch (error: any) {
      console.error("Processing error:", error);
      setStatus(AppStatus.ERROR);
      setErrorMessage(error.message || "Failed to process. Please try again.");
    }
  };

  return (
    <div className="h-[100dvh] bg-slate-950 flex flex-col font-sans overflow-hidden">
      <Header 
        onInstall={handleInstallClick} 
        showInstall={!!deferredPrompt} 
      />

      {!isOnline && (
        <div className="bg-slate-800 text-slate-300 text-xs py-1 px-4 text-center border-b border-slate-700 flex items-center justify-center gap-2">
          <WifiOff className="w-3 h-3" />
          <span>You are offline. Editing is unavailable.</span>
        </div>
      )}

      <main className="flex-1 flex flex-col p-4 max-w-7xl mx-auto w-full overflow-y-auto">
        {!sourceImage && status !== AppStatus.PROCESSING ? (
          <div className="flex-1 flex flex-col items-center justify-center fade-in py-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-200 to-slate-500 mb-3 tracking-tight">
                AI Vision Laboratory
              </h2>
              <p className="text-sm md:text-base text-slate-400 max-w-md mx-auto leading-relaxed">
                Transform existing photos or manifest new ones from thin air.
              </p>
            </div>
            
            <div className="w-full flex flex-col gap-6">
              {startMode === 'upload' ? (
                <>
                  <ImageUpload onImageSelected={handleImageSelected} />
                  
                  <div className="flex items-center gap-4 w-full max-w-lg mx-auto">
                    <div className="flex-1 h-px bg-slate-800"></div>
                    <span className="text-[10px] font-black text-banana-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-slate-700 shadow-lg shadow-banana-500/5">OR</span>
                    <div className="flex-1 h-px bg-slate-800"></div>
                  </div>

                  <button 
                    onClick={() => setStartMode('generate')}
                    className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-banana-500/30 hover:bg-slate-800/80 transition-all w-full max-w-lg mx-auto group"
                  >
                    <div className="p-2 bg-banana-500/10 rounded-lg group-hover:bg-banana-500/20 transition-colors">
                      <Sparkles className="w-5 h-5 text-banana-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">Create from scratch</p>
                      <p className="text-[10px] text-slate-500">Generate a new image from a text description</p>
                    </div>
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-6">
                   <button 
                    onClick={() => setStartMode('upload')}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-banana-400 transition-colors mx-auto"
                  >
                    <Upload className="w-3 h-3" />
                    Back to Upload
                  </button>
                  <ImageGenerator 
                    onGenerate={(p, r, ar) => executeProcessing(p, { res: r, ar, isScratch: true })} 
                    isLoading={status === AppStatus.PROCESSING} 
                  />
                </div>
              )}
            </div>
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
              original={sourceImage || { previewUrl: '', base64Data: '', mimeType: '' }}
              resultUrl={currentResultUrl}
              resultText={resultText}
              currentPrompt={currentPrompt}
              isProcessing={(status as AppStatus) === AppStatus.PROCESSING}
              onReset={handleReset}
              onUseAsInput={handleUseAsInput}
              onMaskChange={setActiveMaskBase64}
            />

            <HistoryStrip 
              items={history} 
              activeId={activeHistoryId} 
              onSelect={handleHistorySelect} 
            />

            {sourceImage?.previewUrl !== 'GENESIS' && (
              <div className={`${!isOnline ? 'opacity-50 pointer-events-none filter grayscale' : ''}`}>
                <PromptInput 
                  onSubmit={(p, r) => executeProcessing(p, { res: r })} 
                  isLoading={(status as AppStatus) === AppStatus.PROCESSING}
                  onMaskModeSuggestion={!!activeMaskBase64}
                />
              </div>
            )}
            
            {/* Removed redundant status !== AppStatus.PROCESSING check which caused TS error */}
            {sourceImage?.previewUrl === 'GENESIS' && (
              <div className="mt-4 flex flex-col items-center gap-3 animate-fade-in">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Generated Result</p>
                <div className="flex gap-3">
                  <button 
                    onClick={handleReset}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700"
                  >
                    Start Over
                  </button>
                  <button 
                    onClick={() => handleUseAsInput(currentResultUrl!)}
                    className="px-6 py-2 bg-banana-500 hover:bg-banana-400 text-slate-900 text-xs font-bold rounded-xl shadow-lg shadow-banana-500/20"
                  >
                    Edit This Image
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-3 text-center text-slate-600 text-xs border-t border-slate-900 bg-slate-950">
        <p>© {new Date().getFullYear()} NanoEdit by AiPulse.</p>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
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
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
