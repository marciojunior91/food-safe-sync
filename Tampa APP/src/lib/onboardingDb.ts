// Onboarding Database Integration
// Iteration 13 - MVP Sprint
// Handles all database operations for the onboarding flow

import { supabase } from "@/integrations/supabase/client";
import {
  RegistrationData,
  CompanyData,
  ProductImportData,
  TeamMembersData,
  InviteUsersData,
} from "@/types/onboarding";

// Hash PIN using Web Crypto API (browser-compatible)
async function hashPIN(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Step 1: Register User (Profile will be created after organization in Step 2)
export async function registerUser(data: RegistrationData) {
  try {
    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          display_name: `${data.firstName} ${data.lastName}`,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // Note: Profile creation will be handled in createOrganization step
    // because profiles table requires organization_id (NOT NULL)

    return {
      success: true,
      userId: authData.user.id,
      session: authData.session,
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.message || 'Failed to register user',
    };
  }
}

// Step 2: Create Organization and Profile
export async function createOrganization(data: CompanyData, userId: string) {
  try {
    // Get user data for display name
    const { data: { user } } = await supabase.auth.getUser();
    const displayName = user?.user_metadata?.display_name || 
                       `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim() ||
                       user?.email?.split('@')[0] || 
                       'User';

    // Create organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: data.businessName,
        business_type: data.businessType,
        abn: data.abn || null,
        acn: data.acn || null,
        address_street: data.address.street,
        address_city: data.address.city,
        address_state: data.address.state,
        address_postcode: data.address.postcode,
        address_country: data.address.country,
        phone: data.phone,
        website: data.website || null,
        owner_id: userId,
      })
      .select()
      .single();

    if (orgError) throw orgError;
    if (!orgData) throw new Error('Organization creation failed');

    // Create profile with organization_id (required field)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        organization_id: orgData.id,
        display_name: displayName,
        email: user?.email || null,
        onboarding_completed: false,
      });

    if (profileError) {
      // Profile might already exist from trigger, try updating instead
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          organization_id: orgData.id,
          display_name: displayName,
        })
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
    }

    // Assign owner role to user
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'owner',
        organization_id: orgData.id,
      });

    if (roleError) throw roleError;

    return {
      success: true,
      organizationId: orgData.id,
      organization: orgData,
    };
  } catch (error: any) {
    console.error('Organization creation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create organization',
    };
  }
}

// Step 3: Import Products/Recipes
export async function importProducts(data: ProductImportData, organizationId: string, userId: string) {
  try {
    if (!data.products || data.products.length === 0) {
      return {
        success: true,
        imported: 0,
        message: 'No products to import',
      };
    }

    // Prepare products for insertion
    const productsToInsert = data.products.map(product => ({
      name: product.name,
      category: product.category,
      allergens: product.allergens || [],
      dietary_requirements: product.dietary_requirements || [],
      ingredients: { description: product.description || '' },
      prep_steps: [],
      yield_amount: 1,
      yield_unit: 'serving',
      hold_time_days: 3, // Default
      estimated_prep_minutes: 30, // Default
      service_gap_minutes: 0, // Default
      created_by: userId,
      // Note: organization_id might not exist in recipes table
      // Check schema and adjust accordingly
    }));

    // Bulk insert
    const { data: insertedData, error: insertError } = await supabase
      .from('recipes')
      .insert(productsToInsert)
      .select();

    if (insertError) throw insertError;

    return {
      success: true,
      imported: insertedData?.length || 0,
      products: insertedData,
    };
  } catch (error: any) {
    console.error('Product import error:', error);
    return {
      success: false,
      error: error.message || 'Failed to import products',
      imported: 0,
    };
  }
}

// Step 4: Create Team Members
export async function createTeamMembers(data: TeamMembersData, organizationId: string) {
  try {
    if (!data.teamMembers || data.teamMembers.length === 0) {
      return {
        success: true,
        created: 0,
        message: 'No team members to create',
      };
    }

    // Hash PINs and prepare for insertion
    const teamMembersToInsert = await Promise.all(
      data.teamMembers.map(async (member) => ({
        display_name: member.displayName,
        role: member.role,
        pin_hash: await hashPIN(member.pin),
        email: member.email || null,
        phone: member.phone || null,
        notes: member.notes || null,
        organization_id: organizationId,
        is_active: true,
        profile_complete: !!(member.email && member.phone), // Basic completion check
      }))
    );

    // Bulk insert
    const { data: insertedData, error: insertError } = await supabase
      .from('team_members')
      .insert(teamMembersToInsert)
      .select();

    if (insertError) throw insertError;

    return {
      success: true,
      created: insertedData?.length || 0,
      teamMembers: insertedData,
    };
  } catch (error: any) {
    console.error('Team members creation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create team members',
      created: 0,
    };
  }
}

// Step 5: Send User Invitations
export async function sendUserInvitations(
  data: InviteUsersData,
  organizationId: string,
  userId: string,
  organizationName: string = 'Your Organization'
) {
  try {
    if (!data.invitations || data.invitations.length === 0) {
      return {
        success: true,
        sent: 0,
        message: 'No invitations to send',
      };
    }

    // Get current user's name
    const { data: profileData } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', userId)
      .single();

    const inviterName = profileData?.display_name || 'A team member';

    const results = [];
    const errors = [];

    // Send invitations one by one
    for (const invitation of data.invitations) {
      try {
        // Create invitation record
        const { data: inviteData, error: inviteError } = await supabase
          .from('user_invitations')
          .insert({
            email: invitation.email,
            role: invitation.role,
            organization_id: organizationId,
            invited_by: userId,
            personal_message: invitation.personalMessage || null,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          })
          .select()
          .single();

        if (inviteError) {
          errors.push({ email: invitation.email, error: inviteError.message });
          continue;
        }

        // Call Edge Function to send email
        try {
          const { data: session } = await supabase.auth.getSession();
          
          const { data: emailData, error: emailError } = await supabase.functions.invoke(
            'send-invitation',
            {
              body: {
                invitationId: inviteData.id,
                email: invitation.email,
                role: invitation.role,
                organizationId,
                organizationName,
                personalMessage: invitation.personalMessage,
                inviterName,
              },
              headers: {
                Authorization: `Bearer ${session?.session?.access_token}`,
              },
            }
          );

          if (emailError) {
            console.error('Email sending failed:', emailError);
            // Don't fail completely - invitation record was created
            results.push({
              email: invitation.email,
              invitationId: inviteData.id,
              emailSent: false,
              warning: 'Invitation created but email failed to send',
            });
          } else {
            results.push({
              email: invitation.email,
              invitationId: inviteData.id,
              emailSent: true,
            });
          }
        } catch (emailError: any) {
          console.error('Email error:', emailError);
          results.push({
            email: invitation.email,
            invitationId: inviteData.id,
            emailSent: false,
            warning: 'Invitation created but email failed to send',
          });
        }
      } catch (error: any) {
        errors.push({ email: invitation.email, error: error.message });
      }
    }

    return {
      success: errors.length === 0,
      sent: results.length,
      failed: errors.length,
      results,
      errors,
    };
  } catch (error: any) {
    console.error('User invitations error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send invitations',
      sent: 0,
    };
  }
}

// Complete Onboarding Flow
export async function completeOnboarding(
  registrationData: RegistrationData,
  companyData: CompanyData,
  productsData: ProductImportData,
  teamMembersData: TeamMembersData,
  inviteUsersData: InviteUsersData
) {
  try {
    // Step 1: Register User
    const registerResult = await registerUser(registrationData);
    if (!registerResult.success || !registerResult.userId) {
      throw new Error(registerResult.error || 'User registration failed');
    }

    const userId = registerResult.userId;

    // Step 2: Create Organization
    const orgResult = await createOrganization(companyData, userId);
    if (!orgResult.success || !orgResult.organizationId) {
      throw new Error(orgResult.error || 'Organization creation failed');
    }

    const organizationId = orgResult.organizationId;
    const organizationName = companyData.businessName || 'Your Organization';

    // Step 3: Import Products (optional)
    const productsResult = await importProducts(productsData, organizationId, userId);
    
    // Step 4: Create Team Members (optional)
    const teamResult = await createTeamMembers(teamMembersData, organizationId);
    
    // Step 5: Send Invitations (optional)
    const invitesResult = await sendUserInvitations(
      inviteUsersData,
      organizationId,
      userId,
      organizationName
    );

    // Mark onboarding as complete
    const { error: completeError } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (completeError) {
      console.error('Failed to mark onboarding complete:', completeError);
    }

    return {
      success: true,
      userId,
      organizationId,
      productsImported: productsResult.imported || 0,
      teamMembersCreated: teamResult.created || 0,
      invitationsSent: invitesResult.sent || 0,
      session: registerResult.session,
    };
  } catch (error: any) {
    console.error('Complete onboarding error:', error);
    return {
      success: false,
      error: error.message || 'Failed to complete onboarding',
    };
  }
}

// Verify PIN (for team member login)
export async function verifyTeamMemberPIN(pin: string, organizationId: string) {
  try {
    const pinHash = await hashPIN(pin);
    
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('pin_hash', pinHash)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: 'Invalid PIN or team member not found',
      };
    }

    return {
      success: true,
      teamMember: data,
    };
  } catch (error: any) {
    console.error('PIN verification error:', error);
    return {
      success: false,
      error: error.message || 'PIN verification failed',
    };
  }
}
