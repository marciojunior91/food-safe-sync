/**
 * ReactionPicker - Emoji reaction selector
 * Displays available reaction emojis with labels
 */

import { useEffect, useRef } from 'react';

interface ReactionPickerProps {
  onSelect: (reactionType: string) => void;
  onClose: () => void;
}

const reactions = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'celebrate', emoji: '🎉', label: 'Celebrate' },
  { type: 'support', emoji: '🙌', label: 'Support' },
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'clap', emoji: '👏', label: 'Clap' },
  { type: 'check', emoji: '✅', label: 'Check' },
  { type: 'eyes', emoji: '👀', label: 'Eyes' },
];

export default function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex gap-1 z-50"
    >
      {reactions.map((reaction) => (
        <button
          key={reaction.type}
          onClick={() => onSelect(reaction.type)}
          className="group relative p-2 hover:bg-gray-100 rounded transition-colors"
          title={reaction.label}
        >
          <span className="text-2xl">{reaction.emoji}</span>
          
          {/* Tooltip */}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {reaction.label}
          </span>
        </button>
      ))}
    </div>
  );
}
