# 🗺️ TAMPA APP - COMPLETE ROADMAP & ARCHITECTURE

**Created**: January 13, 2026  
**Version**: 2.0  
**Status**: 📋 Active Development

---

## 📊 PROJECT OVERVIEW

### Vision
A comprehensive food safety management system with team collaboration, compliance tracking, and knowledge sharing - from signup to daily operations.

### Current Status
- **Sprint 1**: ✅ Complete (10/10 tasks)
- **Sprint 2**: 🚧 In Progress (Day 3, 25% complete)
- **Sprint 3**: 📋 Planned

---

## 🎯 END-TO-END USER JOURNEY

### Phase 1: Discovery & Signup
```
Landing Page Visit
    ↓
Browse Features/Pricing
    ↓
Click "Start Free Trial" CTA
    ↓
Sign Up Form (Email + Password)
    ↓
Email Verification Link
    ↓
Email Confirmed → Auto Login
```

### Phase 2: Onboarding
```
Welcome Screen
    ↓
Organization Setup
  ├─ Single Restaurant (simple)
  ├─ Multi-Location (franchise setup)
  └─ Restaurant Group (corporate)
    ↓
Organization Details
  - Name
  - Type
  - Address
  - Primary Contact
    ↓
Choose Subscription Plan
  ├─ Starter ($49/mo)
  ├─ Professional ($99/mo)
  └─ Enterprise ($299/mo)
    ↓
Payment (Stripe Checkout)
    ↓
Setup Wizard
  1. Create Departments
  2. Add Team Members
  3. Configure Label Templates
  4. Import Recipes (optional)
  5. Set Compliance Preferences
    ↓
Interactive Tutorial
  - Print your first label
  - Create a routine task
  - Add a team member
  - View compliance dashboard
    ↓
Dashboard (Active User!)
```

### Phase 3: Daily Operations
```
Login → Dashboard
    ↓
Navigation Options:
├─ Labelling
│   ├─ QuickPrint
│   ├─ Form-based creation
│   ├─ Recipe labels
│   └─ Print queue
├─ Recipes
│   ├─ Browse/search
│   ├─ Create/edit
│   ├─ Print recipe
│   └─ Batch operations
├─ People (Team Management)
│   ├─ View team members
│   ├─ Add/edit members
│   ├─ Assign roles
│   ├─ Upload documents/certificates
│   └─ Track training
├─ Routine Tasks
│   ├─ Timeline view (day/week/month)
│   ├─ Create tasks
│   ├─ Assign to team
│   ├─ Mark complete
│   ├─ Finish session
│   └─ Activity history
├─ Feed (Communication)
│   ├─ General channel
│   ├─ Department channels
│   ├─ Post updates
│   ├─ React & comment
│   ├─ @mention team
│   └─ Pin important posts
├─ Expiring Soon
│   ├─ View expiring products
│   ├─ Scan QR to expire
│   ├─ Manual expiry
│   └─ Disposal tracking
├─ Knowledge Base
│   ├─ Browse topics
│   ├─ Search knowledge
│   ├─ Create new topic
│   ├─ Edit/comment
│   └─ Version history
├─ Training Center
│   ├─ Video tutorials
│   ├─ Download guides (PDF)
│   ├─ Interactive walkthroughs
│   └─ Best practices
├─ Reports & Compliance
│   ├─ Label history
│   ├─ Task completion
│   ├─ Team activity
│   ├─ Expiry tracking
│   └─ Export to PDF/CSV
└─ Settings
    ├─ Organization profile
    ├─ Subscription & billing
    ├─ Team permissions
    ├─ Printer configuration
    ├─ Label templates
    └─ Integrations
```

---

## 🏗️ SYSTEM ARCHITECTURE

### Tech Stack

**Frontend**:
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS + shadcn/ui
- TanStack Query (data fetching)
- Zustand (state management)
- React Router (navigation)
- TipTap (rich text editor)
- Recharts (visualizations)

**Backend**:
- Supabase (BaaS)
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Storage (file uploads)
  - Realtime subscriptions
  - Edge Functions (serverless)

**Payments**:
- Stripe
  - Checkout
  - Subscriptions
  - Webhooks
  - Customer Portal

**Email**:
- Production SMTP (SendGrid/AWS SES/Postmark)
- Transactional emails
- Invitation system
- Notifications

**Deployment**:
- Vercel (hosting + edge functions)
- GitHub Actions (CI/CD)
- Environment management

---

