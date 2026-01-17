// @ts-nocheck
// Supabase Edge Function: Create Auth User
// Sprint 2 - Module 1: People & Authentication
// Creates authentication user account with profile and role

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateAuthUserRequest {
  email: string;
  display_name: string;
  role_type: "cook" | "barista" | "manager" | "leader_chef" | "admin";
  organization_id: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the request is authenticated (only admins can invite users)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Verify the JWT
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: requestingUser },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !requestingUser) {
      throw new Error("Invalid authentication token");
    }

    // Check if requesting user has admin/manager role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    if (roleError || !userRole) {
      console.error("Role lookup error:", roleError);
      throw new Error("Unable to determine user role");
    }

    console.log(`Requesting user role: ${userRole.role}`);

    if (!["admin", "manager"].includes(userRole.role)) {
      throw new Error("Insufficient permissions. Only admins and managers can invite users.");
    }

    // Get requesting user's organization
    const { data: requestingProfile } = await supabaseAdmin
      .from("profiles")
      .select("organization_id")
      .eq("user_id", requestingUser.id)
      .single();

    if (!requestingProfile) {
      throw new Error("Unable to determine user organization");
    }

    // Parse request body
    const body: CreateAuthUserRequest = await req.json();
    const {
      email,
      display_name,
      role_type,
      organization_id,
    } = body;

    // Validate required fields
    if (!email || !display_name || !role_type || !organization_id) {
      throw new Error("Missing required fields: email, display_name, role_type, organization_id");
    }

    // Validate organization access
    if (organization_id !== requestingProfile.organization_id) {
      throw new Error("Cannot create users in other organizations");
    }

    console.log(`Creating auth user: ${email} with role ${role_type} for organization ${organization_id}`);

    // Step 1: Create user WITHOUT auto-confirming email so invite email is sent
    console.log(`Attempting to create user: ${email}`);
    
    const defaultPassword = 'TampaAPP@2026';
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: defaultPassword,
      email_confirm: false, // Changed to false to trigger invite email
      user_metadata: {
        display_name: display_name,
        role_type: role_type,
        organization_id: organization_id,
      },
    });

    if (authError) {
      console.error("User creation error details:", JSON.stringify(authError, null, 2));
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    if (!authData || !authData.user) {
      console.error("No user data returned");
      throw new Error("Failed to create user - no data returned");
    }

    console.log(`✓ User created: ${email}, user ID: ${authData.user.id}`);
    console.log('✓ Profile automatically created by handle_new_user trigger');

    // Step 2: Send invitation email (confirmation email)
    console.log('📧 Sending invitation email...');
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${req.headers.get('origin') || Deno.env.get('SUPABASE_URL')}/auth/callback`,
    });

    if (inviteError) {
      console.warn('⚠️ Warning: Could not send invitation email:', inviteError);
    } else {
      console.log('✅ Invitation email sent to', email);
    }

    // Step 3: Send password reset email
    console.log('📧 Sending password reset email...');
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${req.headers.get('origin') || Deno.env.get('SUPABASE_URL')}/auth/callback`,
    });

    if (resetError) {
      console.warn('⚠️ Warning: Could not send password reset email:', resetError);
    } else {
      console.log('✅ Password reset email sent to', email);
    }

    // Step 4: Create user_roles entry
    const { error: userRoleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        role: role_type,
        created_at: new Date().toISOString(),
      });

    if (userRoleError) {
      console.error("User role creation error:", userRoleError);
      // Clean up auth user (this will cascade delete the profile via trigger)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create user role: ${userRoleError.message}`);
    }
    
    console.log(`✓ User role created: ${role_type} for user ${authData.user.id}`);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "User created successfully. Invitation and password reset emails sent.",
        data: {
          user_id: authData.user.id,
          email: email,
          display_name: display_name,
          role: role_type,
          organization_id: organization_id,
          note: "User will receive invitation and password reset emails. Default password (TampaAPP@2026) can be used as backup.",
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating user:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
