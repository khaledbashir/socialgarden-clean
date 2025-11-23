import React from 'react';

interface EnhancedPromptButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  title?: string;
  className?: string;
}

export function EnhancedPromptButton({
  onClick,
  disabled = false,
  isLoading = false,
  title = "Enhance your prompt",
  className = ""
}: EnhancedPromptButtonProps) {
  return (
    <>
      <style>{`
        .prompt-enhancer-button.loading .icon-default {
          display: none;
        }
        .prompt-enhancer-button:not(.loading) .icon-loading {
          display: none;
        }
        .prompt-enhancer-button .icon-loading {
          animation: sparkle 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.5) rotate(180deg); opacity: 0.7; }
        }
        .tooltip {
          visibility: hidden;
          opacity: 0;
          transition: opacity 0.2s ease-in-out;
        }
        .group:hover .tooltip {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
      
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={`prompt-enhancer-button group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#2a2a2a] text-white transition-all duration-300 ease-in-out hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed ${
          isLoading ? 'loading' : ''
        } ${className}`}
        title={title}
      >
        <span 
          className="material-symbols-outlined icon-default text-xl text-gray-300"
          style={{ fontVariationSettings: '"FILL" 0' }}
        >
          auto_awesome
        </span>
        <span 
          className="material-symbols-outlined icon-loading text-2xl"
          style={{ color: '#12593A', fontVariationSettings: '"FILL" 0' }}
        >
          spark
        </span>
        
        {/* Tooltip */}
        <div className="tooltip absolute bottom-full mb-2 hidden whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-gray-200 group-hover:block">
          {title}
        </div>
      </button>
    </>
  );
}
