/**
 * FEATURE FLAGS
 * 
 * Central configuration for feature toggles
 * 
 * Created: January 20, 2026
 */

// =====================================================
// ENVIRONMENT VARIABLES
// =====================================================

const VITE_STRIPE_ENABLED = import.meta.env.VITE_STRIPE_ENABLED;
const VITE_ONBOARDING_ENABLED = import.meta.env.VITE_ONBOARDING_ENABLED;

// =====================================================
// FEATURE FLAGS
// =====================================================

export const FEATURES = {
  /**
   * STRIPE PAYMENTS
   * 
   * Controls whether Stripe payment/subscription features are enabled
   * 
   * When DISABLED:
   * - Onboarding skips payment step
   * - Billing page shows "Contact Sales"
   * - Users are created with manual org assignment
   * - Subscriptions managed via Supabase directly
   * 
   * Enable by setting VITE_STRIPE_ENABLED=true
   */
  STRIPE_ENABLED: VITE_STRIPE_ENABLED === 'true',

  /**
   * SELF-SERVICE ONBOARDING
   * 
   * Controls whether new users can self-signup via onboarding flow
   * 
   * When DISABLED:
   * - Signup button hidden/disabled
   * - Users created manually by admin
   * - Organizations pre-configured in Supabase
   * 
   * Enable by setting VITE_ONBOARDING_ENABLED=true
   */
  ONBOARDING_ENABLED: VITE_ONBOARDING_ENABLED === 'true',

  /**
   * ZEBRA PRINTER INTEGRATION
   * 
   * Always enabled (core feature)
   */
  ZEBRA_PRINTER: true,

  /**
   * EXPIRING SOON MODULE
   * 
   * Status: Not implemented yet
   * Planned for v1.1
   */
  EXPIRING_SOON: false,

  /**
   * KNOWLEDGE BASE
   * 
   * Status: Not implemented yet
   * Planned for v1.2
   */
  KNOWLEDGE_BASE: false,

  /**
   * TRAINING CENTER
   * 
   * Status: Not implemented yet
   * Planned for v1.2
   */
  TRAINING_CENTER: false,
} as const;

// =====================================================
// HELPERS
// =====================================================

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (feature: keyof typeof FEATURES): boolean => {
  return FEATURES[feature];
};

/**
 * Get all enabled features
 */
export const getEnabledFeatures = (): string[] => {
  return Object.entries(FEATURES)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature);
};

/**
 * Log feature flags on startup
 */
export const logFeatureFlags = () => {
  console.group('🎯 Feature Flags');
  console.log('Stripe Payments:', FEATURES.STRIPE_ENABLED ? '✅ ON' : '❌ OFF');
  console.log('Self-Service Onboarding:', FEATURES.ONBOARDING_ENABLED ? '✅ ON' : '❌ OFF');
  console.log('Zebra Printer:', FEATURES.ZEBRA_PRINTER ? '✅ ON' : '❌ OFF');
  console.log('Expiring Soon:', FEATURES.EXPIRING_SOON ? '✅ ON' : '❌ OFF (v1.1)');
  console.log('Knowledge Base:', FEATURES.KNOWLEDGE_BASE ? '✅ ON' : '❌ OFF (v1.2)');
  console.log('Training Center:', FEATURES.TRAINING_CENTER ? '✅ ON' : '❌ OFF (v1.2)');
  console.groupEnd();
};

// =====================================================
// MVP CONFIGURATION
// =====================================================

/**
 * MVP MODE
 * 
 * For initial launch, we use manual user/org creation:
 * 
 * 1. Admin creates organizations in Supabase
 * 2. Admin creates products, categories, subcategories
 * 3. Admin creates profiles with user_roles
 * 4. Admin creates team_members with PINs
 * 5. Users login with pre-created credentials
 * 
 * To enable self-service later:
 * - Set VITE_STRIPE_ENABLED=true
 * - Set VITE_ONBOARDING_ENABLED=true
 * - Configure Stripe keys in .env
 */
export const MVP_MODE = {
  // Manual org creation (Supabase Dashboard)
  MANUAL_ORG_CREATION: !FEATURES.ONBOARDING_ENABLED,
  
  // Manual user creation (Supabase Auth)
  MANUAL_USER_CREATION: !FEATURES.ONBOARDING_ENABLED,
  
  // Skip payment in onboarding
  SKIP_PAYMENT: !FEATURES.STRIPE_ENABLED,
  
  // Hide pricing page
  HIDE_PRICING: !FEATURES.STRIPE_ENABLED,
} as const;
