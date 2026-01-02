import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { ProcessedImage } from '../types';

interface ImageUploadProps {
  onImageSelected: (image: ProcessedImage) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    
    // Validate file size (e.g., max 5MB for responsiveness)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large. Please select an image under 5MB.');
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Extract base64 data (remove data:image/xxx;base64, prefix)
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
          border-2 border-dashed rounded-2xl p-8
          flex flex-col items-center justify-center text-center
          transition-all duration-300 ease-out
          ${isDragging 
            ? 'border-banana-500 bg-banana-500/10 scale-[1.02]' 
            : 'border-slate-700 bg-slate-800/30 hover:border-banana-400/50 hover:bg-slate-800/50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileChange}
        />
        
        <div className="w-14 h-14 mb-4 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl border border-slate-700 group-hover:border-banana-500/30">
          <Upload className={`w-7 h-7 ${isDragging ? 'text-banana-400' : 'text-slate-400 group-hover:text-banana-400'}`} />
        </div>

        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-banana-200">
          Upload an image to edit
        </h3>
        <p className="text-slate-400 text-xs max-w-xs mx-auto">
          Drag and drop your photo here, or click to browse.
          <br />
          <span className="text-slate-500 text-[10px] mt-1 block">Supports JPEG, PNG, WebP</span>
        </p>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      {/* Example suggestion for users */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 opacity-50 pointer-events-none filter grayscale select-none">
         {/* Visual filler to show the user what it might look like */}
         <div className="h-20 bg-slate-800/50 rounded-lg"></div>
         <div className="h-20 bg-slate-800/50 rounded-lg"></div>
         <div className="h-20 bg-slate-800/50 rounded-lg"></div>
      </div>
    </div>
  );
};