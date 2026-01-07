
import React, { useCallback, useState, useRef } from 'react';
import { Upload, Image as ImageIcon, AlertCircle, Camera } from 'lucide-react';
import { ProcessedImage } from '../types';

interface ImageUploadProps {
  onImageSelected: (image: ProcessedImage) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    
    // Validate file size (e.g., max 10MB for high-res camera captures)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large. Please select an image under 10MB.');
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64Data = result.split(',')[1];
      
      onImageSelected({
        previewUrl: result,
        base64Data,
        mimeType: file.type
      });
    };
    reader.onerror = () => {
      setError('Failed to read the image file.');
    };
    reader.readAsDataURL(file);
  }, [onImageSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  return (
    <div className="w-full max-w-lg mx-auto mt-6">
      <div
        className={`
          relative group cursor-pointer
          border-2 border-dashed rounded-3xl p-10
          flex flex-col items-center justify-center text-center
          transition-all duration-300 ease-out
          ${isDragging 
            ? 'border-banana-500 bg-banana-500/10 scale-[1.02]' 
            : 'border-slate-800 bg-slate-900/30 hover:border-banana-500/50 hover:bg-slate-800/50 shadow-2xl backdrop-blur-sm'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        
        <div className="w-16 h-16 mb-6 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-2xl border border-slate-700 group-hover:border-banana-500/50 group-hover:rotate-3">
          <Upload className={`w-8 h-8 ${isDragging ? 'text-banana-400' : 'text-slate-400 group-hover:text-banana-400'}`} />
        </div>

        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-banana-200 transition-colors">
          Upload or Drop Image
        </h3>
        <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6 leading-relaxed">
          Bring your vision to life by starting with an existing photo.
        </p>

        <button
          onClick={(e) => {
            e.stopPropagation();
            cameraInputRef.current?.click();
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-all active:scale-95 group/btn shadow-lg"
        >
          <Camera className="w-4 h-4 text-banana-400 group-hover/btn:scale-110 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-wider">Take Photo</span>
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 animate-shake">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-xs font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};
