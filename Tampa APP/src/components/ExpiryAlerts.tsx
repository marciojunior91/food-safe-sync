import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface PrintedLabel {
  id: string;
  product_name: string;
  prep_date: string;
  expiry_date: string;
  prepared_by_name: string | null;
  allergens: string[] | null;
}

interface ExpiryStatus {
  status: 'expired' | 'warning' | 'good';
  hoursUntilExpiry: number;
  message: string;
}

const getExpiryStatus = (expiryDate: string): ExpiryStatus => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const hoursUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));

  if (hoursUntilExpiry < 0) {
    return {
      status: 'expired',
      hoursUntilExpiry,
      message: `Expired ${Math.abs(hoursUntilExpiry)} hours ago`
    };
  } else if (hoursUntilExpiry <= 24) {
    return {
      status: 'warning',
      hoursUntilExpiry,
      message: `Expires in ${hoursUntilExpiry} hours`
    };
  } else if (hoursUntilExpiry <= 72) {
    return {
      status: 'good',
      hoursUntilExpiry,
      message: `Expires in ${Math.floor(hoursUntilExpiry / 24)} days`
    };
  } else {
    return {
      status: 'good',
      hoursUntilExpiry,
      message: `Fresh for ${Math.floor(hoursUntilExpiry / 24)} days`
    };
  }
};

const getStatusIcon = (status: ExpiryStatus['status']) => {
  switch (status) {
    case 'expired':
      return <XCircle className="w-4 h-4 text-destructive" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    case 'good':
      return <CheckCircle className="w-4 h-4 text-success" />;
  }
};

const getStatusBadgeVariant = (status: ExpiryStatus['status']) => {
  switch (status) {
    case 'expired':
      return 'destructive';
    case 'warning':
      return 'secondary';
    case 'good':
      return 'outline';
    default:
      return 'outline';
  }
};

export default function ExpiryAlerts() {
  const [labels, setLabels] = useState<PrintedLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchLabels = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.organization_id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('printed_labels')
        .select('id, product_name, prep_date, expiry_date, prepared_by_name, allergens')
        .eq('organization_id', profile.organization_id)
        .order('expiry_date', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching labels:', error);
        setLoading(false);
        return;
      }

      setLabels(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabels();
  }, [user]);

  const filteredLabels = labels.filter(label => {
    const status = getExpiryStatus(label.expiry_date);
    return status.hoursUntilExpiry <= 72;
  });

  const expiredCount = filteredLabels.filter(label => 
    getExpiryStatus(label.expiry_date).status === 'expired'
  ).length;
  
  const warningCount = filteredLabels.filter(label => 
    getExpiryStatus(label.expiry_date).status === 'warning'
  ).length;
  
  const soonCount = filteredLabels.filter(label => {
    const status = getExpiryStatus(label.expiry_date);
    return status.status === 'good' && status.hoursUntilExpiry <= 72;
  }).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Expiry Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredLabels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Expiry Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            All items are fresh! No expiry alerts at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Expiry Alerts
          </span>
          <div className="flex gap-2 text-sm font-normal">
            {expiredCount > 0 && (
              <Badge variant="destructive">{expiredCount} Expired</Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="secondary">{warningCount} Urgent</Badge>
            )}
            {soonCount > 0 && (
              <Badge variant="outline">{soonCount} Soon</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredLabels.map((label) => {
            const status = getExpiryStatus(label.expiry_date);
            return (
              <div
                key={label.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(status.status)}
                  <div className="flex-1">
                    <h4 className="font-medium">{label.product_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {status.message}
                    </p>
                    {label.prepared_by_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Prepared by {label.prepared_by_name}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={getStatusBadgeVariant(status.status) as any}>
                  {status.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
