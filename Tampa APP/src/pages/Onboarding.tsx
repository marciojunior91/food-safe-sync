// Main Onboarding Page - Immersive Client Journey
// Iteration 13 - MVP Sprint
// Multi-step onboarding flow for new customers

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2 } from "lucide-react";
import OnboardingSteps from "@/components/onboarding/OnboardingSteps";
import RegistrationStep from "@/components/onboarding/steps/RegistrationStep";
import CompanyInfoStep from "@/components/onboarding/steps/CompanyInfoStep";
import ProductsStep from "@/components/onboarding/steps/ProductsStep";
import TeamMembersStep from "@/components/onboarding/steps/TeamMembersStep";
import InviteUsersStep from "@/components/onboarding/steps/InviteUsersStep";
import { useOnboardingDb } from "@/hooks/useOnboardingDb";
import {
  OnboardingStep,
  RegistrationData,
  CompanyData,
  ProductImportData,
  TeamMembersData,
  InviteUsersData,
} from "@/types/onboarding";

export default function Onboarding() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    loading,
    error,
    userId,
    organizationId,
    submitOnboarding,
    clearError,
  } = useOnboardingDb();
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('registration');
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  
  // Check if user came from Stripe checkout
  useEffect(() => {
    const subscriptionParam = searchParams.get('subscription');
    if (subscriptionParam === 'success') {
      setHasSubscription(true);
      toast({
        title: "🎉 Payment Successful!",
        description: "Your subscription is active. Complete setup to link it to your organization.",
      });
    }
  }, [searchParams, toast]);
  
  // Form data state
  const [registrationData, setRegistrationData] = useState<Partial<RegistrationData>>({});
  const [companyData, setCompanyData] = useState<Partial<CompanyData>>({
    address: {
      street: '',
      city: '',
      state: '',
      postcode: '',
      country: 'Australia',
    },
  });
  const [productsData, setProductsData] = useState<Partial<ProductImportData>>({
    importMethod: 'manual',
    products: [],
  });
  const [teamMembersData, setTeamMembersData] = useState<Partial<TeamMembersData>>({
    teamMembers: [],
    skipForNow: false,
  });
  const [inviteUsersData, setInviteUsersData] = useState<Partial<InviteUsersData>>({
    invitations: [],
    skipForNow: false,
  });

  const handleStepComplete = (step: OnboardingStep) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  const goToNextStep = (from: OnboardingStep) => {
    handleStepComplete(from);
    
    const steps: OnboardingStep[] = [
      'registration',
      'company-info',
      'products',
      'team-members',
      'invite-users',
      'complete',
    ];
    
    const currentIndex = steps.indexOf(from);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const steps: OnboardingStep[] = [
      'registration',
      'company-info',
      'products',
      'team-members',
      'invite-users',
      'complete',
    ];
    
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleRegistrationNext = () => {
    // Validation happens in the step component
    console.log('Registration data:', registrationData);
    goToNextStep('registration');
  };

  const handleCompanyInfoNext = () => {
    // Validation happens in the step component
    console.log('Company data:', companyData);
    goToNextStep('company-info');
  };

  const handleProductsNext = () => {
    // Validation happens in the step component
    console.log('Products data:', productsData);
    goToNextStep('products');
  };

  const handleTeamMembersNext = () => {
    // Validation happens in the step component
    console.log('Team members data:', teamMembersData);
    goToNextStep('team-members');
  };

  const handleInviteUsersNext = async () => {
    // This is the final step - submit everything to database
    setIsSubmitting(true);
    
    try {
      // Ensure all data is properly typed before submission
      const result = await submitOnboarding(
        registrationData as RegistrationData,
        companyData as CompanyData,
        productsData as ProductImportData,
        teamMembersData as TeamMembersData,
        inviteUsersData as InviteUsersData
      );

      if (result.success) {
        toast({
          title: "🎉 Welcome to Tampa APP!",
          description: `Successfully created your account and organization. ${result.productsImported || 0} products, ${result.teamMembersCreated || 0} team members, and ${result.invitationsSent || 0} invitations sent.`,
        });
        goToNextStep('invite-users');
      } else {
        toast({
          title: "Onboarding Error",
          description: result.error || "Failed to complete onboarding. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Unexpected Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    // Redirect to dashboard
    toast({
      title: "Welcome!",
      description: "Your setup is complete. Let's get started!",
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome to Tampa APP</h1>
          <p className="text-muted-foreground">
            Let's get your kitchen management system set up in just a few minutes
          </p>
          
          {/* Subscription Badge */}
          {hasSubscription && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Premium Plan Active
              </span>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <OnboardingSteps currentStep={currentStep} completedSteps={completedSteps} />

        {/* Error Alert */}
        {error && (
          <div className="mt-6 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-center justify-between">
            <p className="text-destructive text-sm">{error}</p>
            <button
              onClick={clearError}
              className="text-destructive hover:text-destructive/80"
            >
              ×
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="mt-6 p-8 bg-card rounded-lg border flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Setting up your account...</p>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
          </div>
        )}

        {/* Step Content */}
        {!isSubmitting && (
          <Card className="mt-8">
            <CardContent className="p-8">
            {currentStep === 'registration' && (
              <RegistrationStep
                data={registrationData}
                onChange={setRegistrationData}
                onNext={handleRegistrationNext}
              />
            )}

            {currentStep === 'company-info' && (
              <CompanyInfoStep
                data={companyData}
                onChange={setCompanyData}
                onNext={handleCompanyInfoNext}
                onBack={goToPreviousStep}
              />
            )}

            {currentStep === 'products' && (
              <ProductsStep
                data={productsData}
                onChange={setProductsData}
                onNext={handleProductsNext}
                onBack={goToPreviousStep}
              />
            )}

            {currentStep === 'team-members' && (
              <TeamMembersStep
                data={teamMembersData}
                onChange={setTeamMembersData}
                onNext={handleTeamMembersNext}
                onBack={goToPreviousStep}
              />
            )}

            {currentStep === 'invite-users' && (
              <InviteUsersStep
                data={inviteUsersData}
                onChange={setInviteUsersData}
                onNext={handleInviteUsersNext}
                onBack={goToPreviousStep}
              />
            )}

            {currentStep === 'complete' && (
              <div className="text-center py-12 space-y-6">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold">You're All Set!</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your Tampa APP account is ready to use. Start managing your kitchen operations with confidence.
                </p>
                <button
                  onClick={handleComplete}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-lg font-semibold"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Help section */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Need help?{' '}
            <a href="/support" className="text-primary hover:underline">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
