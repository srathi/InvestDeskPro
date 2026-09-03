"use client";

import React, { useState, useRef, useEffect } from "react";
import { HelpCircle, ExternalLink, Sparkles, BookOpen } from "lucide-react";
import { UNIVERSAL_GLOSSARY, JargonTerm } from "../data/investDeskKnowledgeBase";

interface JargonTooltipProps {
  termKey?: string;
  title?: string;
  definition?: string;
  formula?: string;
  children?: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  onOpenGuide?: (termKey?: string) => void;
}

export const JargonTooltip: React.FC<JargonTooltipProps> = ({
  termKey,
  title,
  definition,
  formula,
  children,
  position = "top",
  onOpenGuide,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const termData: JargonTerm | undefined = termKey ? UNIVERSAL_GLOSSARY[termKey] : undefined;
  const displayTitle = title || (termData ? termData.term : "Financial Metric");
  const displayDef = definition || (termData ? termData.short_def : "");
  const displayFormula = formula || (termData ? termData.formula : "");

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleOpenFull = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onOpenGuide) {
      onOpenGuide(termKey);
    } else {
      window.dispatchEvent(
        new CustomEvent("open-investdesk-guide", { detail: { term: termKey } })
      );
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case "bottom":
        return "top-full mt-2 left-1/2 -translate-x-1/2";
      case "left":
        return "right-full mr-2 top-1/2 -translate-y-1/2";
      case "right":
        return "left-full ml-2 top-1/2 -translate-y-1/2";
      case "top":
      default:
        return "bottom-full mb-2 left-1/2 -translate-x-1/2";
    }
  };

  return (
    <span className="relative inline-flex items-center" ref={triggerRef}>
      {children ? (
        <span
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className="cursor-help border-b border-dotted border-slate-500 hover:border-cyan-400 transition-colors inline-flex items-center gap-1"
        >
          {children}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className="p-0.5 text-slate-500 hover:text-cyan-400 transition-colors focus:outline-none cursor-pointer"
          title={`Learn about ${displayTitle}`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Floating Micro-Card Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className={`absolute ${getPositionClasses()} z-50 w-72 sm:w-80 p-3.5 bg-slate-950/95 border border-cyan-500/40 rounded-xl shadow-2xl backdrop-blur-md text-left text-xs text-slate-200 transition-all pointer-events-auto select-text`}
          style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.8))" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 gap-2">
            <div className="flex items-center space-x-1.5 overflow-hidden">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <h4 className="font-bold text-white truncate font-mono text-[11px]">
                {displayTitle}
              </h4>
            </div>
            {termData?.acronym && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 border border-slate-700 shrink-0">
                {termData.acronym}
              </span>
            )}
          </div>

          {/* Definition */}
          {displayDef && (
            <p className="mt-2 text-[11px] text-slate-300 leading-relaxed font-normal">
              {displayDef}
            </p>
          )}

          {/* Formula */}
          {displayFormula && (
            <div className="mt-2 bg-slate-900/90 p-2 rounded border border-slate-800 font-mono text-[10px] text-cyan-300 overflow-x-auto">
              <code>{displayFormula}</code>
            </div>
          )}

          {/* Footer Action */}
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono">InvestDesk Pro Playbook</span>
            <button
              type="button"
              onClick={handleOpenFull}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 hover:underline font-mono cursor-pointer"
            >
              <span>Full Guide</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}
    </span>
  );
};
