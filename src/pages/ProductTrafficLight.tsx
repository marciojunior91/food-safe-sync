import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PreparedItem {
  id: string;
  recipe_id: string;
  prepared_at: string;
  expires_at: string;
  batch_size: number;
  recipes?: {
    name: string;
    category: string;
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
      message: `Expired ${Math.abs(hoursUntilExpiry)}h ago`
    };
  } else if (hoursUntilExpiry <= 24) {
    return {
      status: 'warning',
      hoursUntilExpiry,
      message: `${hoursUntilExpiry}h left`
    };
  } else {
    return {
      status: 'good',
      hoursUntilExpiry,
      message: `${Math.floor(hoursUntilExpiry / 24)}d left`
    };
  }
};

const getStatusColor = (status: ExpiryStatus['status']) => {
  switch (status) {
    case 'expired':
      return 'bg-destructive/10 border-destructive';
    case 'warning':
      return 'bg-warning/10 border-warning';
    case 'good':
      return 'bg-success/10 border-success';
  }
};

const getStatusIcon = (status: ExpiryStatus['status']) => {
  switch (status) {
    case 'expired':
      return <XCircle className="w-5 h-5 text-destructive" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-warning" />;
    case 'good':
      return <CheckCircle className="w-5 h-5 text-success" />;
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
  }
};

export default function ProductTrafficLight() {
  const [preparedItems, setPreparedItems] = useState<PreparedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPreparedItems = async () => {
    try {
      const { data, error } = await supabase
        .from('prepared_items')
        .select(`
          *,
          recipes (
            name,
            category
          )
        `)
        .order('expires_at', { ascending: true });

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

    // Subscribe to real-time updates
    const channel = supabase
      .channel('prepared_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prepared_items'
        },
        () => {
          fetchPreparedItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Product Traffic Light</h1>
          <p className="text-muted-foreground">Monitor all products by expiration status</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = {
    expired: preparedItems.filter(item => getExpiryStatus(item.expires_at).status === 'expired').length,
    warning: preparedItems.filter(item => getExpiryStatus(item.expires_at).status === 'warning').length,
    good: preparedItems.filter(item => getExpiryStatus(item.expires_at).status === 'good').length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Product Traffic Light</h1>
        <p className="text-muted-foreground">Monitor all products by expiration status</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-3xl font-bold text-destructive">{stats.expired}</p>
              </div>
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-3xl font-bold text-warning">{stats.warning}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fresh</p>
                <p className="text-3xl font-bold text-success">{stats.good}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {preparedItems.map((item) => {
          const status = getExpiryStatus(item.expires_at);
          const expiryDate = new Date(item.expires_at);
          const preparedDate = new Date(item.prepared_at);

          return (
            <Card key={item.id} className={`border-2 transition-all hover:shadow-lg ${getStatusColor(status.status)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-2">
                    {item.recipes?.name || 'Unknown Product'}
                  </CardTitle>
                  {getStatusIcon(status.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Badge variant={getStatusBadgeVariant(status.status)} className="mb-2">
                    {status.status.toUpperCase()}
                  </Badge>
                  <p className="text-sm font-medium">{status.message}</p>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Expires: {expiryDate.toLocaleDateString()} {expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div>
                    Prepared: {preparedDate.toLocaleDateString()}
                  </div>
                  {item.recipes?.category && (
                    <div className="capitalize">
                      Category: {item.recipes.category}
                    </div>
                  )}
                  <div>
                    Batch: {item.batch_size || 1}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {preparedItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No prepared items found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
