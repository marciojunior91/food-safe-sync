import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
interface ComplianceCheck {
  id: string;
  check_type: string;
  area: string;
  status: string;
  checked_at: string;
  temperature_reading: number | null;
}
interface ComplianceSummary {
  total_checks: number;
  passed_count: number;
  failed_count: number;
  needs_attention_count: number;
}
export function ComplianceReports() {
  const [recentChecks, setRecentChecks] = useState<ComplianceCheck[]>([]);
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    const {
      data: checks,
      error
    } = await supabase.from("compliance_checks").select("*").order("checked_at", {
      ascending: false
    }).limit(5);
    
    if (error) {
      // Handle case where table doesn't exist (PGRST205 error)
      if (error.code === 'PGRST205') {
        console.warn('compliance_checks table not found in database schema');
        setRecentChecks([]);
        setSummary({
          total_checks: 0,
          passed_count: 0,
          failed_count: 0,
          needs_attention_count: 0
        });
        return;
      }
      console.error('Error fetching compliance checks:', error);
      setRecentChecks([]);
      return;
    }
    
    if (checks) {
      setRecentChecks(checks);
      const totalChecks = checks.length;
      const passed = checks.filter(c => c.status === "passed").length;
      const failed = checks.filter(c => c.status === "failed").length;
      const needsAttention = checks.filter(c => c.status === "needs_attention").length;
      setSummary({
        total_checks: totalChecks,
        passed_count: passed,
        failed_count: failed,
        needs_attention_count: needsAttention
      });
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "needs_attention":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      passed: "default",
      failed: "destructive",
      needs_attention: "secondary"
    };
    return <Badge variant={variants[status] || "default"}>{status.replace("_", " ")}</Badge>;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Compliance Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        {summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Checks</p>
                <p className="text-2xl font-bold">{summary.total_checks}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-success">{summary.passed_count}</p>
              </div>
            </div>
            <div className="space-y-2">
              {recentChecks.map((check) => (
                <div key={check.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(check.status)}
                    <div>
                      <p className="text-sm font-medium">{check.check_type}</p>
                      <p className="text-xs text-muted-foreground">{check.area}</p>
                    </div>
                  </div>
                  {getStatusBadge(check.status)}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}