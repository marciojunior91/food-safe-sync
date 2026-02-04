# Implementation Guide - Routine Tasks, Resend & Vercel

## 4. Routine Tasks - Required Fixes

### Issue A: Custom Frequency Period Input

**Current State:**
- Fixed frequencies: Daily, Weekly, Biweekly (14 days), Monthly (30 days)
- No custom period input

**Required Changes:**

#### Step 1: Add "Custom" frequency option
**File:** `src/components/routine-tasks/TaskForm.tsx`

Add after the "Monthly" radio option (around line 770):

```tsx
<div className="flex items-center space-x-2">
  <RadioGroupItem value="custom" id="custom" />
  <Label 
    htmlFor="custom" 
    className="font-normal cursor-pointer flex items-center gap-2"
  >
    <span className="text-lg">⚙️</span>
    <div>
      <div className="font-medium">Custom</div>
      <div className="text-xs text-muted-foreground">Set your own period</div>
    </div>
  </Label>
</div>
```

#### Step 2: Add custom period input field

Add after the RadioGroup closes (around line 775):

```tsx
{/* Custom Period Input - Only show if "custom" is selected */}
{form.watch("recurrence_frequency") === "custom" && (
  <FormField
    control={form.control}
    name="custom_period_days"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Repeat Every (Days) *</FormLabel>
        <FormControl>
          <Input
            type="number"
            min="1"
            max="365"
            placeholder="e.g., 3 for every 3 days"
            {...field}
            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
          />
        </FormControl>
        <FormDescription>
          Task will repeat every {field.value || 1} days
        </FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
)}
```

#### Step 3: Update schema

Find the `formSchema` at the top of TaskForm.tsx (around line 85):

```tsx
// CHANGE FROM:
recurrence_frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]).optional(),

// TO:
recurrence_frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "custom"]).optional(),
custom_period_days: z.number().min(1).max(365).optional(),
```

#### Step 4: Update submit handler

In the `handleSubmit` function (around line 237-260), add custom handling:

```tsx
if (data.is_recurring && data.recurrence_frequency) {
  let frequency: 'daily' | 'weekly' | 'monthly' = 'daily';
  let interval = 1;

  if (data.recurrence_frequency === 'daily') {
    frequency = 'daily';
    interval = 1;
  } else if (data.recurrence_frequency === 'weekly') {
    frequency = 'weekly';
    interval = 1;
  } else if (data.recurrence_frequency === 'biweekly') {
    frequency = 'weekly';
    interval = 2;
  } else if (data.recurrence_frequency === 'monthly') {
    frequency = 'monthly';
    interval = 1;
  } else if (data.recurrence_frequency === 'custom' && data.custom_period_days) {
    frequency = 'daily';
    interval = data.custom_period_days;
  }

  taskData.recurrence_rule = createRecurrenceRule(
    frequency,
    interval,
    data.recurrence_end_date
  );
}
```

---

### Issue B: "Add Task" Button Logic

**Current State:**
- "New Task" button always visible
- No conditional "Add Task" button based on daily tasks

**Required Changes:**

**File:** `src/pages/TasksOverview.tsx`

Around line 970 (where "New Task" button is), replace with:

```tsx
{/* Smart Task Button - Shows "Add Task" only if no tasks for today */}
<Button 
  onClick={() => setIsCreateDialogOpen(true)}
  className="gap-2"
>
  <Plus className="w-4 h-4" />
  {todayTasks.length === 0 ? "Add Task" : "New Task"}
</Button>
```

**Explanation:**
- If `todayTasks.length === 0`: Shows "Add Task"
- If `todayTasks.length > 0`: Shows "New Task"
- Same button, different text based on context

---

### Issue C: Tabs Invading Info on iPad

**Current Location:** Line 1032 in TasksOverview.tsx

```tsx
<TabsList className="grid w-full grid-cols-4">
```

**Fix:** Apply the same pattern as Settings.tsx

