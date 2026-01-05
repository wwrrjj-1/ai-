
import React, { useRef, useState } from 'react';

interface UploadZoneProps {
  onImageSelect: (base64: string, file: File) => void;
  isLoading: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onImageSelect, isLoading }) => {
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result?.toString().split(',')[1];
      if (base64) {
        onImageSelect(base64, file);
      }
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovered(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className={`relative w-full max-w-2xl aspect-[16/9] mx-auto rounded-3xl transition-all duration-300 group ${
        isHovered ? 'bg-emerald-50/50 scale-[1.01]' : 'bg-white'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsHovered(true); }}
      onDragLeave={() => setIsHovered(false)}
      onDrop={onDrop}
    >
      <input 
        type="file" 
        ref={inputRef}
        className="hidden" 
        accept="image/*"
        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
      />
      
      <div 
        onClick={() => !isLoading && inputRef.current?.click()}
        className={`w-full h-full border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-colors duration-300 ${
          isHovered ? 'border-[#059669]' : 'border-gray-200'
        }`}
      >
        <div className={`mb-4 p-4 rounded-full transition-transform duration-500 ${isHovered ? 'translate-y-[-8px] bg-emerald-100 text-[#059669]' : 'bg-gray-50 text-gray-400'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        </div>
        
        <h3 className="text-xl font-medium text-gray-700 mb-2">
          {isLoading ? '正在识别中...' : '点击或拖拽上传花卉图片'}
        </h3>
        <p className="text-gray-400 text-sm">支持 JPG, PNG, WebP 格式</p>
      </div>
    </div>
  );
};

export default UploadZone;
