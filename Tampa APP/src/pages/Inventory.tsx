import { Package } from "lucide-react";
import { ComingSoonBadge } from "@/components/ui/ComingSoonBadge";

export default function Inventory() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground mt-2">
            Track stock levels, manage suppliers, and automate reorders
          </p>
        </div>
        <ComingSoonBadge size="lg" />
      </div>

      {/* Coming soon placeholder */}
      <div className="flex flex-col items-center justify-center text-center py-24 px-6 rounded-xl border border-dashed bg-muted/20">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Package className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Inventory is coming soon</h2>
        <p className="text-muted-foreground max-w-md">
          We're building stock tracking, supplier management, and automated reorders.
          You'll be able to manage your inventory here shortly.
        </p>
      </div>
    </div>
  );
}
