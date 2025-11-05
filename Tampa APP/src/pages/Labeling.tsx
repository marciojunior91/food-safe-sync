import { useState } from "react";
import { 
  Plus, 
  Printer, 
  QrCode, 
  Calendar, 
  AlertTriangle,
  Search,
  Filter,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/StatsCard";
import { LabelForm, LabelData } from "@/components/labels/LabelForm";
import { TemplateManagement } from "@/components/labels/TemplateManagement";
import { UserSelectionDialog } from "@/components/labels/UserSelectionDialog";
import { useToast } from "@/hooks/use-toast";

const labelTemplates = [
  {
    id: 1,
    name: "Standard Food Label",
    fields: ["Product Name", "Prep Date", "Expiry Date", "Allergens", "QR Code"],
    usage: 156,
    created: "2024-01-15"
  },
  {
    id: 2,
    name: "Allergen Alert Label",
    fields: ["Product Name", "Major Allergens", "Warning Text", "Date"],
    usage: 89,
    created: "2024-01-10"
  },
  {
    id: 3,
    name: "HACCP Temperature Log",
    fields: ["Product", "Temp", "Time", "Staff Initial", "QR Code"],
    usage: 234,
    created: "2024-01-05"
  }
];

const recentLabels = [
  {
    id: 1,
    product: "Chicken Salad",
    template: "Standard Food Label",
    expiry: "2024-08-22",
    status: "Printed",
    printedBy: "Sarah M.",
    time: "10:30 AM"
  },
  {
    id: 2,
    product: "Beef Stew",
    template: "Allergen Alert Label",
    expiry: "2024-08-23",
    status: "Ready",
    printedBy: "Mike C.",
    time: "11:15 AM"
  },
  {
    id: 3,
    product: "Soup Base",
    template: "HACCP Temperature Log",
    expiry: "2024-08-21",
    status: "Expiring Soon",
    printedBy: "Jennifer K.",
    time: "9:45 AM"
  }
];

export default function Labeling() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentView, setCurrentView] = useState<'overview' | 'templates' | 'form'>('overview');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    user_id: string;
    display_name: string | null;
  } | null>(null);
  const { toast } = useToast();

  const handleCreateLabel = () => {
    setUserDialogOpen(true);
  };

  const handleUserSelected = (user: { id: string; user_id: string; display_name: string | null }) => {
    setSelectedUser(user);
    setCurrentView('form');
  };

  const handleSaveLabel = (data: LabelData) => {
    toast({
      title: "Label Saved",
      description: "Your label has been saved as a draft.",
    });
    setCurrentView('overview');
  };

  const handlePrintLabel = (data: LabelData) => {
    toast({
      title: "Label Printed",
      description: `Label for ${data.productName} has been sent to the printer.`,
    });
    setCurrentView('overview');
  };

  const handleCancelForm = () => {
    setCurrentView('overview');
  };

  if (currentView === 'form') {
    return (
      <>
        <LabelForm
          onSave={handleSaveLabel}
          onPrint={handlePrintLabel}
          onCancel={handleCancelForm}
          selectedUser={selectedUser || undefined}
        />
        <UserSelectionDialog
          open={userDialogOpen}
          onOpenChange={setUserDialogOpen}
          onSelectUser={handleUserSelected}
        />
      </>
    );
  }

  if (currentView === 'templates') {
    return (
      <TemplateManagement
        onCreateNew={handleCreateLabel}
      />
    );
  }

  return (
    <>
      <UserSelectionDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        onSelectUser={handleUserSelected}
      />
      <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Label Management</h1>
          <p className="text-muted-foreground mt-2">
            Create templates, print labels, and track compliance
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print Queue
          </Button>
          <Button 
            variant="outline"
            onClick={() => setCurrentView('templates')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage Templates
          </Button>
          <Button variant="hero" onClick={handleCreateLabel}>
            <Plus className="w-4 h-4 mr-2" />
            New Label
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Labels Today"
          value={247}
          change="+12% from yesterday"
          changeType="positive"
          icon={Printer}
        />
        <StatsCard
          title="Templates Active"
          value={8}
          change="3 recently updated"
          changeType="neutral"
          icon={QrCode}
        />
        <StatsCard
          title="Expiring Soon"
          value={15}
          change="Next 24 hours"
          changeType="negative"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Compliance Rate"
          value="98.5%"
          change="+0.3% this week"
          changeType="positive"
          icon={Calendar}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg border shadow-card p-6">
        <h3 className="font-semibold text-lg mb-4">Quick Print</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Product Name</label>
            <Input placeholder="Enter product name" />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium">Template</label>
            <select className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md">
              <option>Standard Food Label</option>
              <option>Allergen Alert Label</option>
              <option>HACCP Temperature Log</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium">Quantity</label>
            <div className="flex gap-2">
              <Input type="number" placeholder="1" className="flex-1" />
              <Button variant="default">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Label Template */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Label Template</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentView('templates')}
            >
              <Settings className="w-4 h-4 mr-2" />
              View Template
            </Button>
          </div>
          
          <div className="bg-card rounded-lg border shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Standard Food Label</h4>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Fixed template</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {[
                  "Product Name",
                  "Prep Date",
                  "Expiry Date",
                  "Staff Name",
                  "Quantity",
                  "Allergens",
                  "QR Code"
                ].map((field) => (
                  <span 
                    key={field}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-medium"
                  >
                    {field}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Compliant with Australian food labeling standards
              </p>
            </div>
          </div>
        </div>

        {/* Recent Labels */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Recent Labels</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search labels..." 
                  className="pl-10 w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {recentLabels.map((label) => (
              <div key={label.id} className="bg-card rounded-lg border shadow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{label.product}</h4>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                    label.status === 'Printed' ? 'bg-success/10 text-success' :
                    label.status === 'Ready' ? 'bg-primary/10 text-primary' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {label.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Template: {label.template}</p>
                  <p>Expires: {new Date(label.expiry).toLocaleDateString()}</p>
                  <p>By: {label.printedBy} at {label.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}