import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Download, Maximize2, X, Sparkles, RefreshCcw, Eraser, MousePointer2, GripHorizontal } from 'lucide-react';
import { ProcessedImage } from '../types';

interface ComparisonViewProps {
  original: ProcessedImage;
  resultUrl?: string;
  resultText?: string;
  currentPrompt?: string;
  isProcessing: boolean;
  onReset: () => void;
  onUseAsInput: (imageUrl: string) => void;
  onMaskChange: (maskBase64: string | null) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  original,
  resultUrl,
  resultText,
  currentPrompt,
  isProcessing,
  onReset,
  onUseAsInput,
  onMaskChange
}) => {
  const [showFullOriginal, setShowFullOriginal] = useState(false);
  const [showFullGenerated, setShowFullGenerated] = useState(false);
  
  // Masking State
  const [isMaskingMode, setIsMaskingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Draggable Control State
  const [controlPos, setControlPos] = useState<{x: number, y: number} | null>(null);
  const [isDraggingControl, setIsDraggingControl] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);
  const dragStartOffset = useRef<{x: number, y: number}>({ x: 0, y: 0 });

  // Initialize/Resize Canvas
  useEffect(() => {
    if (isMaskingMode && canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const img = container.querySelector('img');
      
      if (img) {
         // Match canvas size to the displayed image size
         canvas.width = img.clientWidth;
         canvas.height = img.clientHeight;
         
         // Clear on init
         const ctx = canvas.getContext('2d');
         if (ctx) {
           ctx.clearRect(0, 0, canvas.width, canvas.height);
         }
      }
    }
    // Reset control position when entering/exiting mask mode
    if (!isMaskingMode) {
      setControlPos(null);
    }
  }, [isMaskingMode, original.previewUrl]);

  // Handle Control Dragging
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
        if (!isDraggingControl || !containerRef.current) return;
        
        e.preventDefault();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Calculate new position relative to container
        let newX = e.clientX - containerRect.left - dragStartOffset.current.x;
        let newY = e.clientY - containerRect.top - dragStartOffset.current.y;
        
        // Simple bounds clamping
        const maxX = containerRect.width - 40; 
        const maxY = containerRect.height - 20;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        setControlPos({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
        setIsDraggingControl(false);
    };

    if (isDraggingControl) {
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    }
    
    return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingControl]);

  const handleDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (controlsRef.current && containerRef.current) {
        const controlsRect = controlsRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        const offsetX = e.clientX - controlsRect.left;
        const offsetY = e.clientY - controlsRect.top;
        
        dragStartOffset.current = { x: offsetX, y: offsetY };
        
        if (!controlPos) {
             setControlPos({
                 x: controlsRect.left - containerRect.left,
                 y: controlsRect.top - containerRect.top
             });
        }
        
        setIsDraggingControl(true);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isMaskingMode) return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveMask();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Calculate scale factor in case the canvas is resized by CSS (e.g. window resize)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineWidth = 20; // This could also be scaled if needed, but fixed px is usually fine for masks
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; // Visual yellow for user
    ctx.globalCompositeOperation = 'source-over';
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearMask = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onMaskChange(null);
      }
    }
  };

  const saveMask = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        tempCtx.fillStyle = 'black';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        tempCtx.globalCompositeOperation = 'source-over';
        tempCtx.drawImage(canvas, 0, 0);
        
        const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 100 || data[i+1] > 100) { 
             data[i] = 255;
             data[i+1] = 255;
             data[i+2] = 255;
             data[i+3] = 255;
          } else {
             data[i] = 0;
             data[i+1] = 0;
             data[i+2] = 0;
             data[i+3] = 255; // Ensure strictly opaque background
          }
        }
        tempCtx.putImageData(imgData, 0, 0);
        
        const base64 = tempCanvas.toDataURL('image/png').split(',')[1];
        onMaskChange(base64);
      }
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = `nanoedit-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative h-[360px]">
        
        {/* Original Image Container */}
        <div className="flex items-center justify-center h-full overflow-hidden relative">
          <div ref={containerRef} className="relative inline-flex max-w-full max-h-full group">
            <div className="absolute top-3 left-3 z-10 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-semibold text-white border border-white/10 shadow-sm flex items-center gap-2">
              <span>ORIGINAL</span>
              {isMaskingMode && <span className="text-banana-400 animate-pulse">● DRAW MASK</span>}
            </div>
            
            {!isMaskingMode && (
              <button 
                onClick={onReset}
                className="absolute top-3 right-3 z-10 p-1.5 bg-black/60 hover:bg-red-500/80 backdrop-blur-md rounded-full text-white border border-white/10 transition-colors shadow-sm"
                title="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            <img 
              src={original.previewUrl} 
              alt="Original" 
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl border border-slate-700 shadow-xl select-none"
            />
            
            {/* Masking Canvas Overlay */}
            {isMaskingMode && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 touch-none cursor-crosshair rounded-xl z-20"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            )}

            {/* Masking Controls Overlay */}
            {isMaskingMode ? (
              <div 
                ref={controlsRef}
                className={`absolute z-30 flex items-center gap-2 bg-black/80 p-1.5 rounded-lg border border-white/10 backdrop-blur-md shadow-xl ${!controlPos ? 'bottom-3 left-1/2 -translate-x-1/2' : ''}`}
                style={controlPos ? { left: controlPos.x, top: controlPos.y, touchAction: 'none' } : {}}
              >
                 <div 
                   className="p-1.5 text-slate-400 hover:text-white cursor-grab active:cursor-grabbing border-r border-white/10 mr-1"
                   onPointerDown={handleDragStart}
                   title="Drag to move"
                 >
                   <GripHorizontal className="w-4 h-4" />
                 </div>

                 <button onClick={clearMask} className="p-1.5 hover:bg-white/10 rounded-md text-white" title="Clear Mask">
                   <Eraser className="w-4 h-4" />
                 </button>
                 <button onClick={() => { setIsMaskingMode(false); clearMask(); }} className="px-2 py-1 bg-red-500/80 hover:bg-red-500 text-white text-xs rounded-md font-medium">
                   Cancel
                 </button>
                 <button onClick={() => setIsMaskingMode(false)} className="px-2 py-1 bg-banana-500 hover:bg-banana-400 text-slate-900 text-xs rounded-md font-bold">
                   Done
                 </button>
              </div>
            ) : (
              /* Toggle Mask Mode Button */
              <button 
                onClick={() => setIsMaskingMode(true)}
                className="absolute bottom-3 left-3 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg text-white group-hover:opacity-100 transition-opacity flex items-center gap-2 border border-white/10"
                title="Select Area to Edit"
              >
                <MousePointer2 className="w-4 h-4 text-banana-400" />
                <span className="text-xs font-medium">Select Area</span>
              </button>
            )}

            {/* Zoom button */}
            {!isMaskingMode && (
              <button 
                onClick={() => setShowFullOriginal(true)}
                className="absolute bottom-3 right-3 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Result Image or Placeholder */}
        <div className="flex items-center justify-center h-full overflow-hidden">
          {resultUrl ? (
            <div className="relative inline-flex max-w-full max-h-full group">
              <div className="absolute top-3 left-3 z-10 px-2 py-0.5 bg-banana-500/90 backdrop-blur-md rounded-full text-[10px] font-bold text-slate-900 border border-banana-400/50 shadow-sm">
                GENERATED
              </div>
              
              {/* Use as Input Button */}
              <button 
                onClick={() => onUseAsInput(resultUrl)}
                className="absolute top-3 right-3 z-20 px-2 py-1 bg-black/60 hover:bg-banana-500/90 hover:text-slate-900 backdrop-blur-md rounded-lg text-[10px] font-semibold text-white border border-white/10 transition-colors shadow-sm flex items-center gap-1.5"
                title="Use this image as the new input"
              >
                <RefreshCcw className="w-3 h-3" />
                Edit This
              </button>

              {/* Prompt Overlay */}
              {currentPrompt && (
                <div className="absolute bottom-12 right-3 z-10 max-w-[150px] md:max-w-[200px] px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-[10px] text-white/90 border border-white/10 shadow-sm truncate">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-banana-400" />
                    <span className="truncate">{currentPrompt}</span>
                  </span>
                </div>
              )}

              <img 
                src={resultUrl} 
                alt="Edited" 
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl border border-slate-700 shadow-xl cursor-zoom-in hover:opacity-95 transition-opacity"
                onClick={() => setShowFullGenerated(true)}
              />
              <button 
                onClick={handleDownload}
                className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-banana-500 hover:bg-banana-400 text-slate-900 font-bold text-xs rounded-lg shadow-lg shadow-banana-500/20 transform hover:-translate-y-1 transition-all z-20"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
            </div>
          ) : (
            // Placeholder / Loading State
            <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shadow-xl flex items-center justify-center">
              <div className="absolute top-3 left-3 z-10 px-2 py-0.5 bg-slate-700/50 backdrop-blur-md rounded-full text-[10px] font-bold text-slate-400 border border-slate-600/50">
                OUTPUT
              </div>

              {isProcessing ? (
                 <div className="flex flex-col items-center p-4 text-center space-y-3 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-banana-400 to-banana-600 animate-spin blur-xl opacity-50 absolute"></div>
                    <div className="relative z-10 w-10 h-10">
                      <svg className="animate-spin text-banana-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <div className="relative z-10">
                      <p className="text-sm font-medium text-white">Thinking...</p>
                      <p className="text-[10px] text-banana-300/70 mt-0.5">Peeling the pixels</p>
                    </div>
                 </div>
              ) : resultText ? (
                <div className="p-4 max-w-sm text-center">
                  <div className="w-10 h-10 mx-auto mb-2 bg-slate-700 rounded-lg flex items-center justify-center">
                    <span className="text-lg">💬</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">Message</h3>
                  <p className="text-slate-300 text-xs leading-relaxed">{resultText}</p>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500">
                   <ArrowRight className="w-6 h-6 mx-auto mb-2 opacity-20" />
                   <p className="text-xs">Your creation will appear here</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal for full original view */}
      {showFullOriginal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setShowFullOriginal(false)}>
           <img src={original.previewUrl} className="max-w-full max-h-full object-contain" alt="Full original" />
           <button className="absolute top-4 right-4 text-white p-2">
             <X className="w-8 h-8" />
           </button>
        </div>
      )}

      {/* Modal for full generated view */}
      {showFullGenerated && resultUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setShowFullGenerated(false)}>
           <img src={resultUrl} className="max-w-full max-h-full object-contain" alt="Full generated" />
           <button className="absolute top-4 right-4 text-white p-2">
             <X className="w-8 h-8" />
           </button>
        </div>
      )}
    </div>
  );
};