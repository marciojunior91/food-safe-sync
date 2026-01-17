import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
interface PreparedItem {
  id: string;
  recipe_id: string;
  prepared_at: string;
  expires_at: string;
  prepared_by: string;
  recipes?: {
    name: string;
    allergens: string[];
  };
}
interface ExpiryStatus {
  status: 'expired' | 'warning' | 'good';
  hoursUntilExpiry: number;
  message: string;
}
const getExpiryStatus = (expiresAt: string): ExpiryStatus => {
  const now = new Date();
  const expiryDate = new Date(expiresAt);
  const hoursUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60));
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
  const [preparedItems, setPreparedItems] = useState<PreparedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    toast
  } = useToast();
  const fetchPreparedItems = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('prepared_items').select(`
          *,
          recipes (
            name,
            allergens
          )
        `).order('expires_at', {
        ascending: true
      });
      if (error) {
        console.error('Error fetching prepared items:', error);
        toast({
          title: "Error",
          description: "Failed to fetch prepared items",
          variant: "destructive"
        });
        return;
      }
      setPreparedItems(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch prepared items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPreparedItems();
  }, []);
  const filteredItems = preparedItems.filter(item => {
    const status = getExpiryStatus(item.expires_at);
    return status.hoursUntilExpiry <= 72; // Show items expiring within 3 days
  });
  const expiredCount = filteredItems.filter(item => getExpiryStatus(item.expires_at).status === 'expired').length;
  const warningCount = filteredItems.filter(item => getExpiryStatus(item.expires_at).status === 'warning').length;
  const soonCount = filteredItems.filter(item => {
    const status = getExpiryStatus(item.expires_at);
    return status.status === 'good' && status.hoursUntilExpiry <= 72;
  }).length;
  if (loading) {
    return <Card>
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
      </Card>;
  }
  return;
}