import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Users,
  Calendar
} from "lucide-react";
// Removed LabelTemplate import - using simplified approach

interface TemplateManagementProps {
  onCreateNew: () => void;
}

export function TemplateManagement({ onCreateNew }: TemplateManagementProps) {

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fixed Label Template</h2>
          <p className="text-muted-foreground">Our standard template includes all required fields for compliance</p>
        </div>
        <Button onClick={onCreateNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Label
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Standard Food Label Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This template includes all required fields for Australian food labeling compliance:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                "Product Name",
                "Prep Date", 
                "Expiry Date",
                "Staff Name",
                "Quantity & Unit",
                "Allergen Information",
                "QR Code",
                "Dietary Indicators"
              ].map((field) => (
                <Badge key={field} variant="outline" className="justify-center p-2">
                  {field}
                </Badge>
              ))}
            </div>
            <div className="pt-4">
              <Button onClick={onCreateNew} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create New Label
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}