## 🗄️ DATABASE ARCHITECTURE

### Core Tables

#### Authentication & Users
```sql
profiles (extends auth.users)
  - user_id (PK, FK to auth.users)
  - organization_id (FK)
  - display_name
  - email
  - avatar_url
  - created_at, updated_at

user_roles
  - id (PK)
  - user_id (FK)
  - role (enum: admin, manager, leader_chef, staff)
  - organization_id (FK)
  - created_at
```

#### Organization & Structure
```sql
organization_groups
  - id (PK)
  - name
  - parent_company
  - created_at

organizations
  - id (PK)
  - group_id (FK, nullable)
  - name
  - slug
  - location_type (single, franchise, owned, corporate)
  - address
  - created_at, updated_at

departments
  - id (PK)
  - organization_id (FK)
  - name
  - description
  - created_at
```

#### Team Management
```sql
team_members
  - id (PK)
  - organization_id (FK)
  - auth_user_id (FK, nullable)
  - department_id (FK)
  - display_name
  - email
  - phone
  - tfn
  - role_type
  - is_active
  - created_at, updated_at

team_member_certificates
  - id (PK)
  - team_member_id (FK)
  - certificate_name
  - certificate_type
  - file_url
  - file_type, file_size
  - issue_date, expiration_date
  - status, verification_status
  - created_by, updated_by
  - created_at, updated_at
```

#### Product & Label Management
```sql
categories
  - id (PK)
  - organization_id (FK)
  - name, icon, color
  - is_standard
  - created_at

subcategories
  - id (PK)
  - category_id (FK)
  - name
  - created_at

recipes
  - id (PK)
  - organization_id (FK)
  - name
  - category_id, subcategory_id (FK)
  - ingredients (JSONB)
  - instructions (JSONB)
  - prep_time, cook_time
  - servings
  - created_at, updated_at

printed_labels
  - id (PK)
  - organization_id (FK)
  - category_id, subcategory_id (FK)
  - recipe_id (FK, nullable)
  - label_data (JSONB)
  - qr_code_data
  - printed_at
  - expires_at
  - status (active, expired, discarded)
  - disposal_reason, disposed_at, disposed_by
```

#### Routine Tasks
```sql
routine_tasks
  - id (PK)
  - organization_id (FK)
  - title
  - description
  - schedule_time (nullable)
  - is_flexible (boolean)
  - task_type (prep_list, stock_take, other)
  - task_description (text)
  - sub_tasks (JSONB array)
  - recurrence_pattern (daily, weekly, monthly)
  - recurrence_config (JSONB)
  - assigned_to (FK team_members)
  - completed, completed_at, completed_by
  - created_at, updated_at

task_sessions
  - id (PK)
  - organization_id (FK)
  - completed_by (FK)
  - session_date
  - shift
  - total_tasks, completed_tasks
  - completion_rate
  - notes
  - created_at

routine_task_history
  - id (PK)
  - task_id (FK)
  - action (created, updated, completed, deleted)
  - changed_by (FK)
  - changes (JSONB)
  - created_at
```

#### Communication (Feed)
```sql
feed_channels
  - id (PK)
  - organization_id (FK)
  - name, description, icon
  - is_general (boolean)
  - created_by (FK)
  - created_at

feed_posts
  - id (PK)
  - organization_id (FK)
  - channel_id (FK)
  - author_id (FK)
  - content (text)
  - is_pinned (boolean)
  - mentions (UUID array)
  - attachments (JSONB)
  - created_at, updated_at

feed_reactions
  - id (PK)
  - post_id (FK)
  - user_id (FK)
  - emoji
  - created_at
  - UNIQUE(post_id, user_id, emoji)

feed_comments
  - id (PK)
  - post_id (FK)
  - author_id (FK)
  - content
  - created_at
```

#### Knowledge Base
```sql
knowledge_topics
  - id (PK)
  - organization_id (FK)
  - title, slug
  - content (JSONB - TipTap format)
  - category
  - tags (text array)
  - visibility (public, organization, department, private)
  - department_id (FK, nullable)
  - created_by, updated_by (FK)
  - version (integer)
  - created_at, updated_at
  - UNIQUE(organization_id, slug)

topic_versions
  - id (PK)
  - topic_id (FK)
  - version (integer)
  - content (JSONB)
  - changed_by (FK)
  - change_summary
  - created_at

topic_comments
  - id (PK)
  - topic_id (FK)
  - author_id (FK)
  - content
  - parent_id (FK, nullable - for threading)
  - created_at

topic_links
  - id (PK)
  - from_topic_id (FK)
  - to_topic_id (FK)
  - created_at
  - UNIQUE(from_topic_id, to_topic_id)
```

