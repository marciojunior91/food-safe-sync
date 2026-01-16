// ============================================================================
// PINValidationDialog - Individual PIN Protection
// ============================================================================
// This component validates a team member's 4-digit PIN before allowing
// sensitive operations like profile editing.
//
// Usage Scenarios:
// - Staff user wants to edit their own profile
// - Admin/Manager bypass this (no PIN required)
// - Team member wants to change their own PIN
//
// Security:
// - PIN is hashed using pinUtils before comparison
// - No plaintext PINs stored or transmitted
// - Rate limiting should be added in production
// ============================================================================

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { hashPIN } from '@/utils/pinUtils';

interface PINValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValidated: () => void;
  expectedHash: string;
  title?: string;
  description?: string;
  maxAttempts?: number;
}

export function PINValidationDialog({
  open,
  onOpenChange,
  onValidated,
  expectedHash,
  title = 'PIN Verification Required',
  description = 'Enter your 4-digit PIN to continue',
  maxAttempts = 3,
}: PINValidationDialogProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPin('');
      setError('');
      setAttempts(0);
      setShowPin(false);
    }
  }, [open]);

  // Auto-validate when 4 digits entered
  useEffect(() => {
    if (pin.length === 4 && !isValidating) {
      handleValidate();
    }
  }, [pin]);

  const handleValidate = async () => {
    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    if (attempts >= maxAttempts) {
      setError('Maximum attempts reached. Please contact an administrator.');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // Hash the input PIN
      const inputHash = await hashPIN(pin);

      // Compare with expected hash
      if (inputHash === expectedHash) {
        // Success!
        console.log('[PINValidationDialog] PIN validated successfully');
        onValidated();
        onOpenChange(false);
      } else {
        // Failed
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        const remainingAttempts = maxAttempts - newAttempts;
        
        if (remainingAttempts > 0) {
          setError(`Incorrect PIN. ${remainingAttempts} attempt(s) remaining.`);
        } else {
          setError('Maximum attempts reached. Please contact an administrator.');
        }
        
        setPin('');
        console.log('[PINValidationDialog] PIN validation failed. Attempts:', newAttempts);
      }
    } catch (err) {
      console.error('[PINValidationDialog] Error validating PIN:', err);
      setError('An error occurred. Please try again.');
      setPin('');
    } finally {
      setIsValidating(false);
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow digits
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setPin(digits);
    setError('');
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length === 4 && !isValidating) {
      handleValidate();
    }
  };

  const isMaxAttemptsReached = attempts >= maxAttempts;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pin">4-Digit PIN</Label>
            <div className="relative">
              <Input
                id="pin"
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••"
                maxLength={4}
                className="text-center text-2xl tracking-widest font-mono pr-10"
                disabled={isValidating || isMaxAttemptsReached}
                autoFocus
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isValidating || isMaxAttemptsReached}
              >
                {showPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            
            {/* PIN strength indicator */}
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    pin.length > index
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {attempts > 0 && !isMaxAttemptsReached && (
            <p className="text-sm text-muted-foreground">
              Attempts: {attempts} / {maxAttempts}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isValidating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleValidate}
            disabled={pin.length !== 4 || isValidating || isMaxAttemptsReached}
          >
            {isValidating ? 'Validating...' : 'Verify'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
