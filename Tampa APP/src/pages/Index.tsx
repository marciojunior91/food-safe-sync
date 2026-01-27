import { 
  ChefHat, 
  Tags, 
  Package, 
  BarChart3, 
  Shield, 
  Clock,
  Users,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TampaIcon } from "@/components/TampaIcon";

const features = [
  {
    icon: Tags,
    title: "Smart Labeling",
    description: "Custom templates with auto-expiry calculations and QR codes for seamless traceability."
  },
  {
    icon: ChefHat,
    title: "Kitchen Management",
    description: "Digital prep plans, timers, and HACCP compliance tools to streamline operations."
  },
  {
    icon: Package,
    title: "Inventory Control",
    description: "Real-time stock tracking with automated reorder suggestions and supplier management."
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Comprehensive reporting on compliance, waste reduction, and operational efficiency."
  },
  {
    icon: Shield,
    title: "HACCP Compliance",
    description: "Built-in food safety protocols with temperature logging and audit trails."
  },
  {
    icon: Users,
    title: "Multi-Tenant Platform",
    description: "Enterprise-ready with role-based access and multi-location support."
  }
];

const benefits = [
  "Reduce food waste by up to 30%",
  "Improve compliance scores to 98%+",
  "Save 4+ hours daily on paperwork",
  "Real-time visibility across locations"
];

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <TampaIcon className="w-12 h-12" />
              <h1 className="font-bold text-xl">Tampa APP</h1>
            </div>
            <Button variant="hero" asChild className="text-white">
              <a href="/auth">
                Enter Platform
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              The Complete Food Service
              <span className="block bg-gradient-hero bg-clip-text text-transparent">
                Management Platform
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Streamline operations, ensure compliance, and reduce waste with our comprehensive 
              SaaS platform designed specifically for the food service industry.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" asChild className="text-white">
                <a href="/auth">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              </Button>
              <Button variant="outline" size="lg">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Proven Results for Food Service Operations
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                <span className="font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From labeling to analytics, our integrated solution covers every aspect 
              of modern food service management.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-card rounded-lg border shadow-card hover:shadow-card-hover transition-shadow p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your Food Service Operations?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of restaurants, cafeterias, and food service providers 
            who trust our platform for their daily operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" asChild>
              <a href="/auth">
                Access Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
            <Button variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/80 backdrop-blur-sm py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TampaIcon className="w-12 h-12" />
              <span className="font-bold text-lg">Tampa APP</span>
            </div>
            <p className="text-muted-foreground">
              © 2024 Tampa APP. Smart Food Safety & Kitchen Management.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