#### Payments & Subscriptions
```sql
subscriptions
  - id (PK)
  - organization_id (FK)
  - stripe_customer_id (unique)
  - stripe_subscription_id (unique)
  - plan_type (starter, professional, enterprise)
  - status (active, canceled, past_due, trialing)
  - current_period_start, current_period_end
  - cancel_at_period_end (boolean)
  - created_at, updated_at

billing_history
  - id (PK)
  - organization_id (FK)
  - stripe_invoice_id (unique)
  - amount (integer cents)
  - currency (default 'aud')
  - status
  - invoice_pdf (url)
  - paid_at
  - created_at
```

---

## 💳 STRIPE INTEGRATION ARCHITECTURE

### Subscription Plans

| Plan | Price (AUD/mo) | Max Users | Max Locations | Features |
|------|---------------|-----------|---------------|----------|
| Starter | $49 | 10 | 1 | Basic labeling, recipes, tasks |
| Professional | $99 | 50 | 3 | + Feed, knowledge base, training |
| Enterprise | $299 | Unlimited | Unlimited | + Multi-location, API access, priority support |

### Payment Flow

```
User clicks "Choose Plan"
    ↓
Create Stripe Checkout Session (API)
  - priceId from plan
  - customer email
  - success_url, cancel_url
    ↓
Redirect to Stripe Hosted Checkout
  - Stripe handles payment form
  - PCI compliant
  - Supports cards, wallets, BNPL
    ↓
User completes payment
    ↓
Stripe Webhook → our API
  - customer.subscription.created
    ↓
Create subscription record in DB
  - Link to organization
  - Set status = active
  - Store Stripe IDs
    ↓
Redirect to success_url
  - Show "Welcome" message
  - Enable premium features
    ↓
User has active subscription!
```

### Webhook Events

```typescript
// api/stripe/webhook.ts
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  
  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  
  switch (event.type) {
    case 'customer.subscription.created':
      // Create subscription record
      await createSubscription(event.data.object);
      break;
    
    case 'customer.subscription.updated':
      // Update subscription status/plan
      await updateSubscription(event.data.object);
      break;
    
    case 'customer.subscription.deleted':
      // Cancel subscription
      await cancelSubscription(event.data.object);
      break;
    
    case 'invoice.payment_succeeded':
      // Record payment
      await recordPayment(event.data.object);
      break;
    
    case 'invoice.payment_failed':
      // Handle failed payment
      await handleFailedPayment(event.data.object);
      break;
  }
  
  return new Response(JSON.stringify({ received: true }));
}
```

### Stripe Components

```typescript
// SubscriptionPlansPage.tsx
interface Plan {
  id: string;
  name: string;
  price: number;
  stripePriceId: string;
  features: string[];
}

// CheckoutButton.tsx
async function handleCheckout(priceId: string) {
  const { sessionId } = await fetch('/api/stripe/create-checkout', {
    method: 'POST',
    body: JSON.stringify({ priceId })
  }).then(r => r.json());
  
  const stripe = await loadStripe(publishableKey);
  await stripe.redirectToCheckout({ sessionId });
}

// SubscriptionStatus.tsx
<Card>
  <h3>Current Plan: Professional</h3>
  <p>$99/month</p>
  <p>Renews: Feb 1, 2026</p>
  <Button onClick={manageBilling}>Manage Billing</Button>
</Card>

// BillingHistory.tsx
<Table>
  {invoices.map(invoice => (
    <Row>
      <Cell>{invoice.date}</Cell>
      <Cell>${invoice.amount / 100}</Cell>
      <Cell>{invoice.status}</Cell>
      <Cell><Link href={invoice.pdf}>Download</Link></Cell>
    </Row>
  ))}
</Table>
```

---

## 📱 LANDING PAGE STRUCTURE

### Sections

#### 1. Hero
```jsx
<section className="hero">
  <h1>Food Safety Made Simple</h1>
  <p>Label, track, comply - all in one platform</p>
  <Button size="lg">Start Free Trial</Button>
  <img src="dashboard-screenshot.png" alt="Product demo" />
</section>
```

