import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Key, Upload, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ProfileTabContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [uploading, setUploading] = useState(false);

  // Handle display name update
  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Error",
        description: "Display name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Display name updated successfully"
      });
      setDisplayName("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update display name",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully"
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 2MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      // Note: avatar_url field doesn't exist in profiles yet
      // For now, just store URL in localStorage
      localStorage.setItem(`avatar_${user?.id}`, publicUrl);

      setAvatarUrl(publicUrl);
      toast({
        title: "Success",
        description: "Avatar uploaded successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload avatar",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Profile Information</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            View and update your profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <Avatar className="h-16 w-16 md:h-20 md:w-20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>
                <User className="h-8 w-8 md:h-10 md:w-10" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 w-full sm:w-auto">
              <Label htmlFor="avatar-upload" className="text-xs md:text-sm font-medium">
                Profile Picture
              </Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                JPG, PNG or GIF. Max size 2MB.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs md:text-sm"
                  disabled={uploading}
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3 h-3 md:w-4 md:h-4 mr-2 animate-spin" />
                      <span className="text-xs md:text-sm">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                      <span className="text-xs md:text-sm">Upload Photo</span>
                    </>
                  )}
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs md:text-sm">
              <Mail className="h-3 w-3 md:h-4 md:w-4" />
              Email Address
            </Label>
            <Input
              value={user?.email || ""}
              disabled
              className="bg-muted text-xs md:text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          {/* User ID (Read-only) */}
          <div className="space-y-2">
            <Label className="text-xs md:text-sm">User ID</Label>
            <Input
              value={user?.id || ""}
              disabled
              className="bg-muted font-mono text-[10px] md:text-xs"
            />
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display-name" className="text-xs md:text-sm">Display Name</Label>
            <div className="flex gap-2">
              <Input
                id="display-name"
                placeholder="Enter your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="text-xs md:text-sm"
              />
              <Button
                onClick={handleUpdateDisplayName}
                disabled={loading || !displayName.trim()}
                size="sm"
                className="shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                ) : (
                  <Check className="w-3 h-3 md:w-4 md:h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This name will be shown to other users
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Key className="h-4 w-4 md:h-5 md:w-5" />
            Security
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-xs md:text-sm">New Password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="text-xs md:text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-xs md:text-sm">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="text-xs md:text-sm"
            />
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full text-xs md:text-sm"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 md:w-4 md:h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Change Password"
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            Password must be at least 6 characters long
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
