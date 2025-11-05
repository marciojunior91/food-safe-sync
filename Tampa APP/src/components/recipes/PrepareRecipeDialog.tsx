import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, Play, Pause, CheckCircle, Users, Clock, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTimerManager } from "@/hooks/useTimerManager";
import { generateLabelHTML } from "@/utils/labelGenerator";

interface PrepareRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: {
    id: string;
    name: string;
    yield_amount: number;
    yield_unit: string;
    hold_time_days: number;
    ingredients: string[];
    prep_steps: string[];
    allergens: string[];
    dietary_requirements: string[];
    estimated_prep_minutes: number;
    service_gap_minutes: number;
  } | null;
}

export function PrepareRecipeDialog({ open, onOpenChange, recipe }: PrepareRecipeDialogProps) {
  const [step, setStep] = useState<'details' | 'timer' | 'label'>('details');
  const [batchSize, setBatchSize] = useState<number>(1);
  const [batchUnit, setBatchUnit] = useState<string>('batch');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [staff, setStaff] = useState<Array<{id: string, name: string, role: string}>>([]);
  const [currentTimer, setCurrentTimer] = useState<string>('');
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [preparedItem, setPreparedItem] = useState<any>(null);
  const [labelCount, setLabelCount] = useState(1);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { addTimer, pauseTimer, resumeTimer, removeTimer, getTimerById } = useTimerManager();

  useEffect(() => {
    if (open) {
      setStep('details');
      setBatchSize(1);
      setBatchUnit('batch');
      setSelectedStaff('');
      setCurrentTimer('');
      setSessionId('');
      setPreparedItem(null);
      setLabelCount(1);
      fetchActiveStaff();
    }
  }, [open]);

  const fetchActiveStaff = useCallback(async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user?.id)
        .single();

      const { data, error } = await supabase
        .from('staff')
        .select('id, name, role')
        .eq('is_active', true)
        .eq('organization_id', profile?.organization_id);

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  }, [user?.id]);

  // Get current timer data
  const timerData = currentTimer ? getTimerById(currentTimer) : null;
  const timerRunning = timerData?.isRunning || false;
  const elapsedTime = timerData?.elapsedTime || 0;

  const startPrep = async () => {
    if (!selectedStaff || !recipe) return;

    try {
      // Get user's organization_id and staff info
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user?.id)
        .single();

      const selectedStaffData = staff.find(s => s.id === selectedStaff);
      if (!selectedStaffData) return;

      // Create prep session
      const { data: session, error: sessionError } = await supabase
        .from('prep_sessions')
        .insert({
          recipe_id: recipe.id,
          staff_id: selectedStaff,
          batch_size: batchSize,
          organization_id: profile?.organization_id,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create timer in global store
      const timerId = addTimer({
        recipeId: recipe.id,
        recipeName: recipe.name,
        staffId: selectedStaff,
        staffName: selectedStaffData.name,
        startTime: Date.now(),
        isRunning: true,
        batchSize,
        batchUnit,
        sessionId: session.id,
      });

      setSessionId(session.id);
      setCurrentTimer(timerId);
      setStep('timer');

      toast({
        title: "Preparation Started",
        description: `${recipe.name} preparation timer started`,
      });
    } catch (error) {
      console.error('Error starting prep:', error);
      toast({
        title: "Error",
        description: "Failed to start preparation",
        variant: "destructive",
      });
    }
  };

  const completePrep = async () => {
    if (!recipe || !sessionId || !currentTimer) return;

    try {
      // Calculate expiry date based on hold time
      const preparedAt = new Date();
      const expiryDate = new Date(preparedAt);
      expiryDate.setDate(expiryDate.getDate() + (recipe.hold_time_days || 3));

      // Get user's organization_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user?.id)
        .single();

      // Update prep session
      await supabase
        .from('prep_sessions')
        .update({
          completed_at: new Date().toISOString(),
          actual_prep_minutes: Math.round(elapsedTime / 60000), // Convert ms to minutes
        })
        .eq('id', sessionId);

      // Create prepared item
      const { data: prepared, error: prepError } = await supabase
        .from('prepared_items')
        .insert({
          recipe_id: recipe.id,
          batch_size: batchSize,
          expires_at: expiryDate.toISOString(),
          prep_session_id: sessionId,
          staff_id: selectedStaff,
          prepared_by: user?.id || '',
          organization_id: profile?.organization_id,
          label_count: labelCount,
          prepared_at: preparedAt.toISOString(),
        })
        .select()
        .single();

      if (prepError) throw prepError;

      setPreparedItem(prepared);
      removeTimer(currentTimer);
      setCurrentTimer('');
      setStep('label');

      toast({
        title: "Preparation Completed",
        description: "Recipe preparation finished successfully",
      });
    } catch (error) {
      console.error('Error completing prep:', error);
      toast({
        title: "Error",
        description: "Failed to complete preparation",
        variant: "destructive",
      });
    }
  };

  const handlePrintLabels = async () => {
    if (!recipe || !preparedItem) return;

    const expiryDate = new Date(preparedItem.expires_at);
    const preparedDate = new Date(preparedItem.prepared_at);
    
    const staffMember = staff.find(s => s.id === selectedStaff);
    
    // Calculate actual yield based on batch size
    const calculatedYield = (recipe.yield_amount * batchSize);

    const labelData = {
      recipeName: recipe.name,
      batchSize,
      batchUnit,
      calculatedYield,
      yieldUnit: recipe.yield_unit,
      expiryDate: expiryDate.toISOString(),
      preparedDate: preparedDate.toISOString(),
      allergens: recipe.allergens || [],
      dietaryRequirements: recipe.dietary_requirements || [],
      staffName: staffMember?.name || 'Unknown',
      recipeId: recipe.id,
    };

    try {
      const labelHTML = await generateLabelHTML(labelData, labelCount);
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(labelHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }

      toast({
        title: "Labels Generated",
        description: `${labelCount} label(s) ready for printing with QR codes`,
      });
    } catch (error) {
      console.error('Error generating labels:', error);
      toast({
        title: "Error",
        description: "Failed to generate labels",
        variant: "destructive",
      });
    }
  };

  const handleCloseDialog = () => {
    if (currentTimer && timerRunning) {
      setShowCloseDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!recipe) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {step === 'details' && (
                <>
                  <Package className="w-5 h-5" />
                  Prepare Recipe: {recipe.name}
                </>
              )}
              {step === 'timer' && (
                <>
                  <Timer className="w-5 h-5" />
                  Preparation Timer
                </>
              )}
              {step === 'label' && (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Generate Labels
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {step === 'details' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{recipe.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Est. Prep: {recipe.estimated_prep_minutes} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-muted-foreground" />
                      <span>Hold Time: {recipe.hold_time_days} days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span>Yield: {recipe.yield_amount} {recipe.yield_unit}</span>
                    </div>
                  </div>

                  {recipe.allergens && recipe.allergens.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-amber-600">Allergens:</h4>
                      <div className="flex flex-wrap gap-1">
                        {recipe.allergens.map((allergen) => (
                          <Badge key={allergen} variant="destructive" className="text-xs">
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {recipe.dietary_requirements && recipe.dietary_requirements.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-green-600">Dietary Requirements:</h4>
                      <div className="flex flex-wrap gap-1">
                        {recipe.dietary_requirements.map((dietary) => (
                          <Badge key={dietary} variant="secondary" className="text-xs">
                            {dietary}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="staff">Staff Member *</Label>
                  <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{member.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {member.role}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="batchSize">Batch Size</Label>
                    <div className="flex gap-2">
                      <Input
                        id="batchSize"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={batchSize}
                        onChange={(e) => setBatchSize(parseFloat(e.target.value) || 1)}
                        placeholder="1"
                      />
                      <Select value={batchUnit} onValueChange={setBatchUnit}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="batch">batch</SelectItem>
                          <SelectItem value="half">half</SelectItem>
                          <SelectItem value="double">double</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Calculated yield: {(recipe.yield_amount * batchSize).toFixed(1)} {recipe.yield_unit}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="labelCount">Number of Labels</Label>
                    <Input
                      id="labelCount"
                      type="number"
                      min="1"
                      max="20"
                      value={labelCount}
                      onChange={(e) => setLabelCount(parseInt(e.target.value) || 1)}
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button onClick={startPrep} disabled={!selectedStaff}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Preparation
                </Button>
              </div>
            </div>
          )}

          {step === 'timer' && (
            <div className="space-y-6 text-center">
              <div className="space-y-4">
                <div className="text-6xl font-mono font-bold text-primary">
                  {formatTime(elapsedTime)}
                </div>
                <div className="text-lg text-muted-foreground">
                  Preparing {recipe.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  Batch: {batchSize} {batchUnit} • Yield: {(recipe.yield_amount * batchSize).toFixed(1)} {recipe.yield_unit}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={timerRunning ? "outline" : "default"}
                  onClick={() => {
                    if (currentTimer) {
                      if (timerRunning) {
                        pauseTimer(currentTimer);
                      } else {
                        resumeTimer(currentTimer);
                      }
                    }
                  }}
                  className="flex-1"
                >
                  {timerRunning ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      {elapsedTime > 0 ? 'Resume' : 'Start'}
                    </>
                  )}
                </Button>

                <Button
                  onClick={completePrep}
                  variant="default"
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete
                </Button>
              </div>
            </div>
          )}

          {step === 'label' && preparedItem && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg mb-4">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Preparation Complete!</span>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{recipe.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Staff:</span> {staff.find(s => s.id === selectedStaff)?.name}
                    </div>
                    <div>
                      <span className="font-medium">Batch Size:</span> {batchSize} {batchUnit}
                    </div>
                    <div>
                      <span className="font-medium">Calculated Yield:</span> {(recipe.yield_amount * batchSize).toFixed(1)} {recipe.yield_unit}
                    </div>
                    <div>
                      <span className="font-medium">Prep Time:</span> {formatTime(elapsedTime)}
                    </div>
                    <div>
                      <span className="font-medium">Prepared:</span> {new Date(preparedItem.prepared_at).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium text-red-600">Expires:</span> {new Date(preparedItem.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label htmlFor="labelCount">Number of Labels to Print</Label>
                <Input
                  id="labelCount"
                  type="number"
                  min="1"
                  max="20"
                  value={labelCount}
                  onChange={(e) => setLabelCount(parseInt(e.target.value) || 1)}
                  placeholder="1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Each label will include QR code, allergens, dietary info, and calculated yield
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Close
                </Button>
                <Button onClick={handlePrintLabels}>
                  <Package className="w-4 h-4 mr-2" />
                  Print {labelCount} Label{labelCount > 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Timer is Running</AlertDialogTitle>
            <AlertDialogDescription>
              The preparation timer is currently running. The timer will continue in the background when you close this dialog. You can return to monitor the timer later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCloseDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowCloseDialog(false);
              onOpenChange(false);
            }}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}