#### 2. Features
```jsx
<section className="features">
  <Feature 
    icon={<Label />}
    title="Smart Labeling"
    description="Print compliant labels in seconds"
  />
  <Feature 
    icon={<Users />}
    title="Team Collaboration"
    description="Keep everyone on the same page"
  />
  <Feature 
    icon={<CheckCircle />}
    title="Compliance Tracking"
    description="Stay audit-ready 24/7"
  />
  <Feature 
    icon={<Clock />}
    title="Real-time Updates"
    description="Track expiry dates automatically"
  />
</section>
```

#### 3. How It Works
```jsx
<section className="how-it-works">
  <Step number={1}>
    <h3>Sign Up</h3>
    <p>Create your account in 60 seconds</p>
  </Step>
  <Step number={2}>
    <h3>Setup Organization</h3>
    <p>Add your team and configure settings</p>
  </Step>
  <Step number={3}>
    <h3>Start Labeling</h3>
    <p>Print your first label and you're live!</p>
  </Step>
</section>
```

#### 4. Pricing
```jsx
<section className="pricing">
  <PricingCard plan="starter" />
  <PricingCard plan="professional" highlighted />
  <PricingCard plan="enterprise" />
</section>
```

#### 5. Social Proof
```jsx
<section className="testimonials">
  <Testimonial 
    author="Chef Maria"
    role="Executive Chef"
    text="Tampa APP saved us hours every week"
    avatar="..."
  />
</section>
```

#### 6. FAQ
```jsx
<section className="faq">
  <Accordion>
    <Item>
      <Question>How do I get started?</Question>
      <Answer>Just click "Start Free Trial" and follow the setup wizard...</Answer>
    </Item>
  </Accordion>
</section>
```

#### 7. CTA Footer
```jsx
<section className="final-cta">
  <h2>Ready to simplify food safety?</h2>
  <Button size="xl">Start Your Free Trial</Button>
</section>
```

---

## 📚 KNOWLEDGE BASE STRUCTURE

### Inspired by Operand.io

#### Features:
- Rich text editing (TipTap/ProseMirror)
- Markdown support
- Syntax highlighted code blocks
- Embedded images/videos
- Internal linking
- Full-text search
- Version control
- Comments & discussions
- Tags & categories

#### Example Topics:
```
Food Safety Basics/
├─ HACCP Principles
├─ Temperature Control
├─ Cross-Contamination Prevention
├─ Allergen Management
└─ Storage Guidelines

Recipes & Prep/
├─ Standard Recipes
├─ Batch Cooking Procedures
├─ Ingredient Substitutions
└─ Plating Guidelines

Team Operations/
├─ Opening Checklist
├─ Closing Checklist
├─ Shift Handover Process
├─ Emergency Procedures
└─ Equipment Maintenance

Compliance/
├─ Label Requirements
├─ Record Keeping
├─ Inspection Preparation
└─ Incident Reporting
```

#### UI Components:
```tsx
// TopicEditor.tsx (TipTap)
<Editor
  content={topic.content}
  extensions={[
    StarterKit,
    Image,
    Link,
    CodeBlock,
    Mention,
    Table
  ]}
  onUpdate={({ editor }) => {
    setContent(editor.getJSON());
  }}
/>

// TopicViewer.tsx
<article className="prose">
  <h1>{topic.title}</h1>
  <TopicMeta 
    author={topic.created_by}
    date={topic.created_at}
    tags={topic.tags}
  />
  <EditorContent editor={viewer} readOnly />
  <TopicComments topicId={topic.id} />
  <RelatedTopics topics={related} />
</article>

// TopicSearch.tsx
<SearchInput
  placeholder="Search knowledge base..."
  onSearch={query => {
    // Full-text search with PostgreSQL
    const results = await searchTopics(query);
  }}
/>
```

---

## 🎓 TRAINING CENTER STRUCTURE

### Content Types:

#### 1. Video Tutorials
```
Library/
├─ Getting Started (5 min)
├─ Creating Labels (7 min)
├─ Managing Team (10 min)
├─ Recipe Organization (8 min)
├─ Routine Tasks (12 min)
└─ Compliance Reports (6 min)
```

#### 2. Downloadable Guides (PDF)
```
Guides/
├─ Quick Start Guide (10 pages)
├─ Label Management Guide (25 pages)
├─ Team Collaboration Guide (20 pages)
├─ Compliance Checklist (5 pages)
├─ Admin Manual (50 pages)
└─ Quick Reference Card (2 pages)
```

