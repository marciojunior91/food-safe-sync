import { useState, useRef, ChangeEvent } from "react";
import { Camera, Upload, X, Loader2, ZoomIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploadProps {
  taskId: string;
  onUploadComplete?: (urls: string[]) => void;
  maxImages?: number;
  existingImages?: string[];
  canDelete?: boolean; // Permission to delete existing images
}

interface UploadedImage {
  id: string;
  url: string;
  file: File;
  uploading: boolean;
  error?: string;
}

export function ImageUpload({
  taskId,
  onUploadComplete,
  maxImages = 10,
  existingImages = [],
  canDelete = false,
}: ImageUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);

  // Debug logging
  console.log("🖼️ ImageUpload rendered with:", {
    taskId,
    existingImagesCount: existingImages.length,
    existingImages,
    newImagesCount: images.length,
    canDelete
  });

  // Handle file selection
  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Check max images limit
    if (images.length + existingImages.length + files.length > maxImages) {
      toast({
        title: "Too Many Images",
        description: `You can only upload up to ${maxImages} images per task`,
        variant: "destructive",
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      const isValidType = file.type.startsWith("image/");
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max

      if (!isValidType) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
      }

      if (!isValidSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 5MB limit`,
          variant: "destructive",
        });
      }

      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) return;

    // Create preview images
    const newImages: UploadedImage[] = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      file,
      uploading: true,
    }));

    setImages((prev) => [...prev, ...newImages]);

    // Upload images to Supabase Storage
    await uploadImages(newImages);
  };

  // Upload images to Supabase Storage
  const uploadImages = async (imagesToUpload: UploadedImage[]) => {
    setUploading(true);

    const uploadedUrls: string[] = [];

    for (const image of imagesToUpload) {
      try {
        // Generate unique filename
        const fileExt = image.file.name.split(".").pop();
        const fileName = `${taskId}/${crypto.randomUUID()}.${fileExt}`;
        const filePath = `task-attachments/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from("task-attachments")
          .upload(filePath, image.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("task-attachments").getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);

        // Save attachment record to database
        const { error: dbError } = await supabase
          .from("task_attachments")
          .insert({
            task_id: taskId,
            file_url: publicUrl,
            file_name: image.file.name,
            file_type: image.file.type,
            file_size: image.file.size,
          });

        if (dbError) {
          console.error("Database insert error:", dbError);
          throw new Error("Failed to save attachment record");
        }

        // Update image status
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id ? { ...img, uploading: false } : img
          )
        );
      } catch (error) {
        console.error("Upload error:", error);
        
        // Update image with error
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  uploading: false,
                  error: "Upload failed",
                }
              : img
          )
        );

        toast({
          title: "Upload Failed",
          description: `Failed to upload ${image.file.name}`,
          variant: "destructive",
        });
      }
    }

    setUploading(false);

    // Notify parent component
    if (uploadedUrls.length > 0 && onUploadComplete) {
      onUploadComplete(uploadedUrls);
      toast({
        title: "Upload Successful",
        description: `${uploadedUrls.length} image(s) uploaded successfully`,
      });
    }
  };

  // Remove image (newly uploaded, not yet saved)
  const handleRemoveImage = (imageId: string) => {
    setImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter((img) => img.id !== imageId);
    });
  };

  // Delete existing image from storage and database
  const handleDeleteExistingImage = async (imageUrl: string) => {
    if (!canDelete) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete images",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this image? This cannot be undone.")) {
      return;
    }

    setDeletingImage(imageUrl);
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/task-attachments/');
      if (urlParts.length < 2) {
        throw new Error("Invalid image URL");
      }
      const filePath = `task-attachments/${urlParts[1]}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("task-attachments")
        .remove([filePath]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        throw new Error("Failed to delete from storage");
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("task_attachments")
        .delete()
        .eq("file_url", imageUrl);

      if (dbError) {
        console.error("Database delete error:", dbError);
        throw new Error("Failed to delete from database");
      }

      toast({
        title: "Image Deleted",
        description: "The image has been removed successfully",
      });

      // Trigger reload by calling callback
      if (onUploadComplete) {
        onUploadComplete([]);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete image",
        variant: "destructive",
      });
    } finally {
      setDeletingImage(null);
    }
  };

  // Open file picker
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Open camera
  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleBrowseClick}
          disabled={uploading || images.length + existingImages.length >= maxImages}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          Browse Files
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleCameraClick}
          disabled={uploading || images.length + existingImages.length >= maxImages}
          className="gap-2"
        >
          <Camera className="w-4 h-4" />
          Take Photo
        </Button>

        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading...
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Image Grid */}
      {(images.length > 0 || existingImages.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* Existing images */}
          {existingImages.map((url, index) => (
            <Card key={`existing-${index}`} className="overflow-hidden">
              <CardContent className="p-0 relative group">
                <img
                  src={url}
                  alt={`Existing ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                
                {/* Deleting overlay */}
                {deletingImage === url && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                
                {/* Zoom button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setPreviewImage(url)}
                  disabled={deletingImage === url}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                
                {/* Delete button - only for admins/leaders/owners */}
                {canDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 left-1 bg-red-500/70 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteExistingImage(url)}
                    disabled={deletingImage === url}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Newly uploaded images */}
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <CardContent className="p-0 relative group">
                <img
                  src={image.url}
                  alt={image.file.name}
                  className="w-full h-32 object-cover"
                />

                {/* Loading overlay */}
                {image.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}

                {/* Error overlay */}
                {image.error && (
                  <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {image.error}
                    </span>
                  </div>
                )}

                {/* Action buttons */}
                {!image.uploading && !image.error && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setPreviewImage(image.url)}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 left-1 bg-red-500/70 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(image.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && existingImages.length === 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-center text-sm">
              No Images Attached
            </CardTitle>
            <CardDescription className="text-center">
              Add photos to document task completion using the buttons above
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Image count */}
      {(images.length > 0 || existingImages.length > 0) && (
        <p className="text-sm text-muted-foreground">
          {images.length + existingImages.length} of {maxImages} images
        </p>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-auto max-h-[70vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
