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

      // Wait a bit for DB to update, then check profile completion
      setTimeout(async () => {
        await checkAndUpdateProfileCompletion(memberId);
      }, 500);

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

  /**
   * Check if team member profile is complete and update flag
   * This is called after document upload to see if all requirements are met
   */
  const checkAndUpdateProfileCompletion = async (memberId: string): Promise<void> => {
    try {
      // Fetch team member data
      const { data: member, error: memberError } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;

      // Check if all required fields are filled
      const requiredFields = {
        display_name: member.display_name,
        email: member.email,
        phone: member.phone,
        position: member.position,
        hire_date: member.hire_date,
      };

      const optionalButImportant = {
        date_of_birth: member.date_of_birth,
        address: member.address,
        emergency_contact_name: member.emergency_contact_name,
        emergency_contact_phone: member.emergency_contact_phone,
      };

      // Profile is complete if all required fields are filled
      // and at least some important fields
      const allRequiredFilled = Object.values(requiredFields).every(field => field);
      const optionalFilledCount = Object.values(optionalButImportant).filter(field => field).length;
      const someOptionalFilled = optionalFilledCount >= 2;
      
      // Check if there are any active certificates
      const { data: certs, error: certsError } = await supabase
        .from('team_member_certificates')
        .select('id')
        .eq('team_member_id', memberId)
        .eq('status', 'active')
        .limit(1);

      if (certsError) throw certsError;

      const hasCertificates = certs && certs.length > 0;

      // Debug logging
      console.log(`[Profile Completion Check] Member: ${member.display_name}`);
      console.log('Required fields:', {
        allFilled: allRequiredFilled,
        fields: Object.entries(requiredFields).map(([key, val]) => ({ [key]: !!val }))
      });
      console.log('Optional fields:', {
        filled: optionalFilledCount,
        needed: 2,
        fields: Object.entries(optionalButImportant).map(([key, val]) => ({ [key]: !!val }))
      });
      console.log('Certificates:', { count: certs?.length || 0, hasActive: hasCertificates });

      // Profile is complete if:
      // 1. All required fields filled
      // 2. Some optional fields filled (at least 2)
      // 3. At least one certificate uploaded
      const isComplete = allRequiredFilled && someOptionalFilled && hasCertificates;

      console.log('Completion result:', {
        isComplete,
        currentFlag: member.profile_complete,
        willUpdate: member.profile_complete !== isComplete
      });

      // Update profile_complete flag if changed
      if (member.profile_complete !== isComplete) {
        const { error: updateError } = await supabase
          .from('team_members')
          .update({ profile_complete: isComplete })
          .eq('id', memberId);

        if (updateError) throw updateError;

        console.log(`✅ Profile completion updated for ${memberId}: ${isComplete}`);
        
        // Show toast notification
        toast({
          title: isComplete ? '🎉 Profile Complete!' : 'Profile Updated',
          description: isComplete 
            ? 'All required information has been provided.' 
            : 'Profile completion status updated.',
        });
      } else {
        console.log(`ℹ️ Profile completion unchanged: ${isComplete}`);
      }
    } catch (error) {
      console.error('[useTeamMemberDocuments] Error checking profile completion:', error);
      // Don't throw - this is a background check
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
