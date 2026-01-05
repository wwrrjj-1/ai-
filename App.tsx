
import React, { useState } from 'react';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import ResultCard from './components/ResultCard';
import KnowledgeTabs from './components/KnowledgeTabs';
import LoadingState from './components/LoadingState';
import { identifyFlower } from './services/geminiService';
import { FlowerInfo } from './types';

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FlowerInfo | null>(null);

  const handleImageSelect = async (base64: string, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setImageSrc(previewUrl);
    setResult(null);
    setLoading(true);

    try {
      const data = await identifyFlower(base64);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("识别出错了，请稍后重试。");
      setImageSrc(null);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setImageSrc(null);
    setResult(null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-emerald-100">
      <Header onClear={clearAll} />
      
      <main className="flex-1 container mx-auto px-6 py-6 max-w-5xl">
        {!imageSrc && !loading && (
          <div className="flex flex-col items-center pt-16">
            <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
              <div className="inline-block px-3 py-1 bg-emerald-50 text-[#059669] text-[10px] font-bold tracking-widest rounded-full mb-4 uppercase">
                Discover Nature's Code
              </div>
              <h2 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">
                探索自然之美
              </h2>
              <p className="text-lg text-gray-400 max-w-lg mx-auto leading-relaxed">
                利用先进的人工智能技术，只需一张照片，即可解开花卉隐藏的科学秘密与文化底蕴。
              </p>
            </div>
            <UploadZone onImageSelect={handleImageSelect} isLoading={loading} />
          </div>
        )}

        {loading && <LoadingState />}

        {result && imageSrc && (
          <div className="space-y-4 py-4 max-w-4xl mx-auto">
            <ResultCard info={result} imageSrc={imageSrc} />
            <KnowledgeTabs info={result} />
            
            <div className="flex justify-center pt-8 pb-12">
              <button 
                onClick={clearAll}
                className="group relative flex items-center gap-3 px-12 py-3.5 rounded-full bg-black text-white shadow-xl hover:bg-gray-800 transition-all duration-300 font-black text-sm active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-emerald-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 opacity-20"></div>
                <span className="relative z-10">识别下一朵花</span>
                <svg className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-gray-300 text-[9px] font-bold tracking-[0.3em] uppercase border-t border-gray-50 bg-white">
        Botanical Intelligence System &bull; Modern Nature Tech &copy; 2024
      </footer>
    </div>
  );
};

export default App;
