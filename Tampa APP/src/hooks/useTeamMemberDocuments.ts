// ============================================================================
// useTeamMemberDocuments Hook
// ============================================================================
// Handles uploading, fetching, and deleting team member documents/certificates
// - Uploads files to Supabase Storage bucket: 'team-member-documents'
// - Saves metadata to team_member_certificates table
// - Organization-isolated with RLS
// ============================================================================

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TeamMemberDocument {
  id: string;
  team_member_id: string;
  certificate_name: string;
  certificate_type?: string;
  description?: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  issue_date?: string;
  expiration_date?: string;
  issued_by?: string;
  certificate_number?: string;
  status: 'active' | 'expired' | 'pending' | 'rejected';
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface UploadDocumentInput {
  file: File;
  certificate_name: string;
  certificate_type?: string;
  description?: string;
  issue_date?: string;
  expiration_date?: string;
  issued_by?: string;
  certificate_number?: string;
}

export function useTeamMemberDocuments(teamMemberId?: string) {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<TeamMemberDocument[]>([]);
  const { toast } = useToast();

  // IMPORTANT: Check your Supabase Storage dashboard for the exact bucket name!
  // Common names: 'team-member-documents' or 'team_member_documents'
  const BUCKET_NAME = 'team_member_documents';

  /**
   * Fetch all documents for a team member
   */
  const fetchDocuments = async (memberId?: string) => {
    if (!memberId && !teamMemberId) return;
    
    const targetId = memberId || teamMemberId;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('team_member_certificates')
        .select('*')
        .eq('team_member_id', targetId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments((data || []) as TeamMemberDocument[]);
      return data as TeamMemberDocument[];
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Upload a document to Supabase Storage and create database record
   */
  const uploadDocument = async (
    memberId: string,
    input: UploadDocumentInput
  ): Promise<TeamMemberDocument | null> => {
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Generate unique file path
      const fileExt = input.file.name.split('.').pop();
      const fileName = `${memberId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, input.file, {
          contentType: input.file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      // Create database record
      const { data: certData, error: certError } = await supabase
        .from('team_member_certificates')
        .insert({
          team_member_id: memberId,
          certificate_name: input.certificate_name,
          certificate_type: input.certificate_type,
          description: input.description,
          file_url: publicUrl,
          file_type: input.file.type,
          file_size: input.file.size,
          issue_date: input.issue_date,
          expiration_date: input.expiration_date,
          issued_by: input.issued_by,
          certificate_number: input.certificate_number,
          status: 'active',
          verification_status: 'pending',
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();

      if (certError) {
        // If database insert fails, delete the uploaded file
        await supabase.storage.from(BUCKET_NAME).remove([fileName]);
        throw certError;
      }

      toast({
        title: 'Success',
        description: 'Document uploaded successfully.',
      });

      // Update local state
      setDocuments(prev => [certData as TeamMemberDocument, ...prev]);

      return certData as TeamMemberDocument;
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload document.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a document (removes from storage and database)
   */
  const deleteDocument = async (documentId: string): Promise<boolean> => {
    setLoading(true);

    try {
      // Get document info
      const { data: doc, error: fetchError } = await supabase
        .from('team_member_certificates')
        .select('file_url')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      // Extract file path from URL
      const url = new URL(doc.file_url);
      const filePath = url.pathname.split('/').slice(-2).join('/'); // Get last two segments (folder/filename)

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (storageError) {
        console.warn('Storage deletion warning:', storageError);
        // Continue even if storage deletion fails
      }

      // Delete database record
      const { error: deleteError } = await supabase
        .from('team_member_certificates')
        .delete()
        .eq('id', documentId);

      if (deleteError) throw deleteError;

      toast({
        title: 'Success',
        description: 'Document deleted successfully.',
      });

      // Update local state
      setDocuments(prev => prev.filter(d => d.id !== documentId));

      return true;
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete document.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update document metadata (not the file itself)
   */
  const updateDocument = async (
    documentId: string,
    updates: Partial<TeamMemberDocument>
  ): Promise<boolean> => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('team_member_certificates')
        .update({
          ...updates,
          updated_by: user.id,
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Document updated successfully.',
      });

      // Update local state
      setDocuments(prev =>
        prev.map(d => (d.id === documentId ? data as TeamMemberDocument : d))
      );

      return true;
    } catch (error: any) {
      console.error('Error updating document:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update document.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    documents,
    loading,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    updateDocument,
  };
}
