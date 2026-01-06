
import React from 'react';
import { FlowerInfo } from '../types';

interface ResultCardProps {
  info: FlowerInfo;
  imageSrc: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ info, imageSrc }) => {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row animate-in fade-in duration-700">
      {/* 增强视觉效果的图片区域 */}
      <div className="w-full md:w-[42%] bg-gray-50 aspect-[4/3] md:aspect-auto relative overflow-hidden group">
        <img
          src={imageSrc}
          alt={info.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 rounded-full bg-black/30 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase">
            Captured
          </span>
        </div>
      </div>

      {/* 优化后的核心信息区 */}
      <div className="flex-1 p-6 md:p-8 flex flex-col justify-center min-w-0 bg-white">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-3xl font-black text-gray-900 leading-none mb-2">
              {info.name}
            </h2>
            <p className="text-sm text-gray-400 font-serif italic tracking-widest opacity-80 mt-1">
              {info.scientificName}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter mb-0.5">Confidence</span>
            <span className="px-2 py-1 rounded-lg bg-emerald-50 text-[#059669] text-xs font-black">
              {(info.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="w-12 h-1 bg-emerald-100 mb-4 rounded-full"></div>

        <p className="text-gray-600 text-base leading-7 font-sans tracking-wide text-justify opacity-90">
          {info.description}
        </p>
      </div>
    </div>
  );
};

export default ResultCard;
