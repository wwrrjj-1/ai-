
import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <div className="w-full max-w-2xl mx-auto mt-12 text-center">
      <div className="relative inline-block mb-6">
        <div className="w-16 h-16 border-4 border-emerald-100 border-t-[#059669] rounded-full animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600">
          ✨
        </div>
      </div>
      <p className="text-gray-500 text-lg font-medium animate-pulse">
        AI 正在从植物图谱中为您寻找答案...
      </p>
    </div>
  );
};

export default LoadingState;
