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
    <div className="fixed bottom-20 sm:bottom-5 right-4 sm:right-5 z-40">
      <button
        type="button"
        onClick={onClick}
        className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 hover:from-cyan-500 hover:to-indigo-600 text-white shadow-2xl shadow-cyan-600/30 border border-cyan-400/40 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
        title="Ask AlphaChanakya AI Quantitative Copilot (Press 'Cmd+J')"
      >
        {/* Animated Pulse Ring */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400" />
        </span>

        <div className="w-6 h-6 rounded-lg bg-black/30 flex items-center justify-center text-amber-300 shadow-inner group-hover:scale-110 transition-transform duration-300">
          <Sparkles className="w-3.5 h-3.5" />
        </div>

        <div className="text-left">
          <div className="text-xs font-bold font-sans tracking-tight flex items-center gap-1.5">
            <span>AlphaChanakya</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
              AI
            </span>
          </div>
          <div className="text-[10px] text-cyan-200/80 font-mono">
            Quantitative Copilot
          </div>
        </div>

        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-black/40 text-cyan-200 border border-cyan-400/30 rounded-md shadow-inner hidden sm:inline">
          ⌘J
        </span>
      </button>
    </div>
  );
}
