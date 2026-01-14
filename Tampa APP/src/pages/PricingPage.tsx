/**
 * PRICING PAGE
 * 
 * Página de demonstração dos planos de assinatura
 * Mostra os 3 planos: Starter, Professional, Enterprise
 * 
 * Created: January 14, 2026
 */

import { SubscriptionPlans } from '@/components/billing/SubscriptionPlans';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header com botão de voltar */}
      <div className="border-b">
        <div className="container mx-auto py-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Planos de Assinatura */}
      <SubscriptionPlans />

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto py-8 text-center text-sm text-muted-foreground">
          <p>
            Tampa APP - Food Safety Management System
          </p>
          <p className="mt-2">
            Secure payments powered by{' '}
            <a
              href="https://stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Stripe
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
