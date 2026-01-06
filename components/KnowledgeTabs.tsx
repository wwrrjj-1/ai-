
import React, { useState } from 'react';
import { FlowerInfo, TabKey, TabConfig } from '../types';

interface KnowledgeTabsProps {
  info: FlowerInfo;
}

const TABS: TabConfig[] = [
  { key: 'care', label: '养护指南' },
  { key: 'poetry', label: '文学意象' },
  { key: 'botany', label: '形态特征' },
  { key: 'culture', label: '文化内涵' },
];

const KnowledgeTabs: React.FC<KnowledgeTabsProps> = ({ info }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('care');

  // 渲染统一样式的文本块
  const renderTextBlock = (content: string) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest opacity-70">Description</span>
      </div>
      <p className="text-gray-700 text-base leading-8 tracking-wide text-justify font-sans first-letter:text-xl first-letter:font-bold first-letter:text-emerald-700 first-letter:mr-0.5">
        {content}
      </p>
    </div>
  );

  // 严格对齐的养护列表
  const renderCareItems = () => {
    // 新API返回的是对象格式 {water, sunlight, soil, temperature}
    const careObj = typeof info.care === 'string'
      ? null // 如果是旧格式的字符串，退化处理
      : info.care;

    if (careObj && typeof careObj === 'object') {
      // 新格式：对象
      const careItems = [
        { label: '水分', value: careObj.water || '适量浇水' },
        { label: '阳光', value: careObj.sunlight || '充足光照' },
        { label: '土壤', value: careObj.soil || '疏松透气' },
        { label: '温度', value: careObj.temperature || '适宜温暖' },
      ];

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 px-1">
          {careItems.map((item, i) => (
            <div key={i} className="flex items-start group hover:bg-emerald-50/50 p-2 rounded-lg transition-colors -mx-1.5">
              <div className="w-16 flex-shrink-0 flex items-center gap-1.5 pt-0.5">
                <div className="w-1 h-3 bg-emerald-400 rounded-full group-hover:h-3.5 transition-all duration-300"></div>
                <span className="text-sm font-bold text-emerald-700">{item.label}</span>
              </div>
              <span className="flex-1 text-base text-gray-700 leading-relaxed pt-0.5">{item.value}</span>
            </div>
          ))}
        </div>
      );
    }

    // 旧格式：字符串（兜底处理）
    const lines = typeof info.care === 'string'
      ? info.care.split('\n').filter(l => l.trim().length > 0)
      : [];
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 px-1">
        {lines.map((line, i) => {
          const colonIndex = line.indexOf('：') !== -1 ? line.indexOf('：') : line.indexOf(':');
          let label = "要点";
          let value = line;

          if (colonIndex !== -1) {
            label = line.substring(0, colonIndex).trim();
            value = line.substring(colonIndex + 1).trim();
          }

          return (
            <div key={i} className="flex items-start group hover:bg-emerald-50/50 p-2 rounded-lg transition-colors -mx-1.5">
              <div className="w-16 flex-shrink-0 flex items-center gap-1.5 pt-0.5">
                <div className="w-1 h-3 bg-emerald-400 rounded-full group-hover:h-3.5 transition-all duration-300"></div>
                <span className="text-sm font-bold text-gray-800 whitespace-nowrap">{label}</span>
              </div>
              <div className="flex-1 pl-3 border-l border-emerald-100/50">
                <span className="text-base text-gray-600 leading-snug font-medium tracking-wide block">{value}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-4">
      {/* 极简高级感的 Tab 切换 */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex p-1 bg-gray-50 rounded-xl border border-gray-100 shadow-inner">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${activeTab === tab.key
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-500'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 固定高度显示区域 (Standard height with optimized typography) */}
      <div className="bg-white rounded-2xl border border-gray-50 p-6 h-[160px] relative overflow-hidden shadow-sm">
        <div className="h-full overflow-y-auto custom-scrollbar pr-2">
          <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-500">

            {activeTab === 'care' && renderCareItems()}

            {activeTab === 'poetry' && (
              <div className="flex flex-col justify-center h-full py-4 bg-emerald-50/30 rounded-xl relative overflow-hidden px-8 md:px-12">
                <div className="absolute top-2 left-4 text-4xl text-emerald-100 font-serif opacity-50 select-none">“</div>

                <div className="w-full flex flex-col gap-3 relative z-10">
                  {(() => {
                    // split by common delimiters
                    const parts = info.poetry.split(/[,，。;\n]/).filter(s => s.trim().length > 0);
                    if (parts.length >= 2) {
                      return (
                        <>
                          <p className="text-lg md:text-xl font-serif text-emerald-900 tracking-[0.2em] leading-relaxed text-left self-start pl-4 md:pl-8">
                            {parts[0]}
                          </p>
                          <p className="text-lg md:text-xl font-serif text-emerald-900 tracking-[0.2em] leading-relaxed text-right self-end pr-4 md:pr-8">
                            {parts[1]}
                          </p>
                        </>
                      );
                    } else {
                      return (
                        <p className="text-lg md:text-xl font-serif text-emerald-900 tracking-[0.2em] leading-relaxed text-center">
                          {info.poetry}
                        </p>
                      );
                    }
                  })()}
                </div>

                <div className="absolute bottom-2 right-4 text-4xl text-emerald-100 font-serif opacity-50 select-none transform rotate-180">“</div>
              </div>
            )}

            {activeTab === 'botany' && renderTextBlock(info.botany)}

            {activeTab === 'culture' && renderTextBlock(info.culture)}

          </div>
        </div>
        {/* 底部渐变引导滚动 */}
        <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ecfdf5; border-radius: 20px; border: 1px solid #d1fae5; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1fae5; }
      `}</style>
    </div>
  );
};

export default KnowledgeTabs;
