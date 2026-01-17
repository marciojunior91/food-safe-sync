// ============================================================================
// DocumentUpload - Upload and manage team member documents
// ============================================================================
// Supports PDF and image files (JPG, PNG, WEBP)
// Uploads to Supabase Storage and saves to team_member_certificates table
// Displays uploaded documents with preview and delete options
// ============================================================================

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Upload, X, Image as ImageIcon, Download, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTeamMemberDocuments, TeamMemberDocument } from '@/hooks/useTeamMemberDocuments';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  file?: File;
  preview?: string;
}

interface DocumentUploadProps {
  teamMemberId?: string;
  documents?: Document[];
  onDocumentsChange?: (documents: Document[]) => void;
  maxFiles?: number;
  maxSizeInMB?: number;
}

export function DocumentUpload({
  teamMemberId,
  documents = [],
  onDocumentsChange,
  maxFiles = 10,
  maxSizeInMB = 10,
}: DocumentUploadProps) {
  const { toast } = useToast();
  const { 
    documents: dbDocuments, 
    loading: uploading, 
    fetchDocuments, 
    uploadDocument, 
    deleteDocument 
  } = useTeamMemberDocuments(teamMemberId);
  
  const [localDocs, setLocalDocs] = useState<Document[]>(documents);

  // Fetch existing documents when component mounts or teamMemberId changes
  useEffect(() => {
    if (teamMemberId) {
      fetchDocuments(teamMemberId);
    }
  }, [teamMemberId]);

  // Convert database documents to local format for display
  useEffect(() => {
    const convertedDocs: Document[] = dbDocuments.map(dbDoc => ({
      id: dbDoc.id,
      name: dbDoc.certificate_name,
      type: dbDoc.file_type || 'application/octet-stream',
      size: dbDoc.file_size || 0,
      url: dbDoc.file_url,
    }));
    setLocalDocs(convertedDocs);
  }, [dbDocuments]);

  const acceptedFileTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!teamMemberId) {
      toast({
        title: 'Error',
        description: 'Team member ID is required to upload documents.',
        variant: 'destructive',
      });
      return;
    }

    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!acceptedFileTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a supported format. Please upload PDF or image files.`,
          variant: 'destructive',
        });
        continue;
      }

      // Validate file size
      if (file.size > maxSizeInBytes) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds ${maxSizeInMB}MB. Please choose a smaller file.`,
          variant: 'destructive',
        });
        continue;
      }

      // Check max files limit
      if (localDocs.length >= maxFiles) {
        toast({
          title: 'Maximum files reached',
          description: `You can upload a maximum of ${maxFiles} files.`,
          variant: 'destructive',
        });
        break;
      }

      // Upload file to Supabase
      await uploadDocument(teamMemberId, {
        file: file,
        certificate_name: file.name,
        certificate_type: file.type.startsWith('image/') ? 'photo' : 'certificate',
        description: `Uploaded ${file.name}`,
      });
    }

    // Reset input
    event.target.value = '';
  };

  const handleRemoveDocument = async (docId: string) => {
    const success = await deleteDocument(docId);
    
    if (success) {
      // Document already removed from state by the hook
      if (onDocumentsChange) {
        const updatedDocs = localDocs.filter(doc => doc.id !== docId);
        onDocumentsChange(updatedDocs);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <ImageIcon className="w-8 h-8 text-blue-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          className="relative"
          disabled={localDocs.length >= maxFiles || uploading || !teamMemberId}
        >
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={localDocs.length >= maxFiles || uploading || !teamMemberId}
          />
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Attach Documents
            </>
          )}
        </Button>
        <div className="text-sm text-muted-foreground">
          {localDocs.length}/{maxFiles} files • Max {maxSizeInMB}MB per file
        </div>
      </div>

      {!teamMemberId && (
        <p className="text-xs text-amber-600">
          Save the team member first to enable document uploads.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Supported formats: PDF, JPG, PNG, WEBP
      </p>

      {/* Uploaded Documents List */}
      {localDocs.length > 0 && (
        <div className="space-y-2">
          <Label>Uploaded Documents ({localDocs.length})</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {localDocs.map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    {/* File Icon or Preview */}
                    <div className="flex-shrink-0">
                      {doc.url && doc.type.startsWith('image/') ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                          <img
                            src={doc.url}
                            alt={doc.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                          {getFileIcon(doc.type)}
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={doc.name}>
                        {doc.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.size)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {doc.url && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={() => window.open(doc.url, '_blank')}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = doc.url!;
                                a.download = doc.name;
                                a.click();
                              }}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      onClick={() => handleRemoveDocument(doc.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {localDocs.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No documents uploaded yet</p>
          <p className="text-xs mt-1">
            {teamMemberId 
              ? "Click \"Attach Documents\" to upload certificates and files"
              : "Save the team member first to upload documents"
            }
          </p>
        </div>
      )}
    </div>
  );
}