# Sprint 2 - Create Test Users
# Creates 4 test users with predefined credentials

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sprint 2: Creating Test Users" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SUPABASE_URL = "https://imnecvcvhypnlvujajpn.supabase.co"
$SUPABASE_ANON_KEY = $env:VITE_SUPABASE_ANON_KEY

if (-not $SUPABASE_ANON_KEY) {
    Write-Host "ERROR: VITE_SUPABASE_ANON_KEY environment variable not set" -ForegroundColor Red
    Write-Host "Please set it in your .env file or environment" -ForegroundColor Yellow
    exit 1
}

# Test users to create
$users = @(
    @{
        email = "cooktampaapp@hotmail.com"
        password = "TAMPAPP123"
        display_name = "Cook Test User"
        role_type = "cook"
        position = "Line Cook"
    },
    @{
        email = "baristatampaapp@hotmail.com"
        password = "TAMPAPP123"
        display_name = "Barista Test User"
        role_type = "barista"
        position = "Barista"
    },
    @{
        email = "leadercheftampaapp@gmail.com"
        password = "TAMPAAPP123"
        display_name = "Leader Chef Test User"
        role_type = "leader_chef"
        position = "Head Chef"
    },
    @{
        email = "admtampaapp@hotmail.com"
        password = "TAMPAPP123"
        display_name = "Admin Test User"
        role_type = "admin"
        position = "Restaurant Manager"
    }
)

Write-Host "You need to provide:" -ForegroundColor Yellow
Write-Host "  1. Your admin/manager authentication token" -ForegroundColor Yellow
Write-Host "  2. Your organization_id" -ForegroundColor Yellow
Write-Host "  3. (Optional) department_id for each user" -ForegroundColor Yellow
Write-Host ""

$authToken = Read-Host "Enter your auth token (from browser developer tools)"
$organizationId = Read-Host "Enter your organization_id"

Write-Host ""
Write-Host "Creating users..." -ForegroundColor Green
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($user in $users) {
    Write-Host "Creating: $($user.display_name) ($($user.email))..." -ForegroundColor Cyan
    
    $body = @{
        email = $user.email
        password = $user.password
        display_name = $user.display_name
        role_type = $user.role_type
        organization_id = $organizationId
        position = $user.position
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod `
            -Uri "$SUPABASE_URL/functions/v1/create-user-with-credentials" `
            -Method Post `
            -Headers @{
                "Authorization" = "Bearer $authToken"
                "Content-Type" = "application/json"
                "apikey" = $SUPABASE_ANON_KEY
            } `
            -Body $body

        if ($response.success) {
            Write-Host "  ✓ SUCCESS: User created" -ForegroundColor Green
            Write-Host "    User ID: $($response.data.user_id)" -ForegroundColor Gray
            Write-Host "    Team Member ID: $($response.data.team_member_id)" -ForegroundColor Gray
            $successCount++
        } else {
            Write-Host "  ✗ FAILED: $($response.error)" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "  ✗ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Success: $successCount" -ForegroundColor Green
Write-Host "  Failed: $failCount" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "Test Credentials:" -ForegroundColor Yellow
    foreach ($user in $users) {
        Write-Host "  $($user.email) / $($user.password)" -ForegroundColor Gray
    }
}
