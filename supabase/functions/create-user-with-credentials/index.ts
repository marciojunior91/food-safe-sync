// @ts-nocheck
// Supabase Edge Function: Create User with Credentials
// Sprint 2 - Module 1: People & Authentication
// Creates auth user with email/password and associates with team_member and department

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  display_name: string;
  role_type: "cook" | "barista" | "manager" | "leader_chef" | "admin";
  department_id?: string;
  organization_id: string;
  position?: string;
  phone?: string;
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

    // Verify the request is authenticated (only admins can create users)
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

    // Check if requesting user has admin/manager role from user_roles table
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
      throw new Error("Insufficient permissions. Only admins and managers can create users.");
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
    const body: CreateUserRequest = await req.json();
    const {
      email,
      password,
      display_name,
      role_type,
      department_id,
      organization_id,
      position,
      phone,
    } = body;

    // Validate required fields
    if (!email || !password || !display_name || !role_type || !organization_id) {
      throw new Error("Missing required fields: email, password, display_name, role_type, organization_id");
    }

    // Validate organization access
    if (organization_id !== requestingProfile.organization_id) {
      throw new Error("Cannot create users for other organizations");
    }

    console.log(`Creating user ${email} with role ${role_type} for organization ${organization_id}`);

    // Step 1: Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        display_name: display_name,
        role_type: role_type,
      },
    });

    if (authError) {
      console.error("Auth user creation error:", authError);
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    console.log(`Auth user created with ID: ${authUser.user.id}`);

    // Step 2: Create profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: authUser.user.id,
        email: email,
        display_name: display_name,
        organization_id: organization_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Attempt to clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    console.log(`Profile created for user ${authUser.user.id}`);

    // Step 3: Create user_roles entry
    const { error: userRoleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: authUser.user.id,
        role: role_type,
        created_at: new Date().toISOString(),
      });

    if (userRoleError) {
      console.error("User role creation error:", userRoleError);
      // Attempt to clean up auth user and profile if role creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("user_id", authUser.user.id);
      throw new Error(`Failed to create user role: ${userRoleError.message}`);
    }

    console.log(`User role created: ${role_type} for user ${authUser.user.id}`);

    // Step 4: Create team member
    const { data: teamMember, error: teamMemberError } = await supabaseAdmin
      .from("team_members")
      .insert({
        display_name: display_name,
        email: email,
        phone: phone,
        position: position,
        role_type: role_type,
        department_id: department_id,
        organization_id: organization_id,
        auth_role_id: authUser.user.id,
        is_active: true,
        profile_complete: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: requestingUser.id,
      })
      .select()
      .single();

    if (teamMemberError) {
      console.error("Team member creation error:", teamMemberError);
      // Attempt to clean up
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", authUser.user.id);
      await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("user_id", authUser.user.id);
      throw new Error(`Failed to create team member: ${teamMemberError.message}`);
    }

    console.log(`Team member created with ID: ${teamMember.id}`);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "User created successfully",
        data: {
          user_id: authUser.user.id,
          team_member_id: teamMember.id,
          email: email,
          display_name: display_name,
          role_type: role_type,
          organization_id: organization_id,
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
