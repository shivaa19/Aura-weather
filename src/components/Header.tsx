import React from 'react';

interface HeaderProps {
  title?: string;
  onMenuClick: () => void;
  onSearchClick: () => void;
  onAiStudioClick?: () => void;
  activeTab?: string;
  onCloseClick?: () => void;
  showShare?: boolean;
  onShareClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Aura Weather',
  onMenuClick,
  onSearchClick,
  onAiStudioClick,
  activeTab,
  onCloseClick,
  showShare = false,
  onShareClick,
}) => {
  if (onCloseClick) {
    return (
      <header className="fixed top-0 w-full bg-[#121212]/90 backdrop-blur-md text-[#F0F0F0] flex justify-between items-center px-6 h-16 z-50 border-b border-white/10 shadow-lg transition-all duration-300">
        <div className="flex items-center gap-3">
          <button
            onClick={onCloseClick}
            className="p-2 hover:bg-white/10 rounded-full transition-all text-[#F0F0F0] cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <div>
            <span className="text-[9px] tracking-[0.25em] uppercase font-bold text-[#FF3E00] block">
              COLLECTIVE — ALERT
            </span>
            <span className="font-serif italic text-lg md:text-xl font-medium text-[#F0F0F0]">
              {title}
            </span>
          </div>
        </div>
        {showShare && (
          <button
            onClick={onShareClick}
            className="flex items-center gap-2 bg-[#FF3E00] text-black px-4 py-2 rounded-full font-label-caps text-xs font-bold active:scale-95 hover:bg-white transition-all shadow-lg cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">share</span>
            SHARE ALERT
          </button>
        )}
      </header>
    );
  }

  return (
    <header className="fixed top-0 w-full flex justify-between items-center px-6 h-16 z-50 bg-[#0F0F0F]/85 backdrop-blur-md border-b border-white/10 shadow-md transition-all duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="material-symbols-outlined text-[#FF3E00] hover:bg-white/10 p-2 rounded-full transition-colors cursor-pointer"
          aria-label="Menu"
        >
          menu
        </button>
        <div className="flex flex-col">
          <span className="text-[9px] tracking-[0.25em] uppercase font-bold text-[#FF3E00] leading-none mb-0.5">
            COLLECTIVE — METEO
          </span>
          <h1 className="font-serif italic text-xl md:text-2xl font-normal text-[#F0F0F0] leading-none">
            {title}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onAiStudioClick && (
          <button
            id="open-ai-studio-header-btn"
            onClick={onAiStudioClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#809fff]/40 bg-[#809fff]/10 hover:bg-[#809fff]/20 text-xs text-[#809fff] font-medium transition-all cursor-pointer shadow-sm"
            aria-label="AI Studio"
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider font-bold">AI Studio</span>
          </button>
        )}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 hover:border-[#FF3E00]/60 bg-white/5 hover:bg-white/10 text-xs text-[#F0F0F0] transition-all cursor-pointer"
          aria-label="Search"
        >
          <span className="material-symbols-outlined text-[#FF3E00] text-base">search</span>
          <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider text-gray-400">Search City</span>
        </button>
      </div>
    </header>
  );
};
