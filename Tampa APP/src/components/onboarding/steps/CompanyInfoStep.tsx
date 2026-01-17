// Step 2: Company/Restaurant Information
// Iteration 13 - MVP Sprint

import { useState } from "react";
import { Building2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { CompanyData, BUSINESS_TYPES, AUSTRALIAN_STATES } from "@/types/onboarding";
import { validateCompanyInfo } from "@/utils/onboardingValidation";

interface CompanyInfoStepProps {
  data: Partial<CompanyData>;
  onChange: (data: Partial<CompanyData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function CompanyInfoStep({ data, onChange, onNext, onBack }: CompanyInfoStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: string, value: any) => {
    // Handle nested address fields
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      onChange({
        ...data,
        address: {
          ...data.address!,
          [addressField]: value,
        },
      });
    } else {
      onChange({ ...data, [field]: value });
    }
    
    // Clear error for this field
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateCompanyInfo(data);
    
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

  // Initialize address if not exists
  if (!data.address) {
    handleChange('address', {
      street: '',
      city: '',
      state: '',
      postcode: '',
      country: 'Australia',
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {/* Business Type Selection */}
      <div className="space-y-4">
        <Label>
          Business Type <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {BUSINESS_TYPES.map((type) => (
            <Card
              key={type.value}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                data.businessType === type.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
              onClick={() => handleChange('businessType', type.value)}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{type.icon}</div>
                <p className="text-sm font-medium">{type.label}</p>
              </div>
            </Card>
          ))}
        </div>
        {errors.businessType && touched.businessType && (
          <p className="text-sm text-destructive">{errors.businessType}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Business Name */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="businessName">
            Business Name <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="businessName"
              value={data.businessName || ''}
              onChange={(e) => handleChange('businessName', e.target.value)}
              onBlur={() => handleBlur('businessName')}
              placeholder="The Gourmet Kitchen"
              className={`pl-10 ${errors.businessName && touched.businessName ? 'border-destructive' : ''}`}
            />
          </div>
          {errors.businessName && touched.businessName && (
            <p className="text-sm text-destructive">{errors.businessName}</p>
          )}
        </div>

        {/* ABN */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="abn">ABN</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Australian Business Number (11 digits). Optional but recommended for businesses.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="abn"
            value={data.abn || ''}
            onChange={(e) => handleChange('abn', e.target.value)}
            onBlur={() => handleBlur('abn')}
            placeholder="12 345 678 901"
            className={errors.abn && touched.abn ? 'border-destructive' : ''}
          />
          {errors.abn && touched.abn && (
            <p className="text-sm text-destructive">{errors.abn}</p>
          )}
        </div>

        {/* ACN */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="acn">ACN</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Australian Company Number (9 digits). For registered companies.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="acn"
            value={data.acn || ''}
            onChange={(e) => handleChange('acn', e.target.value)}
            onBlur={() => handleBlur('acn')}
            placeholder="123 456 789"
            className={errors.acn && touched.acn ? 'border-destructive' : ''}
          />
          {errors.acn && touched.acn && (
            <p className="text-sm text-destructive">{errors.acn}</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="font-semibold">Business Address</h3>
        
        {/* Street */}
        <div className="space-y-2">
          <Label htmlFor="street">
            Street Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="street"
            value={data.address?.street || ''}
            onChange={(e) => handleChange('address.street', e.target.value)}
            onBlur={() => handleBlur('address.street')}
            placeholder="123 Main Street"
            className={errors['address.street'] && touched['address.street'] ? 'border-destructive' : ''}
          />
          {errors['address.street'] && touched['address.street'] && (
            <p className="text-sm text-destructive">{errors['address.street']}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">
              City <span className="text-destructive">*</span>
            </Label>
            <Input
              id="city"
              value={data.address?.city || ''}
              onChange={(e) => handleChange('address.city', e.target.value)}
              onBlur={() => handleBlur('address.city')}
              placeholder="Perth"
              className={errors['address.city'] && touched['address.city'] ? 'border-destructive' : ''}
            />
            {errors['address.city'] && touched['address.city'] && (
              <p className="text-sm text-destructive">{errors['address.city']}</p>
            )}
          </div>

          {/* Postcode */}
          <div className="space-y-2">
            <Label htmlFor="postcode">
              Postcode <span className="text-destructive">*</span>
            </Label>
            <Input
              id="postcode"
              value={data.address?.postcode || ''}
              onChange={(e) => handleChange('address.postcode', e.target.value)}
              onBlur={() => handleBlur('address.postcode')}
              placeholder="6000"
              className={errors['address.postcode'] && touched['address.postcode'] ? 'border-destructive' : ''}
            />
            {errors['address.postcode'] && touched['address.postcode'] && (
              <p className="text-sm text-destructive">{errors['address.postcode']}</p>
            )}
          </div>
        </div>

        {/* State */}
        <div className="space-y-2">
          <Label htmlFor="state">
            State/Territory <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.address?.state || ''}
            onValueChange={(value) => handleChange('address.state', value)}
          >
            <SelectTrigger className={errors['address.state'] && touched['address.state'] ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select a state" />
            </SelectTrigger>
            <SelectContent>
              {AUSTRALIAN_STATES.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors['address.state'] && touched['address.state'] && (
            <p className="text-sm text-destructive">{errors['address.state']}</p>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="font-semibold">Contact Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={data.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              placeholder="04XX XXX XXX or (08) XXXX XXXX"
              className={errors.phone && touched.phone ? 'border-destructive' : ''}
            />
            {errors.phone && touched.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={data.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://www.example.com"
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" className="flex-1" size="lg">
          Continue to Products
        </Button>
      </div>
    </form>
  );
}
