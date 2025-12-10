import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Printer, 
  Grid3x3, 
  List, 
  Search,
  Package,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  measuring_units?: {
    name: string;
    abbreviation: string;
  };
  label_categories?: {
    name: string;
  };
}

interface QuickPrintGridProps {
  products: Product[];
  onQuickPrint: (product: Product) => void;
  className?: string;
}

export function QuickPrintGrid({ products, onQuickPrint, className }: QuickPrintGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">Quick Print</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {filteredProducts.length} products
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-9 w-9 p-0"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-9 w-9 p-0"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No products found</p>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredProducts.map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    className="h-32 flex flex-col items-center justify-center p-4 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 group touch-manipulation"
                    onClick={() => onQuickPrint(product)}
                  >
                    <Printer className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-center line-clamp-2 leading-tight">
                      {product.name}
                    </span>
                    {product.measuring_units && (
                      <span className="text-xs text-muted-foreground group-hover:text-primary-foreground/80 mt-1">
                        {product.measuring_units.abbreviation}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    className="w-full h-16 justify-start p-4 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 group touch-manipulation"
                    onClick={() => onQuickPrint(product)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Printer className="w-7 h-7 shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        {product.label_categories && (
                          <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/80 truncate">
                            {product.label_categories.name}
                          </p>
                        )}
                      </div>
                      {product.measuring_units && (
                        <Badge variant="secondary" className="shrink-0 group-hover:bg-primary-foreground/20">
                          {product.measuring_units.abbreviation}
                        </Badge>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