```tsx
<TabsList className="grid w-full grid-cols-4 h-auto p-1">
  <TabsTrigger value="today" className="gap-2 py-2 px-3">
    <span>Today</span>
    {todayTasks.length > 0 && (
      <Badge variant="secondary" className="ml-1">
        {todayTasks.length}
      </Badge>
    )}
  </TabsTrigger>
  <TabsTrigger value="overdue" className="gap-2 py-2 px-3">
    <span>Overdue</span>
    {overdueTasks.length > 0 && (
      <Badge variant="destructive" className="ml-1">
        {overdueTasks.length}
      </Badge>
    )}
  </TabsTrigger>
  <TabsTrigger value="in-progress" className="gap-2 py-2 px-3">
    <span>In Progress</span>
    {inProgressTasks.length > 0 && (
      <Badge variant="secondary" className="ml-1">
        {inProgressTasks.length}
      </Badge>
    )}
  </TabsTrigger>
  <TabsTrigger value="all" className="py-2 px-3">All Tasks</TabsTrigger>
</TabsList>
```

**Changes:**
- Add `h-auto p-1` to TabsList
- Add `py-2 px-3` to each TabsTrigger

---

## 5. Resend Email Integration Guide

### Prerequisites
✅ You have Resend API credentials

### Step 1: Install Resend Package

```bash
npm install resend
```

### Step 2: Add Environment Variables

**File:** `.env.local`

