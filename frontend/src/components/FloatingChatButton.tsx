"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface FloatingChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function FloatingChatButton({ onClick, isOpen }: FloatingChatButtonProps) {
  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        type="button"
        onClick={onClick}
        className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#0d1c3a] via-[#09152e] to-[#080d1a] hover:from-[#11244a] hover:to-[#0d162b] text-white border border-amber-500/50 hover:border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:shadow-[0_0_40px_rgba(245,158,11,0.45)] backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        title="Ask AlphaChanakya AI Quantitative Copilot (Press 'Cmd+J')"
      >
        {/* Animated Pulse Ring */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
        </span>

        <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-inner group-hover:scale-110 transition-transform duration-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
        </div>

        <div className="text-left">
          <div className="text-xs font-extrabold text-white tracking-tight flex items-center gap-1.5 font-sans">
            <span>AlphaChanakya</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
              AI
            </span>
          </div>
          <div className="text-[10px] text-cyan-300/80 font-mono font-medium">
            Quantitative Copilot
          </div>
        </div>

        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 text-amber-300 border border-amber-800/80 rounded-md shadow-inner hidden sm:inline">
          ⌘J
        </span>
      </button>
    </div>
  );
}
