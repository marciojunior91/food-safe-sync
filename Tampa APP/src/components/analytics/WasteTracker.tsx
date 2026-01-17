import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
interface WasteLog {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  reason: string;
  estimated_cost: number;
  logged_at: string;
}
export function WasteTracker() {
  const [logs, setLogs] = useState<WasteLog[]>([]);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [reason, setReason] = useState("spoilage");
  const [cost, setCost] = useState("");
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchLogs();
  }, []);
  const fetchLogs = async () => {
    const {
      data,
      error
    } = await supabase.from("waste_logs").select("*").order("logged_at", {
      ascending: false
    }).limit(10);
    if (!error && data) {
      setLogs(data);
    }
  };
  const logWaste = async () => {
    if (!itemName || !quantity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) return;
    const {
      data: profile
    } = await supabase.from("profiles").select("organization_id").eq("user_id", user.id).single();
    const {
      error
    } = await supabase.from("waste_logs").insert({
      organization_id: profile?.organization_id,
      logged_by: user.id,
      item_name: itemName,
      quantity: parseFloat(quantity),
      unit,
      reason,
      estimated_cost: cost ? parseFloat(cost) : null
    });
    if (error) {
      toast({
        title: "Error",
        description: "Failed to log waste",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Waste logged successfully"
      });
      setItemName("");
      setQuantity("");
      setCost("");
      fetchLogs();
    }
  };
  const totalCost = logs.reduce((sum, log) => sum + (log.estimated_cost || 0), 0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Waste Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            placeholder="Item name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background opacity-100">
                <SelectItem value="kg" className="bg-background opacity-100">kg</SelectItem>
                <SelectItem value="l" className="bg-background opacity-100">L</SelectItem>
                <SelectItem value="pcs" className="bg-background opacity-100">pcs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background opacity-100">
              <SelectItem value="spoilage" className="bg-background opacity-100">Spoilage</SelectItem>
              <SelectItem value="overcooking" className="bg-background opacity-100">Overcooking</SelectItem>
              <SelectItem value="expired" className="bg-background opacity-100">Expired</SelectItem>
              <SelectItem value="contamination" className="bg-background opacity-100">Contamination</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Estimated cost (optional)"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </div>

        <Button onClick={logWaste} className="w-full">
          Log Waste
        </Button>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Total Cost (Recent)</span>
            <span className="text-lg font-bold text-destructive">
              ${totalCost.toFixed(2)}
            </span>
          </div>
          <div className="space-y-2">
            {logs.slice(0, 3).map((log) => (
              <div key={log.id} className="text-sm flex justify-between">
                <span className="text-muted-foreground">
                  {log.item_name} ({log.quantity} {log.unit})
                </span>
                <span className="text-destructive">
                  ${(log.estimated_cost || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}