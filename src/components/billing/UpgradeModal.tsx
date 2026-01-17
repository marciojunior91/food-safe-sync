/**
 * UPGRADE MODAL COMPONENT
 * 
 * Modal that appears when user hits plan limits
 * Encourages upgrade with clear benefits and call-to-action
 * 
 * Created: January 14, 2026
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: 'teamMembers' | 'recipes' | 'products' | 'suppliers' | 'feature';
  currentPlan: string;
  currentLimit: number;
  featureName?: string;
}

export function UpgradeModal({
  open,
  onOpenChange,
  limitType,
  currentPlan,
  currentLimit,
  featureName,
}: UpgradeModalProps) {
  const navigate = useNavigate();

  const getLimitInfo = () => {
    switch (limitType) {
      case 'teamMembers':
        return {
          title: 'Team Member Limit Reached',
          description: `You've reached your ${currentLimit} team member limit on the ${currentPlan} plan.`,
          icon: <Crown className="h-12 w-12 text-purple-500" />,
        };
      case 'recipes':
        return {
          title: 'Recipe Limit Reached',
          description: `You've reached your ${currentLimit} recipe limit on the ${currentPlan} plan.`,
          icon: <Crown className="h-12 w-12 text-purple-500" />,
        };
      case 'products':
        return {
          title: 'Product Limit Reached',
          description: `You've reached your ${currentLimit} product limit on the ${currentPlan} plan.`,
          icon: <Crown className="h-12 w-12 text-purple-500" />,
        };
      case 'suppliers':
        return {
          title: 'Supplier Limit Reached',
          description: `You've reached your ${currentLimit} supplier limit on the ${currentPlan} plan.`,
          icon: <Crown className="h-12 w-12 text-purple-500" />,
        };
      case 'feature':
        return {
          title: `${featureName || 'Premium Feature'} Required`,
          description: `This feature is not available on the ${currentPlan} plan.`,
          icon: <Zap className="h-12 w-12 text-blue-500" />,
        };
      default:
        return {
          title: 'Upgrade Required',
          description: `This feature requires a higher plan.`,
          icon: <Crown className="h-12 w-12 text-purple-500" />,
        };
    }
  };

  const getRecommendedPlan = () => {
    if (currentPlan === 'free' || currentPlan === 'starter') {
      return {
        name: 'Professional',
        price: '$99',
        benefits: [
          'Up to 50 team members',
          'Up to 500 recipes',
          'Up to 1,000 products',
          'Allergen Management',
          'Nutritional Calculator',
          'Cost Control & Analytics',
          'Priority Support',
        ],
      };
    }
    return {
      name: 'Enterprise',
      price: '$299',
      benefits: [
        'Unlimited team members',
        'Unlimited recipes',
        'Unlimited products',
        'All Professional features',
        'API Access',
        'Custom Integrations',
        'Dedicated Account Manager',
        '24/7 Priority Support',
      ],
    };
  };

  const info = getLimitInfo();
  const recommendedPlan = getRecommendedPlan();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/pricing');
  };

  const handleViewPlans = () => {
    onOpenChange(false);
    navigate('/pricing');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex flex-col items-center text-center mb-4">
            <div className="mb-4">{info.icon}</div>
            <DialogTitle className="text-2xl">{info.title}</DialogTitle>
            <DialogDescription className="mt-2 text-base">
              {info.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Recommended Plan */}
        <div className="border-2 border-purple-500/20 rounded-lg p-5 bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-purple-900">
                {recommendedPlan.name}
              </h3>
              <p className="text-2xl font-bold text-purple-600">
                {recommendedPlan.price}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
            </div>
            <Badge className="bg-purple-500 text-white">Recommended</Badge>
          </div>

          <div className="space-y-2">
            {recommendedPlan.benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-purple-900">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={handleViewPlans}
            className="w-full sm:w-auto"
          >
            View All Plans
          </Button>
          <Button
            onClick={handleUpgrade}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Upgrade to {recommendedPlan.name}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
