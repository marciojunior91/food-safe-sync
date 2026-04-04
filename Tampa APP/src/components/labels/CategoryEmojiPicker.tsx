import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Predefined emoji list for food/label categories
const CATEGORY_EMOJIS = [
  // Food categories
  "🥩", "🍗", "🐟", "🦐", "🥚", "🧀", "🥛", "🧈",
  "🥬", "🥕", "🍅", "🧅", "🥔", "🌽", "🍄", "🫘",
  "🍎", "🍊", "🍋", "🍓", "🫐", "🍌", "🥑", "🍇",
  "🍞", "🥖", "🥐", "🍰", "🧁", "🍩", "🍪", "🥧",
  "🍝", "🍕", "🍔", "🌮", "🥗", "🍜", "🍲", "🥘",
  "🍮", "🍦", "🧊", "☕", "🧋", "🍵", "🥤", "🍹",
  // Kitchen & storage
  "❄️", "🔥", "🧊", "📦", "🏷️", "🧃", "🫙", "🍯",
  // General
  "📁", "📂", "⭐", "🏆", "🎯", "✅", "🔖", "🗂️",
];

interface CategoryEmojiPickerProps {
  value?: string;
  onChange: (emoji: string) => void;
  className?: string;
}

export function CategoryEmojiPicker({ value, onChange, className }: CategoryEmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-10 w-10 text-xl p-0", className)}
          type="button"
        >
          {value || "📁"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <p className="text-xs text-muted-foreground mb-2 px-1">Pick an icon for this category</p>
        <div className="grid grid-cols-8 gap-1">
          {CATEGORY_EMOJIS.map((emoji) => (
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
            Clear icon
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