```env
# Resend Email
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### Step 3: Create Supabase Edge Function

**Create:** `supabase/functions/send-email/index.ts`

```typescript
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const { to, subject, html, from } = await req.json();
    
    const data = await resend.emails.send({
      from: from || Deno.env.get('RESEND_FROM_EMAIL') || 'Tampa APP <noreply@yourdomain.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });
    
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Email send error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
```

### Step 4: Deploy Edge Function to Supabase

```bash
# Login to Supabase CLI (if not already)
npx supabase login

# Link to your project
npx supabase link --project-ref your-project-ref

# Set secrets
npx supabase secrets set RESEND_API_KEY=re_your_api_key_here
npx supabase secrets set RESEND_FROM_EMAIL=noreply@yourdomain.com

# Deploy function
npx supabase functions deploy send-email
```

### Step 5: Create Email Service Helper

**Create:** `src/lib/email/emailService.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: options,
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}

// Example: Send welcome email
export async function sendWelcomeEmail(userEmail: string, userName: string) {
  return sendEmail({
    to: userEmail,
    subject: 'Welcome to Tampa APP!',
    html: `
      <h1>Welcome ${userName}!</h1>
      <p>Thanks for joining Tampa APP. We're excited to have you on board.</p>
      <p>Get started by completing your profile and exploring the dashboard.</p>
    `,
  });
}

// Example: Send expiring items alert
export async function sendExpiringItemsAlert(
  userEmail: string,
  userName: string,
  items: Array<{ name: string; daysUntilExpiry: number }>
) {
  const itemsList = items.map(item => 
    `<li><strong>${item.name}</strong> - ${item.daysUntilExpiry} days left</li>`
  ).join('');

  return sendEmail({
    to: userEmail,
    subject: '⚠️ Items Expiring Soon',
    html: `
      <h1>Hello ${userName},</h1>
      <p>You have items that are expiring soon:</p>
      <ul>${itemsList}</ul>
      <p>Please check your inventory and take action.</p>
    `,
  });
}
```

### Step 6: Test Email Sending

**Create:** `src/pages/TestEmail.tsx` (for testing only)

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sendEmail } from '@/lib/email/emailService';
import { toast } from 'sonner';

export default function TestEmail() {
  const [to, setTo] = useState('');
  const [sending, setSending] = useState(false);

  const handleTest = async () => {
    setSending(true);
    const result = await sendEmail({
      to,
      subject: 'Test Email from Tampa APP',
      html: '<h1>Test</h1><p>This is a test email from Tampa APP.</p>',
    });
    
    if (result.success) {
      toast.success('Email sent successfully!');
    } else {
      toast.error('Failed to send email');
    }
    setSending(false);
  };

  return (
    <div className="p-8">
      <h1>Test Email</h1>
      <div className="flex gap-2 mt-4">
        <Input
          type="email"
          placeholder="recipient@example.com"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <Button onClick={handleTest} disabled={sending || !to}>
          Send Test
        </Button>
      </div>
    </div>
  );
}
```

---

## 6. Vercel Deployment Guide

### Prerequisites
✅ You have Vercel account credentials
✅ All features are working locally
✅ Build passes without errors

### Step 1: Pre-Deployment Checklist

```bash
# 1. Run build locally
npm run build

# 2. Fix any TypeScript errors
npm run type-check

# 3. Test production build
npm run preview

# 4. Verify all environment variables are documented
```

### Step 2: Prepare Environment Variables

Create a file: `VERCEL_ENV_VARS.md` with all required variables:

```markdown
# Environment Variables for Vercel

## Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

## App Configuration
VITE_APP_NAME=Tampa APP
VITE_APP_URL=https://your-app.vercel.app

## Resend (if email is set up)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### Step 3: Connect GitHub to Vercel

1. **Go to:** https://vercel.com/dashboard
2. **Click:** "Add New Project"
3. **Import:** Your GitHub repository (`food-safe-sync`)
4. **Configure:**
   - Framework Preset: **Vite**
   - Root Directory: **`./`**
   - Build Command: **`npm run build`**
   - Output Directory: **`dist`**
   - Install Command: **`npm install`**

### Step 4: Add Environment Variables in Vercel

1. **Go to:** Project Settings → Environment Variables
2. **Add each variable** from `VERCEL_ENV_VARS.md`
3. **Select environments:** Production, Preview, Development (check all 3)
4. **Save**

### Step 5: Update Supabase Auth Configuration

1. **Go to:** Supabase Dashboard → Authentication → URL Configuration
2. **Add Site URL:** `https://your-app.vercel.app`
3. **Add Redirect URLs:**
   ```
   https://your-app.vercel.app/**
   https://*.vercel.app/**
   ```

### Step 6: Deploy

1. **In Vercel Dashboard:** Click "Deploy"
2. **Wait for build** (usually 2-3 minutes)
3. **Check logs** for any errors
4. **Visit deployment URL**

### Step 7: Post-Deployment Testing

✅ Test authentication (login/logout/register)
✅ Test all main features:
  - Dashboard
  - People module
  - Labeling
  - Recipes
  - Feed
  - Routine Tasks
  - Expiring Soon
  - Settings

✅ Test on mobile devices (responsive design)
✅ Check browser console for errors
✅ Verify email sending (if configured)

### Step 8: Custom Domain (Optional)

1. **In Vercel:** Project Settings → Domains
2. **Add domain:** `yourdomain.com`
3. **Configure DNS** with your domain registrar:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```
4. **Wait for propagation** (can take up to 24 hours)

### Step 9: Enable Production Mode

**File:** `.env.production` (create if doesn't exist)

```env
NODE_ENV=production
VITE_APP_ENV=production
```

### Step 10: Monitor & Maintain

- **Enable Vercel Analytics** (optional, free tier available)
- **Set up error tracking** (Sentry, LogRocket, etc.)
- **Monitor performance** with Lighthouse
- **Set up uptime monitoring** (UptimeRobot, Pingdom, etc.)

---

## Common Issues & Solutions

### Issue: Build fails with "Module not found"
**Solution:** Check all imports, run `npm install`, verify tsconfig.json

### Issue: Environment variables not working
**Solution:** Redeploy after adding variables, check variable names have `VITE_` prefix for client-side

### Issue: Supabase Auth not working
**Solution:** Verify redirect URLs in Supabase Dashboard, check CORS settings

### Issue: 404 on page refresh
**Solution:** Vercel should handle this automatically with Vite, check vercel.json if needed:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## Final Production Launch Checklist

### Before Official Launch:
- [ ] All features tested and working
- [ ] No console errors in production
- [ ] Mobile responsive on all pages
- [ ] Email integration tested
- [ ] All environment variables configured
- [ ] Supabase RLS policies verified
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Performance optimized (Lighthouse score > 90)
- [ ] Documentation updated
- [ ] Team trained on new features
- [ ] Backup of database created
- [ ] Rollback plan documented

### Launch Day:
- [ ] Deploy to production
- [ ] Announce to team
- [ ] Monitor error logs
- [ ] Test all critical features
- [ ] Monitor performance metrics
- [ ] Be ready for quick fixes

### Post-Launch (24-48 hours):
- [ ] Monitor user feedback
- [ ] Check error logs daily
- [ ] Address any issues quickly
- [ ] Gather usage metrics
- [ ] Plan next iteration

---

**Ready to Deploy?** Start with Step 1 and work through each section carefully.

**Questions?** Document any issues you encounter for troubleshooting.

**Last Updated:** February 4, 2026
