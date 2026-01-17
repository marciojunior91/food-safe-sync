// Onboarding validation utilities
// Iteration 13 - MVP Sprint

import { 
  RegistrationData, 
  CompanyData, 
  ProductImportData,
  TeamMemberEntry,
  UserInvitation,
  ValidationError,
  StepValidationResult 
} from '@/types/onboarding';

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
export const validatePasswordStrength = (password: string): { 
  isValid: boolean; 
  strength: 'weak' | 'medium' | 'strong';
  message: string;
} => {
  if (password.length < 8) {
    return { isValid: false, strength: 'weak', message: 'Password must be at least 8 characters' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (criteriaCount < 2) {
    return { 
      isValid: false, 
      strength: 'weak', 
      message: 'Password should include uppercase, lowercase, numbers, and special characters' 
    };
  }
  
  if (criteriaCount < 3) {
    return { isValid: true, strength: 'medium', message: 'Password is medium strength' };
  }
  
  return { isValid: true, strength: 'strong', message: 'Password is strong' };
};

// Australian phone validation (basic)
export const validateAustralianPhone = (phone: string): boolean => {
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check for valid Australian phone formats
  // Mobile: 04xx xxx xxx or +61 4xx xxx xxx
  // Landline: (0x) xxxx xxxx or +61 x xxxx xxxx
  const mobileRegex = /^(\+?61|0)4\d{8}$/;
  const landlineRegex = /^(\+?61|0)[2-8]\d{8}$/;
  
  return mobileRegex.test(cleaned) || landlineRegex.test(cleaned);
};

// ABN validation (Australian Business Number - 11 digits with checksum)
export const validateABN = (abn: string): boolean => {
  const cleaned = abn.replace(/\s/g, '');
  
  if (!/^\d{11}$/.test(cleaned)) {
    return false;
  }
  
  // ABN checksum validation
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  let sum = 0;
  
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(cleaned[i]);
    const weight = weights[i];
    sum += (i === 0 ? digit - 1 : digit) * weight;
  }
  
  return sum % 89 === 0;
};

// ACN validation (Australian Company Number - 9 digits)
export const validateACN = (acn: string): boolean => {
  const cleaned = acn.replace(/\s/g, '');
  return /^\d{9}$/.test(cleaned);
};

// PIN validation (4-6 digits)
export const validatePIN = (pin: string): boolean => {
  return /^\d{4,6}$/.test(pin);
};

// Step 1: Registration validation
export const validateRegistration = (data: Partial<RegistrationData>): StepValidationResult => {
  const errors: ValidationError[] = [];
  
  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }
  
  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else {
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.isValid) {
      errors.push({ field: 'password', message: passwordValidation.message });
    }
  }
  
  if (!data.confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Please confirm your password' });
  } else if (data.password !== data.confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
  }
  
  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  }
  
  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  }
  
  if (!data.acceptedTerms) {
    errors.push({ field: 'acceptedTerms', message: 'You must accept the terms and conditions' });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Step 2: Company information validation
export const validateCompanyInfo = (data: Partial<CompanyData>): StepValidationResult => {
  const errors: ValidationError[] = [];
  
  if (!data.businessName || data.businessName.trim().length === 0) {
    errors.push({ field: 'businessName', message: 'Business name is required' });
  }
  
  if (!data.businessType) {
    errors.push({ field: 'businessType', message: 'Business type is required' });
  }
  
  if (data.abn && !validateABN(data.abn)) {
    errors.push({ field: 'abn', message: 'Invalid ABN format' });
  }
  
  if (data.acn && !validateACN(data.acn)) {
    errors.push({ field: 'acn', message: 'Invalid ACN format' });
  }
  
  if (!data.address) {
    errors.push({ field: 'address', message: 'Address is required' });
  } else {
    if (!data.address.street || data.address.street.trim().length === 0) {
      errors.push({ field: 'address.street', message: 'Street address is required' });
    }
    if (!data.address.city || data.address.city.trim().length === 0) {
      errors.push({ field: 'address.city', message: 'City is required' });
    }
    if (!data.address.state || data.address.state.trim().length === 0) {
      errors.push({ field: 'address.state', message: 'State is required' });
    }
    if (!data.address.postcode || data.address.postcode.trim().length === 0) {
      errors.push({ field: 'address.postcode', message: 'Postcode is required' });
    }
  }
  
  if (!data.phone) {
    errors.push({ field: 'phone', message: 'Phone number is required' });
  } else if (!validateAustralianPhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Invalid Australian phone number' });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Step 3: Products validation
export const validateProducts = (data: Partial<ProductImportData>): StepValidationResult => {
  const errors: ValidationError[] = [];
  
  if (!data.importMethod) {
    errors.push({ field: 'importMethod', message: 'Please select an import method' });
  }
  
  // Products can be empty (optional step)
  if (data.products && data.products.length > 0) {
    data.products.forEach((product, index) => {
      if (!product.name || product.name.trim().length === 0) {
        errors.push({ 
          field: `products[${index}].name`, 
          message: `Product ${index + 1}: Name is required` 
        });
      }
      if (!product.category || product.category.trim().length === 0) {
        errors.push({ 
          field: `products[${index}].category`, 
          message: `Product ${index + 1}: Category is required` 
        });
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Step 4: Team members validation
export const validateTeamMembers = (data: TeamMemberEntry[]): StepValidationResult => {
  const errors: ValidationError[] = [];
  const pins = new Set<string>();
  
  data.forEach((member, index) => {
    if (!member.displayName || member.displayName.trim().length === 0) {
      errors.push({ 
        field: `teamMembers[${index}].displayName`, 
        message: `Team member ${index + 1}: Name is required` 
      });
    }
    
    if (!member.role) {
      errors.push({ 
        field: `teamMembers[${index}].role`, 
        message: `Team member ${index + 1}: Role is required` 
      });
    }
    
    if (!member.pin) {
      errors.push({ 
        field: `teamMembers[${index}].pin`, 
        message: `Team member ${index + 1}: PIN is required` 
      });
    } else if (!validatePIN(member.pin)) {
      errors.push({ 
        field: `teamMembers[${index}].pin`, 
        message: `Team member ${index + 1}: PIN must be 4-6 digits` 
      });
    } else if (pins.has(member.pin)) {
      errors.push({ 
        field: `teamMembers[${index}].pin`, 
        message: `Team member ${index + 1}: PIN must be unique` 
      });
    } else {
      pins.add(member.pin);
    }
    
    if (member.email && !validateEmail(member.email)) {
      errors.push({ 
        field: `teamMembers[${index}].email`, 
        message: `Team member ${index + 1}: Invalid email format` 
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Step 5: User invitations validation
export const validateInvitations = (data: UserInvitation[]): StepValidationResult => {
  const errors: ValidationError[] = [];
  const emails = new Set<string>();
  
  data.forEach((invitation, index) => {
    if (!invitation.email || invitation.email.trim().length === 0) {
      errors.push({ 
        field: `invitations[${index}].email`, 
        message: `Invitation ${index + 1}: Email is required` 
      });
    } else if (!validateEmail(invitation.email)) {
      errors.push({ 
        field: `invitations[${index}].email`, 
        message: `Invitation ${index + 1}: Invalid email format` 
      });
    } else if (emails.has(invitation.email.toLowerCase())) {
      errors.push({ 
        field: `invitations[${index}].email`, 
        message: `Invitation ${index + 1}: Email already added` 
      });
    } else {
      emails.add(invitation.email.toLowerCase());
    }
    
    if (!invitation.role) {
      errors.push({ 
        field: `invitations[${index}].role`, 
        message: `Invitation ${index + 1}: Role is required` 
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};
