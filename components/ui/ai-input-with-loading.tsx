"use client";

import { CornerRightUp } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/components/hooks/use-auto-resize-textarea";

interface AIInputWithLoadingProps {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  loadingDuration?: number;
  onSubmit?: (value: string) => void | Promise<void>;
  className?: string;
}

export function AIInputWithLoading({
  id = "ai-input",
  placeholder = "Skriv en kommentar…",
  minHeight = 44,
  maxHeight = 160,
  loadingDuration = 1500,
  onSubmit,
  className,
}: AIInputWithLoadingProps) {
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight, maxHeight });

  const handleSubmit = async () => {
    if (!inputValue.trim() || submitted) return;
    setSubmitted(true);
    await onSubmit?.(inputValue);
    setInputValue("");
    adjustHeight(true);
    setTimeout(() => setSubmitted(false), loadingDuration);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Textarea
        id={id}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-2xl bg-muted/50 border border-border/50 pl-4 pr-12 py-3",
          "placeholder:text-muted-foreground text-sm resize-none leading-snug",
          "focus-visible:ring-1 focus-visible:ring-pitch/40 focus-visible:border-pitch/40"
        )}
        ref={textareaRef}
        value={inputValue}
        onChange={(e) => { setInputValue(e.target.value); adjustHeight(); }}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
        disabled={submitted}
      />
      <button
        onClick={handleSubmit}
        disabled={submitted || !inputValue.trim()}
        className={cn(
          "absolute right-3 bottom-3 w-7 h-7 rounded-xl flex items-center justify-center transition-all",
          inputValue.trim() && !submitted ? "bg-pitch text-white" : "bg-muted text-muted-foreground"
        )}
        type="button"
      >
        {submitted ? (
          <div className="w-3.5 h-3.5 rounded-sm bg-current animate-spin" style={{ animationDuration: "2s" }} />
        ) : (
          <CornerRightUp className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
