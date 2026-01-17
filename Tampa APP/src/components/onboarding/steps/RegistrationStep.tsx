// Step 1: User Registration
// Iteration 13 - MVP Sprint

import { useState } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RegistrationData } from "@/types/onboarding";
import { validateRegistration, validatePasswordStrength } from "@/utils/onboardingValidation";

interface RegistrationStepProps {
  data: Partial<RegistrationData>;
  onChange: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

export default function RegistrationStep({ data, onChange, onNext }: RegistrationStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: keyof RegistrationData, value: any) => {
    onChange({ ...data, [field]: value });
    
    // Clear error for this field when user types
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleBlur = (field: keyof RegistrationData) => {
    setTouched({ ...touched, [field]: true });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateRegistration(data);
    
    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      
      // Mark all fields as touched
      const allTouched: Record<string, boolean> = {};
      Object.keys(errorMap).forEach(key => {
        allTouched[key] = true;
      });
      setTouched(allTouched);
      
      return;
    }
    
    onNext();
  };

  const passwordStrength = data.password ? validatePasswordStrength(data.password) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      <div className="space-y-4">
        {/* First Name */}
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            value={data.firstName || ''}
            onChange={(e) => handleChange('firstName', e.target.value)}
            onBlur={() => handleBlur('firstName')}
            placeholder="John"
            className={errors.firstName && touched.firstName ? 'border-destructive' : ''}
          />
          {errors.firstName && touched.firstName && (
            <p className="text-sm text-destructive">{errors.firstName}</p>
          )}
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            value={data.lastName || ''}
            onChange={(e) => handleChange('lastName', e.target.value)}
            onBlur={() => handleBlur('lastName')}
            placeholder="Smith"
            className={errors.lastName && touched.lastName ? 'border-destructive' : ''}
          />
          {errors.lastName && touched.lastName && (
            <p className="text-sm text-destructive">{errors.lastName}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={data.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="john.smith@example.com"
            className={errors.email && touched.email ? 'border-destructive' : ''}
          />
          {errors.email && touched.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">
            Password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={data.password || ''}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              placeholder="••••••••"
              className={errors.password && touched.password ? 'border-destructive pr-10' : 'pr-10'}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          
          {/* Password strength indicator */}
          {data.password && passwordStrength && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      passwordStrength.strength === 'weak' && level === 1
                        ? 'bg-destructive'
                        : passwordStrength.strength === 'medium' && level <= 2
                        ? 'bg-warning'
                        : passwordStrength.strength === 'strong'
                        ? 'bg-success'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs ${
                passwordStrength.strength === 'strong' ? 'text-success' : 
                passwordStrength.strength === 'medium' ? 'text-warning' : 
                'text-destructive'
              }`}>
                {passwordStrength.message}
              </p>
            </div>
          )}
          
          {errors.password && touched.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            Confirm Password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={data.confirmPassword || ''}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder="••••••••"
              className={errors.confirmPassword && touched.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          
          {/* Password match indicator */}
          {data.confirmPassword && data.password && (
            <div className="flex items-center gap-2">
              {data.password === data.confirmPassword ? (
                <>
                  <Check className="w-4 h-4 text-success" />
                  <p className="text-xs text-success">Passwords match</p>
                </>
              ) : (
                <>
                  <X className="w-4 h-4 text-destructive" />
                  <p className="text-xs text-destructive">Passwords do not match</p>
                </>
              )}
            </div>
          )}
          
          {errors.confirmPassword && touched.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start space-x-2">
          <Checkbox
            id="acceptedTerms"
            checked={data.acceptedTerms || false}
            onCheckedChange={(checked) => handleChange('acceptedTerms', checked)}
          />
          <div className="space-y-1">
            <label
              htmlFor="acceptedTerms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I accept the{' '}
              <a href="/terms" target="_blank" className="text-primary hover:underline">
                Terms and Conditions
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" className="text-primary hover:underline">
                Privacy Policy
              </a>
              <span className="text-destructive ml-1">*</span>
            </label>
            {errors.acceptedTerms && touched.acceptedTerms && (
              <p className="text-sm text-destructive">{errors.acceptedTerms}</p>
            )}
          </div>
        </div>
      </div>

      {/* Info alert */}
      <Alert>
        <AlertDescription>
          Your password must be at least 8 characters long and include a mix of uppercase, lowercase, numbers, and special characters.
        </AlertDescription>
      </Alert>

      {/* Submit button */}
      <Button type="submit" className="w-full" size="lg">
        Continue to Business Information
      </Button>

      {/* Already have an account */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <a href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </a>
      </p>
    </form>
  );
}
