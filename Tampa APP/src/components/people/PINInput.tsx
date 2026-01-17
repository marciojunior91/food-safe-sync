// PIN Input Component
// 4-digit PIN entry for team member authentication

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, AlertCircle } from 'lucide-react';
import { isValidPIN } from '@/utils/pinUtils';

interface PINInputProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (pin: string) => Promise<boolean>;
  title?: string;
  description?: string;
  teamMemberName?: string;
}

export default function PINInput({
  open,
  onOpenChange,
  onSubmit,
  title = 'Enter PIN',
  description = 'Enter your 4-digit PIN to continue',
  teamMemberName,
}: PINInputProps) {
  const [pin, setPIN] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setPIN(['', '', '', '']);
      setError(null);
      // Focus first input after a short delay
      setTimeout(() => inputRefs[0].current?.focus(), 100);
    }
  }, [open]);

  // Handle input change
  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newPIN = [...pin];
    newPIN[index] = value;
    setPIN(newPIN);
    setError(null);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit when all 4 digits are entered
    if (index === 3 && value) {
      const fullPIN = [...newPIN.slice(0, 3), value].join('');
      handleSubmit(fullPIN);
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      // If current input is empty, focus previous input
      inputRefs[index - 1].current?.focus();
    } else if (e.key === 'Enter') {
      const fullPIN = pin.join('');
      if (isValidPIN(fullPIN)) {
        handleSubmit(fullPIN);
      }
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Validate pasted data is 4 digits
    if (/^\d{4}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setPIN(digits);
      setError(null);
      
      // Focus last input
      inputRefs[3].current?.focus();
      
      // Auto-submit
      handleSubmit(pastedData);
    }
  };

  // Handle PIN submission
  const handleSubmit = async (pinValue?: string) => {
    const fullPIN = pinValue || pin.join('');
    
    if (!isValidPIN(fullPIN)) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isValid = await onSubmit(fullPIN);
      
      if (!isValid) {
        setError('Incorrect PIN. Please try again.');
        setPIN(['', '', '', '']);
        inputRefs[0].current?.focus();
      } else {
        // Success - dialog will be closed by parent
        setPIN(['', '', '', '']);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('PIN submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {teamMemberName && (
              <span className="block font-medium text-foreground mb-2">
                {teamMemberName}
              </span>
            )}
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* PIN Input Grid */}
          <div className="flex justify-center gap-3">
            {pin.map((digit, index) => (
              <Input
                key={index}
                ref={inputRefs[index]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={loading}
                className="w-14 h-14 text-center text-2xl font-bold"
                autoComplete="off"
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            variant="outline"
            onClick={() => {
              setPIN(['', '', '', '']);
              setError(null);
              onOpenChange(false);
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSubmit()}
            disabled={!isValidPIN(pin.join('')) || loading}
          >
            {loading ? 'Verifying...' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
