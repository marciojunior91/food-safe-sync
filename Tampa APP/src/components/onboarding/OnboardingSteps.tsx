// Step navigation and progress component for onboarding
// Iteration 13 - MVP Sprint

import { Check } from "lucide-react";
import { OnboardingStep, ONBOARDING_STEPS } from "@/types/onboarding";
import { cn } from "@/lib/utils";

interface OnboardingStepsProps {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
}

export default function OnboardingSteps({ currentStep, completedSteps }: OnboardingStepsProps) {
  const currentStepIndex = ONBOARDING_STEPS.findIndex(step => step.id === currentStep);
  
  return (
    <div className="w-full py-6">
      {/* Progress bar */}
      <div className="relative">
        <div className="absolute top-5 left-0 w-full h-0.5 bg-border">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{
              width: `${(currentStepIndex / (ONBOARDING_STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>
        
        {/* Steps */}
        <div className="relative flex justify-between">
          {ONBOARDING_STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = step.id === currentStep;
            const isUpcoming = index > currentStepIndex;
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Step circle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-2",
                    {
                      "bg-primary border-primary text-primary-foreground": isCompleted,
                      "bg-primary/10 border-primary text-primary": isCurrent,
                      "bg-muted border-border text-muted-foreground": isUpcoming,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                
                {/* Step label */}
                <div className="mt-2 text-center max-w-[120px]">
                  <p
                    className={cn(
                      "text-xs font-medium transition-colors",
                      {
                        "text-foreground": isCurrent,
                        "text-muted-foreground": !isCurrent,
                      }
                    )}
                  >
                    {step.title}
                  </p>
                  {step.optional && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      (Optional)
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Current step info */}
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold">
          {ONBOARDING_STEPS[currentStepIndex].title}
        </h2>
        <p className="text-muted-foreground mt-1">
          {ONBOARDING_STEPS[currentStepIndex].description}
        </p>
      </div>
    </div>
  );
}
