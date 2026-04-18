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
  role: "admin" | "manager" | "staff";
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
      role,
      organization_id,
    } = body;

    // Validate required fields
    if (!email || !display_name || !role || !organization_id) {
      throw new Error("Missing required fields: email, display_name, role, organization_id");
    }

    // Validate organization access
    if (organization_id !== requestingProfile.organization_id) {
      throw new Error("Cannot create users in other organizations");
    }

    console.log(`Creating auth user: ${email} with role ${role} for organization ${organization_id}`);

    // Step 1: Create user WITHOUT auto-confirming email so invite email is sent
    console.log(`Attempting to create user: ${email}`);
    
    const defaultPassword = 'TampaAPP@2026';
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: defaultPassword,
      email_confirm: true, // Auto-confirm so user can log in immediately
      user_metadata: {
        display_name: display_name,
        role: role,
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

    // Step 2: Send welcome email via Resend
    console.log('📧 Sending welcome email via Resend...');
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    let emailSent = false;
    
    if (RESEND_API_KEY) {
      try {
        const appUrl = Deno.env.get("APP_URL") || "https://www.tampahospo.com.au";
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Tampa APP <noreply@tampahospo.com.au>",
            to: [email],
            subject: "Welcome to Tampa Hospitality - Your Account is Ready",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 40px; }
                  .button { display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                  .credentials { background-color: #f0f4ff; border: 1px solid #d0d8f0; border-radius: 6px; padding: 16px; margin: 16px 0; }
                  .footer { color: #888; font-size: 12px; margin-top: 30px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h2>Welcome, ${display_name}! 🎉</h2>
                  <p>Your account on <strong>Tampa Hospitality</strong> has been created successfully.</p>
                  <div class="credentials">
                    <p><strong>Your login credentials:</strong></p>
                    <p>📧 Email: <strong>${email}</strong></p>
                    <p>🔑 Temporary Password: <strong>${defaultPassword}</strong></p>
                    <p style="color: #e53e3e; font-size: 13px;">⚠️ Please change your password after your first login.</p>
                  </div>
                  <p>Click the button below to log in:</p>
                  <a href="${appUrl}/login" class="button">Log In Now</a>
                  <div class="footer">
                    <p>If you didn't request this account, please contact support.</p>
                    <p>© ${new Date().getFullYear()} Tampa Hospitality</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          }),
        });

        if (emailResponse.ok) {
          emailSent = true;
          console.log('✅ Welcome email sent to', email);
        } else {
          const errorData = await emailResponse.json();
          console.warn('⚠️ Warning: Resend email failed:', JSON.stringify(errorData));
        }
      } catch (emailErr) {
        console.warn('⚠️ Warning: Could not send welcome email:', emailErr);
      }
    } else {
      console.warn('⚠️ RESEND_API_KEY not configured, skipping welcome email');
    }

    // Step 3: Create user_roles entry
    const { error: userRoleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        role: role,
        organization_id: organization_id,
        created_at: new Date().toISOString(),
      });

    if (userRoleError) {
      console.error("User role creation error:", userRoleError);
      // Clean up auth user (this will cascade delete the profile via trigger)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create user role: ${userRoleError.message}`);
    }
    
    console.log(`✓ User role created: ${role} for user ${authData.user.id}`);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "User created successfully.",
        data: {
          user_id: authData.user.id,
          email: email,
          display_name: display_name,
          role: role,
          organization_id: organization_id,
          emailSent: emailSent,
          note: emailSent 
            ? "Welcome email sent with login credentials." 
            : "User created. Default password: TampaAPP@2026",
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
