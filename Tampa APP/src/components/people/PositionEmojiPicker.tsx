import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Predefined emoji list for kitchen/food service sub-roles
const POSITION_EMOJIS = [
  // Kitchen & Food
  "👨‍🍳", "👩‍🍳", "🍳", "🔪", "🥘", "🍕", "🍰", "🧁", "🍞", "🥖",
  "☕", "🍵", "🧋", "🥤", "🍹", "🍺",
  // Service & Management
  "📋", "🧹", "🧤", "🎯", "⭐", "🏆", "💼", "📊",
  // People & Roles
  "🧑‍💻", "🤝", "🙋", "💪", "🎓", "🛡️",
  // Food Safety
  "🌡️", "❄️", "🔥", "✅", "🧪", "🧫",
];

interface PositionEmojiPickerProps {
  value?: string;
  onChange: (emoji: string) => void;
  className?: string;
}

export function PositionEmojiPicker({ value, onChange, className }: PositionEmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-10 w-14 text-xl px-2", className)}
          type="button"
        >
          {value || "😀"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <p className="text-xs text-muted-foreground mb-2 px-1">Pick an emoji for this position</p>
        <div className="grid grid-cols-8 gap-1">
          {POSITION_EMOJIS.map((emoji) => (
            <Button
              key={emoji}
              variant={value === emoji ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0 text-lg"
              type="button"
              onClick={() => {
                onChange(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </Button>
          ))}
        </div>
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs text-muted-foreground"
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            Clear emoji
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
