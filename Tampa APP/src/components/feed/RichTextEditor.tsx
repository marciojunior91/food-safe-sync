/**
 * RichTextEditor - Simple WYSIWYG editor for Feed posts
 * Features: Bold, Italic, Lists, Emoji picker, Image upload
 */

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, ListOrdered, Smile, Image as ImageIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

const COMMON_EMOJIS = [
  '😊', '😂', '❤️', '👍', '👏', '🎉', '🚀', '✅',
  '🔥', '💯', '🙏', '💪', '👀', '🤔', '😍', '😭',
  '🎯', '⭐', '🌟', '💡', '📝', '📌', '⚡', '🎊',
];

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Type your message...', 
  disabled = false,
  maxLength = 5000 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Insert text at cursor position
  const insertText = useCallback((text: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      
      // Move cursor after inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Fallback: append to end
      editor.textContent += text;
    }

    // Update value
    onChange(editor.innerText);
    editor.focus();
  }, [onChange]);

  // Format text (bold, italic)
  const formatText = useCallback((format: 'bold' | 'italic') => {
    document.execCommand(format, false);
    onChange(editorRef.current?.innerText || '');
    editorRef.current?.focus();
  }, [onChange]);

  // Insert list
  const insertList = useCallback((ordered: boolean) => {
    document.execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList', false);
    onChange(editorRef.current?.innerText || '');
    editorRef.current?.focus();
  }, [onChange]);

  // Handle emoji selection
  const handleEmojiClick = useCallback((emoji: string) => {
    insertText(emoji + ' ');
    setShowEmojiPicker(false);
  }, [insertText]);

  // Handle content change
  const handleInput = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const text = editor.innerText || '';
    if (text.length <= maxLength) {
      // Process mentions to add visual styling
      const html = editor.innerHTML;
      const processedHtml = html.replace(
        /@\[([^\]]+)\]\(([^)]+)\)/g,
        '<span class="mention-tag">@$1</span>'
      );
      
      // Only update if changed to avoid cursor jumps
      if (html !== processedHtml) {
        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);
        const cursorOffset = range?.startOffset || 0;
        
        editor.innerHTML = processedHtml;
        
        // Restore cursor position
        if (selection && range) {
          try {
            const textNode = editor.childNodes[0];
            if (textNode) {
              range.setStart(textNode, Math.min(cursorOffset, textNode.textContent?.length || 0));
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          } catch (e) {
            // Cursor restoration failed, continue
          }
        }
      }
      
      onChange(text);
    } else {
      // Truncate if exceeded
      const truncated = text.substring(0, maxLength);
      if (editor) {
        editor.innerText = truncated;
      }
      onChange(truncated);
    }
  }, [maxLength, onChange]);

  // Handle paste (strip formatting)
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const remainingSpace = maxLength - (editorRef.current?.innerText.length || 0);
    const textToInsert = text.substring(0, remainingSpace);
    
    document.execCommand('insertText', false, textToInsert);
    onChange(editorRef.current?.innerText || '');
  }, [maxLength, onChange]);

  return (
    <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('bold')}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('italic')}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertList(false)}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertList(true)}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="h-8 w-8 p-0"
              title="Insert Emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-8 gap-2">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-2 transition-colors flex items-center justify-center"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex-1" />

        <span className="text-xs text-muted-foreground">
          {value.length} / {maxLength}
        </span>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        className={`min-h-[128px] max-h-[400px] overflow-y-auto p-4 focus:outline-none text-gray-900 dark:text-gray-100 ${
          disabled ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'bg-white dark:bg-gray-900'
        }`}
        data-placeholder={placeholder}
      />

      {/* CSS for placeholder and mentions */}
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        .dark [contenteditable][data-placeholder]:empty:before {
          color: #6b7280;
        }
        
        /* Mention styling - Instagram/Slack style */
        .mention-tag {
          color: #ea580c;
          font-weight: 600;
          background-color: rgba(234, 88, 12, 0.1);
          padding: 2px 4px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        /* Dark mode mention styling */
        .dark .mention-tag {
          color: #fb923c;
          background-color: rgba(251, 146, 60, 0.15);
        }
      `}</style>
    </div>
  );
}
