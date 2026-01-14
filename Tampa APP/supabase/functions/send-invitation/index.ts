// @ts-nocheck
// Supabase Edge Function: Send User Invitation
// Iteration 13 - MVP Sprint
// Sends email invitations to new auth users via Supabase Admin API
// This is a Deno runtime file - TypeScript checking handled by Deno, not Node.js

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  invitationId: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
  personalMessage?: string;
  inviterName: string;
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

    // Verify the request is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Verify the JWT
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid authentication token");
    }

    // Parse request body
    const body: InvitationRequest = await req.json();
    const {
      invitationId,
      email,
      role,
      organizationId,
      organizationName,
      personalMessage,
      inviterName,
    } = body;

    // Validate required fields
    if (!invitationId || !email || !role || !organizationId) {
      throw new Error("Missing required fields");
    }

    // Get the invitation token from database
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("user_invitations")
      .select("token")
      .eq("id", invitationId)
      .single();

    if (invitationError || !invitation) {
      throw new Error("Invitation not found");
    }

    // Generate invitation URL
    const invitationUrl = `${req.headers.get(
      "origin"
    )}/accept-invitation?token=${invitation.token}`;

    // Create email content
    const roleDisplayName = {
      admin: "Administrator",
      manager: "Manager",
      leader_chef: "Lead Chef",
    }[role] || role;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to Tampa APP</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Tampa APP</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Kitchen Management System</p>
  </div>
  
  <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #667eea; margin-top: 0;">You're Invited!</h2>
    
    <p style="font-size: 16px;">Hi there,</p>
    
    <p style="font-size: 16px;">
      <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> 
      as a <strong>${roleDisplayName}</strong> on Tampa APP.
    </p>
    
    ${
      personalMessage
        ? `
    <div style="background: #f7f7f7; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-style: italic; color: #555;">${personalMessage}</p>
    </div>
    `
        : ""
    }
    
    <p style="font-size: 16px;">
      Tampa APP is a comprehensive kitchen management system that helps food businesses 
      manage recipes, track inventory, schedule staff, and maintain food safety compliance.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${invitationUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; 
                font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
        Accept Invitation
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      This invitation will expire in 7 days. If you didn't expect this invitation, 
      you can safely ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; text-align: center;">
      Tampa APP - Professional Kitchen Management<br>
      If you have any questions, please contact <a href="mailto:support@tampaapp.com" style="color: #667eea;">support@tampaapp.com</a>
    </p>
  </div>
</body>
</html>
    `;

    const emailText = `
You're invited to Tampa APP!

${inviterName} has invited you to join ${organizationName} as a ${roleDisplayName} on Tampa APP.

${personalMessage ? `Personal message: ${personalMessage}\n\n` : ""}

Tampa APP is a comprehensive kitchen management system that helps food businesses manage recipes, track inventory, schedule staff, and maintain food safety compliance.

Click here to accept your invitation:
${invitationUrl}

This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.

---
Tampa APP - Professional Kitchen Management
    `;

    // Send invitation email via Supabase Auth Admin
    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          role,
          organization_id: organizationId,
          organization_name: organizationName,
          invitation_id: invitationId,
        },
        redirectTo: invitationUrl,
      });

    if (inviteError) {
      throw new Error(`Failed to send invitation: ${inviteError.message}`);
    }

    // Note: Supabase Auth sends its own email, but we could also use a custom email service
    // For custom emails, integrate with SendGrid, Postmark, or AWS SES here

    // Update invitation status
    const { error: updateError } = await supabaseAdmin
      .from("user_invitations")
      .update({ status: "sent" })
      .eq("id", invitationId);

    if (updateError) {
      console.error("Failed to update invitation status:", updateError);
      // Don't throw - email was sent successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation sent successfully",
        email,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending invitation:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send invitation",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
