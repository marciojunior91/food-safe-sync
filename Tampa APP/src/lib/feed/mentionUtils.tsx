/**
 * Mention rendering utilities
 * Converts @[Name](id) format to styled React elements
 */

import React from 'react';

/**
 * Render text with styled mentions (Instagram-style)
 * Converts: "@[John Doe](uuid)" → styled badge
 */
export function renderMentionsInText(text: string): React.ReactNode {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add styled mention
    const name = match[1];
    const id = match[2];
    
    parts.push(
      <span
        key={`mention-${id}-${match.index}`}
        className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 font-semibold hover:bg-orange-200 dark:hover:bg-orange-900/30 transition-colors cursor-pointer"
        title={`View @${name}`}
      >
        @{name}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Extract mentioned user IDs from text
 */
export function extractMentionedUserIds(text: string): string[] {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const ids: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    ids.push(match[2]); // Extract ID
  }

  return ids;
}

/**
 * Check if text contains any mentions
 */
export function hasMentions(text: string): boolean {
  return /@\[([^\]]+)\]\(([^)]+)\)/.test(text);
}
