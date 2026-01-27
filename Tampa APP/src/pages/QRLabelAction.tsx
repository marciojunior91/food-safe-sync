// QRLabelAction.tsx - Page for handling QR scanned labels
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Trash2, ArrowLeft, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function QRLabelAction() {
  const { labelId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [label, setLabel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [action, setAction] = useState<'used' | 'wasted' | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (labelId) {
      fetchLabel();
    }
  }, [labelId]);

  const fetchLabel = async () => {
    try {
      const { data, error } = await supabase
        .from('printed_labels')
        .select('*')
        .eq('id', labelId)
        .single();

      if (error) throw error;
      setLabel(data);
    } catch (error) {
      console.error('Error fetching label:', error);
      toast({
        title: 'Error',
        description: 'Label not found',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!action || !label) return;

    setSubmitting(true);
    try {
      // Update the label status in the database
      const { error } = await supabase
        .from('printed_labels')
        .update({ 
          status: action,
          updated_at: new Date().toISOString()
        })
        .eq('id', label.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Label marked as ${action}`,
      });

      // Navigate back to expiring soon or dashboard
      navigate('/expiring-soon');
    } catch (error) {
      console.error('Error updating label:', error);
      toast({
        title: 'Error',
        description: 'Failed to update label status',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Loading label...</p>
        </div>
      </div>
    );
  }

  if (!label) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <QrCode className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Label Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The QR code doesn't match any active label in the system.
            </p>
            <Button onClick={() => navigate('/expiring-soon')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Expiring Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date() > new Date(label.expiry_date);
  const isAlreadyEnded = label.status === 'used' || label.status === 'wasted';

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/expiring-soon')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">QR Label Action</h1>
            <p className="text-muted-foreground">Scanned label lifecycle management</p>
          </div>
        </div>

        {/* Label Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              {label.product_name}
            </CardTitle>
            <CardDescription>
              Product label scanned via QR code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Prepared Date</Label>
                <p className="font-medium">
                  {label.prep_date ? format(new Date(label.prep_date), 'MMM dd, yyyy') : 'Not set'}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Expiry Date</Label>
                <p className={`font-medium ${isExpired ? 'text-destructive' : ''}`}>
                  {label.expiry_date ? format(new Date(label.expiry_date), 'MMM dd, yyyy') : 'Not set'}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Prepared By</Label>
                <p className="font-medium">{label.prepared_by_name || 'Unknown'}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Current Status</Label>
                <Badge variant={
                  label.status === 'used' ? 'default' :
                  label.status === 'wasted' ? 'destructive' :
                  label.status === 'expired' ? 'destructive' :
                  'outline'
                }>
                  {label.status?.replace('_', ' ') || 'active'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {!isAlreadyEnded ? (
          <Card>
            <CardHeader>
              <CardTitle>End Label Lifecycle</CardTitle>
              <CardDescription>
                {isExpired 
                  ? 'This label has expired. Please choose how it was handled.'
                  : 'How was this label used?'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={action === 'used' ? 'default' : 'outline'}
                  onClick={() => setAction('used')}
                  className="h-20 flex-col gap-2"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Consumed</span>
                </Button>
                <Button
                  variant={action === 'wasted' ? 'destructive' : 'outline'}
                  onClick={() => setAction('wasted')}
                  className="h-20 flex-col gap-2"
                >
                  <Trash2 className="w-6 h-6" />
                  <span>Wasted</span>
                </Button>
              </div>

              {action && (
                <div className="space-y-2">
                  <Label htmlFor="reason">
                    Reason {action === 'used' ? '(Optional)' : '(Required)'}
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder={
                      action === 'used'
                        ? 'Add any notes about consumption...'
                        : 'Why was this item wasted?'
                    }
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={
                  !action || 
                  submitting || 
                  (action === 'wasted' && !reason.trim())
                }
                className="w-full"
              >
                {submitting ? 'Processing...' : `Mark as ${action}`}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">Label Already Processed</h3>
              <p className="text-muted-foreground">
                This label has already been marked as {label.status}.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}