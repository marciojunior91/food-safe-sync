// Test script to check if invite-user function exists
// Run this in browser console

async function testInviteFunction() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  console.log('Testing invite-user function...');
  console.log('Supabase URL:', supabaseUrl);
  
  // Get current session
  const { data: { session } } = await window.supabase.auth.getSession();
  
  if (!session) {
    console.error('❌ No session found');
    return;
  }
  
  console.log('✅ Session found');
  
  // Try to call the function
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/invite-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: 'test@example.com',
          display_name: 'Test User',
          role_type: 'staff',
          organization_id: 'test-org-id',
        }),
      }
    );
    
    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response body:', result);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run test
testInviteFunction();