#### 3. Interactive Tutorials
```tsx
// InteractiveTutorial.tsx
<Joyride
  steps={[
    {
      target: '.label-button',
      content: 'Click here to create your first label',
    },
    {
      target: '.category-select',
      content: 'Choose a category for your product',
    },
    {
      target: '.print-button',
      content: 'Print your label!',
    }
  ]}
  continuous
  showProgress
  showSkipButton
/>
```

#### 4. Best Practices Library
```
Best Practices/
├─ Label Design Guidelines
├─ Team Communication Tips
├─ Efficient Task Management
├─ Compliance Best Practices
└─ Multi-Location Coordination
```

---

## 🚀 DEPLOYMENT STRATEGY

### Pre-Deployment Checklist

#### 1. Environment Setup
```bash
# Vercel Environment Variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SMTP (Production)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxx
SMTP_FROM=Tampa APP <noreply@tampaapp.com>

# App
VITE_APP_URL=https://app.tampaapp.com
VITE_LANDING_URL=https://tampaapp.com
```

#### 2. Database Migrations
```sql
-- Run all pending migrations
-- Verify all tables exist
-- Check RLS policies
-- Test with production data subset
```

#### 3. Stripe Configuration
```bash
# Live mode
- Create products & prices
- Configure webhook endpoint
- Test payment flow
- Setup Customer Portal
```

#### 4. SMTP Configuration
```bash
# DNS Records
SPF: v=spf1 include:sendgrid.net ~all
DKIM: [SendGrid provides]
DMARC: v=DMARC1; p=quarantine; rua=mailto:dmarc@tampaapp.com

# Test email delivery
- User invitations
- Password resets
- Notifications
```

#### 5. Landing Page
```bash
# Deploy static site
- Optimize images
- Setup SEO metadata
- Configure analytics (GA4)
- Setup Hotjar/tracking
```

#### 6. Performance Optimization
```bash
- Code splitting
- Lazy loading
- Image optimization
- CDN configuration
- Caching strategy
```

#### 7. Security Audit
```bash
- RLS policies review
- API endpoint security
- Environment variables
- CORS configuration
- Rate limiting
- SQL injection prevention
```

### Deployment Steps

```bash
# 1. Final testing
npm run test
npm run build
npm run preview

# 2. Database backup
pg_dump production_db > backup.sql

# 3. Run migrations
npm run migrate:prod

# 4. Deploy to Vercel
vercel --prod

# 5. Configure Stripe webhook
stripe listen --forward-to https://app.tampaapp.com/api/stripe/webhook

# 6. Smoke tests
- Test signup flow
- Test payment flow
- Test labeling
- Test all critical paths

# 7. Monitor
- Check error logs
- Monitor performance
- Watch user activity
- Track conversion rates
```

---

## 📈 SUCCESS METRICS

### KPIs to Track

#### User Acquisition
- Signups per week
- Trial conversion rate
- Activation rate (first label printed)
- Time to first value

#### Engagement
- Daily active users (DAU)
- Weekly active users (WAU)
- Labels printed per day
- Tasks completed per day
- Feed posts per week

#### Revenue
- MRR (Monthly Recurring Revenue)
- Churn rate
- Upgrade rate (Starter → Pro)
- Average revenue per user (ARPU)

#### Product Usage
- Most used features
- Feature adoption rates
- Knowledge base page views
- Training video completions

#### Support & Satisfaction
- Support ticket volume
- Resolution time
- NPS (Net Promoter Score)
- User feedback scores

---

## 🎯 ROADMAP SUMMARY

### Sprint 2 (Current - Jan 11-31)
- ✅ Team documents/certificates
- ✅ Visual identity overhaul
- 🚧 Email invitations
- 📋 Routine tasks overhaul
- 📋 Feed module
- 📋 Stripe integration
- 📋 Landing page structure

### Sprint 3 (Feb 1-14)
- Knowledge Base system
- Training modules
- Video tutorials
- Onboarding flow
- SMTP production setup
- Multi-location foundation

### Sprint 4 (Feb 15-28)
- Multi-location features
- Advanced reporting
- API documentation
- Mobile optimization
- Performance tuning

### Sprint 5 (Mar 1-14) - Pre-Launch
- Beta testing
- Bug fixes
- Documentation polish
- Marketing materials
- Launch preparation

### Launch (Mar 15)
- Public release
- Marketing campaign
- User onboarding
- Support readiness

---

**Document Version**: 2.0  
**Last Updated**: January 13, 2026  
**Next Review**: January 20, 2026
