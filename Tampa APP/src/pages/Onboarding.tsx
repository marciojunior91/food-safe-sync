// Main Onboarding Page — Backbone Customisation Journey
// Every new user passes through this after signing up. It guides them through
// setting up the system's backbone: business info, label categories &
// subcategories, team members and venues. A recommended default layout is
// offered so users who don't want to customise can simply continue.

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import OnboardingSteps from "@/components/onboarding/OnboardingSteps";
import CompanyInfoStep from "@/components/onboarding/steps/CompanyInfoStep";
import CategoriesStep from "@/components/onboarding/steps/CategoriesStep";
import TeamMembersStep from "@/components/onboarding/steps/TeamMembersStep";
import VenuesStep from "@/components/onboarding/steps/VenuesStep";
import { TampaIcon } from "@/components/TampaIcon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  createOrganization,
  seedCategories,
  createTeamMembers,
  saveVenues,
  markOnboardingComplete,
} from "@/lib/onboardingDb";
import {
  OnboardingStep,
  CompanyData,
  CategoriesData,
  TeamMembersData,
  VenuesData,
  DEFAULT_TAXONOMY,
} from "@/types/onboarding";

const STEPS: OnboardingStep[] = [
  "company-info",
  "categories",
  "team-members",
  "venues",
  "complete",
];

export default function Onboarding() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [profileLoaded, setProfileLoaded] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("company-info");
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data state
  const [companyData, setCompanyData] = useState<Partial<CompanyData>>({
    address: { street: "", city: "", state: "", postcode: "", country: "Australia" },
  });
  const [categoriesData, setCategoriesData] = useState<Partial<CategoriesData>>({
    categories: DEFAULT_TAXONOMY,
    usedDefault: true,
  });
  const [teamMembersData, setTeamMembersData] = useState<Partial<TeamMembersData>>({
    teamMembers: [],
    skipForNow: false,
  });
  const [venuesData, setVenuesData] = useState<Partial<VenuesData>>({
    venues: [],
    skipForNow: false,
  });

  // Load the signed-in user's profile. If onboarding is already done, leave.
  // If an organisation already exists, skip the business-info step.
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, organization_id, onboarding_completed")
        .eq("user_id", user.id)
        .single();

      if (profile?.onboarding_completed) {
        navigate("/", { replace: true });
        return;
      }

      if (profile?.organization_id) {
        setOrganizationId(profile.organization_id);
        setCurrentStep("categories");
        setCompletedSteps(["company-info"]);
        if (!companyData.businessName) {
          setCompanyData((prev) => ({ ...prev, businessName: profile.display_name || "" }));
        }
      }

      setProfileLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const markComplete = (step: OnboardingStep) => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  };

  const goToNextStep = (from: OnboardingStep) => {
    markComplete(from);
    const index = STEPS.indexOf(from);
    if (index < STEPS.length - 1) setCurrentStep(STEPS[index + 1]);
  };

  const goToPreviousStep = () => {
    const index = STEPS.indexOf(currentStep);
    if (index > 0) setCurrentStep(STEPS[index - 1]);
  };

  // Ensure an organisation exists; create one from the company form if needed.
  const ensureOrganization = async (): Promise<string | null> => {
    if (organizationId) return organizationId;
    if (!user) return null;

    const result = await createOrganization(companyData as CompanyData, user.id);
    if (!result.success || !result.organizationId) {
      toast({
        title: "Couldn't create your business",
        description: result.error || "Please try again.",
        variant: "destructive",
      });
      return null;
    }
    setOrganizationId(result.organizationId);
    return result.organizationId;
  };

  const handleCompanyInfoNext = async () => {
    setIsSubmitting(true);
    const orgId = await ensureOrganization();
    setIsSubmitting(false);
    if (orgId) goToNextStep("company-info");
  };

  const handleCategoriesNext = () => goToNextStep("categories");
  const handleTeamMembersNext = () => goToNextStep("team-members");

  // Final step: persist categories, team members and venues, then finish.
  const handleFinish = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const orgId = await ensureOrganization();
      if (!orgId) {
        setIsSubmitting(false);
        return;
      }

      const catResult = await seedCategories(orgId, categoriesData.categories || []);
      if (!catResult.success) throw new Error(catResult.error || "Failed to save categories");

      await createTeamMembers(teamMembersData as TeamMembersData, orgId);
      await saveVenues(orgId, venuesData.venues || []);
      await markOnboardingComplete(user.id);

      toast({
        title: "🎉 Welcome to Tampa Hospo!",
        description: `Your setup is ready — ${catResult.categoriesCreated} categories created.`,
      });
      goToNextStep("venues");
    } catch (error: any) {
      toast({
        title: "Setup error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => navigate("/", { replace: true });

  if (authLoading || (user && !profileLoaded)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex items-center gap-2">
              <TampaIcon className="w-8 h-8" />
              <h1 className="font-bold text-xl">Tampa Hospo</h1>
            </div>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl py-12 px-4">
        {/* Intro */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Let's set up your kitchen</h1>
          <p className="text-muted-foreground">
            A few quick steps to customise the backbone of your system. Prefer the defaults?
            Just keep clicking continue.
          </p>
        </div>

        {/* Progress Steps */}
        <OnboardingSteps currentStep={currentStep} completedSteps={completedSteps} />

        {/* Loading overlay */}
        {isSubmitting && (
          <div className="mt-6 p-8 bg-card rounded-lg border flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Saving your setup...</p>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
          </div>
        )}

        {/* Step content */}
        {!isSubmitting && (
          <Card className="mt-8">
            <CardContent className="p-8">
              {currentStep === "company-info" && (
                <CompanyInfoStep
                  data={companyData}
                  onChange={setCompanyData}
                  onNext={handleCompanyInfoNext}
                  onBack={goToPreviousStep}
                />
              )}

              {currentStep === "categories" && (
                <CategoriesStep
                  data={categoriesData}
                  onChange={setCategoriesData}
                  onNext={handleCategoriesNext}
                  onBack={goToPreviousStep}
                />
              )}

              {currentStep === "team-members" && (
                <TeamMembersStep
                  data={teamMembersData}
                  onChange={setTeamMembersData}
                  onNext={handleTeamMembersNext}
                  onBack={goToPreviousStep}
                />
              )}

              {currentStep === "venues" && (
                <VenuesStep
                  data={venuesData}
                  onChange={setVenuesData}
                  onNext={handleFinish}
                  onBack={goToPreviousStep}
                  businessName={companyData.businessName}
                />
              )}

              {currentStep === "complete" && (
                <div className="text-center py-12 space-y-6">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold">You're All Set!</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Your Tampa Hospo account is ready to use. Start managing your kitchen
                    operations with confidence.
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

        {/* Help */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <a href="/support" className="text-primary hover:underline">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
