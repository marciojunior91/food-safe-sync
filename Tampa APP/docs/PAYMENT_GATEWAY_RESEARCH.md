# 💳 PAYMENT GATEWAY RESEARCH - AUSTRALIA

**Date:** January 7, 2026  
**Decision Deadline:** End of Day 1  
**Status:** Research phase

---

## 🎯 REQUIREMENTS

- Accept credit cards (Visa, Mastercard, Amex)
- Recurring subscription billing (monthly/yearly)
- Australian market focus
- Easy integration with React/TypeScript
- Webhook support for subscription management
- Secure PCI-compliant processing
- Reasonable fees for SaaS business

---

## 🔍 OPTIONS ANALYSIS

### 1. **STRIPE** ⭐ RECOMMENDED

**Pros:**
- ✅ Most popular globally, excellent documentation
- ✅ React/TypeScript SDK with hooks
- ✅ Strong subscription management (Stripe Billing)
- ✅ Automatic invoice generation
- ✅ Webhook system for events
- ✅ Built-in fraud detection
- ✅ Supports AUD currency
- ✅ Test mode for development
- ✅ No monthly fees, pay-as-you-go
- ✅ Dashboard for managing subscriptions
- ✅ Customer portal for self-service

**Cons:**
- ❌ 1.75% + 30¢ per transaction (for Australian cards)
- ❌ 2.9% + 30¢ for international cards
- ❌ Additional 0.5% for subscriptions

**Integration Complexity:** LOW (1-2 days)

**Code Example:**
```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_...');

// Subscription creation
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: 'price_monthly_plan' }],
});
```

**Best For:** Startups, SaaS, recurring billing

---

### 2. **SQUARE**

**Pros:**
- ✅ Popular in Australia for retail/hospitality
- ✅ Integrated POS solution
- ✅ Good for in-person + online
- ✅ Transparent pricing
- ✅ Free virtual terminal
- ✅ Same rate for all cards (1.9% + 30¢)
- ✅ Good customer support

**Cons:**
- ❌ Less focus on pure SaaS subscriptions
- ❌ SDK not as mature as Stripe for React
- ❌ Fewer features for subscription management
- ❌ 2.2% + 30¢ for manually entered cards

**Integration Complexity:** MEDIUM (2-3 days)

**Best For:** Businesses with physical locations + online presence

---

### 3. **PAYPAL**

**Pros:**
- ✅ Well-known brand, trusted by users
- ✅ Supports subscription billing
- ✅ Express checkout (one-click)
- ✅ Buyer protection
- ✅ Multiple currencies
- ✅ No monthly fees

**Cons:**
- ❌ Higher fees (2.6% + 30¢ for domestic)
- ❌ Clunky UX compared to Stripe
- ❌ More complex integration
- ❌ Customer must have PayPal account (or create one)
- ❌ Can hold funds for disputes

**Integration Complexity:** MEDIUM (2-3 days)

**Best For:** Supplement to main payment method

---

### 4. **AFTERPAY / ZIP (Buy Now Pay Later)**

**Pros:**
- ✅ Very popular in Australia
- ✅ Increases conversion (customers can pay in installments)
- ✅ No interest for customers
- ✅ You get paid upfront (minus fees)

**Cons:**
- ❌ 4-6% transaction fee (higher than cards)
- ❌ Not ideal for subscription (one-time payments)
- ❌ Minimum purchase amount requirements
- ❌ Additional complexity

**Integration Complexity:** MEDIUM

**Best For:** One-time purchases, higher-value transactions

---

### 5. **EWAY** (Australian Gateway)

**Pros:**
- ✅ Australian company, local support
- ✅ Supports all major cards
- ✅ Good for recurring billing
- ✅ Transparent pricing
- ✅ No setup fees

**Cons:**
- ❌ Less popular globally
- ❌ Fewer features than Stripe
- ❌ SDK not as polished
- ❌ 2.1% + 25¢ per transaction

**Integration Complexity:** MEDIUM

**Best For:** Businesses preferring local Australian provider

---

### 6. **PIN PAYMENTS** (Australian)

**Pros:**
- ✅ Australian-focused
- ✅ Simple pricing (1.75% + 30¢)
- ✅ No monthly fees
- ✅ PCI-DSS Level 1 certified
- ✅ Good for subscriptions

**Cons:**
- ❌ Smaller than Stripe/Square
- ❌ Limited documentation
- ❌ Fewer integrations

**Integration Complexity:** MEDIUM

**Best For:** Australian businesses wanting local support

---

## 💰 COST COMPARISON (Monthly Subscription: $99 AUD)

| Provider | Per Transaction | Annual Cost (100 customers) |
|----------|----------------|----------------------------|
| **Stripe** | 1.75% + 30¢ | $2,442 |
| **Square** | 1.9% + 30¢ | $2,604 |
| **PayPal** | 2.6% + 30¢ | $3,426 |
| **Eway** | 2.1% + 25¢ | $2,778 |
| **Pin Payments** | 1.75% + 30¢ | $2,442 |

*(Calculation: (99 * 0.0175 + 0.30) * 12 * 100 customers)*

---

## 🏆 RECOMMENDATION

### **Primary: STRIPE**

**Rationale:**
1. **Best-in-class developer experience** - Fast integration, great docs
2. **Subscription management** - Built for recurring billing
3. **Competitive pricing** - Same as local providers
4. **Global scale** - Handles international expansion
5. **Ecosystem** - Invoicing, customer portal, analytics
6. **Test mode** - Easy development and testing

### **Secondary: PayPal (optional add-on)**
- Offer as alternative payment method for users who prefer it
- ~15-20% of users may prefer PayPal
- Easy to add alongside Stripe

---

## 📋 IMPLEMENTATION PLAN (STRIPE)

### Phase 1: Setup (2 hours)
- [ ] Create Stripe account
- [ ] Get API keys (test + production)
- [ ] Install Stripe SDK: `npm install @stripe/stripe-js @stripe/react-stripe-js`
- [ ] Create subscription products/prices in Stripe dashboard

### Phase 2: Frontend (4 hours)
- [ ] Create checkout component
- [ ] Integrate Stripe Elements (card input)
- [ ] Add subscription plan selection
- [ ] Handle payment success/failure
- [ ] Show loading states

### Phase 3: Backend (6 hours)
- [ ] Create Stripe customer on user registration
- [ ] Create subscription on payment success
- [ ] Set up webhook endpoint
- [ ] Handle webhook events:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- [ ] Update user subscription status in database

### Phase 4: Testing (2 hours)
- [ ] Test with Stripe test cards
- [ ] Test subscription creation
- [ ] Test webhook delivery
- [ ] Test payment failure scenarios
- [ ] Test subscription cancellation

**Total Estimated Time:** 14 hours

---

## 🔐 SECURITY CONSIDERATIONS

### PCI Compliance
- ✅ Stripe handles card data (never touches our servers)
- ✅ Use Stripe Elements (pre-built secure form)
- ✅ Never store card numbers
- ✅ Use HTTPS for all payment pages

### Webhook Security
- Verify webhook signatures
- Use webhook secret from Stripe
- Idempotent webhook handling (prevent duplicate processing)

---

## 📚 RESOURCES

### Stripe
- Docs: https://stripe.com/docs
- React Integration: https://stripe.com/docs/stripe-js/react
- Subscriptions: https://stripe.com/docs/billing/subscriptions/overview
- Webhooks: https://stripe.com/docs/webhooks

### Testing
- Test Cards: https://stripe.com/docs/testing
- Test Mode: Available in Stripe dashboard

---

## 🎯 PRICING STRATEGY (To Define)

### Option A: Simple Pricing
- **Monthly:** $99 AUD/month
- **Yearly:** $990 AUD/year (2 months free = $89/month)

### Option B: Tiered Pricing
- **Starter:** $49/month (1 location, 5 users)
- **Professional:** $99/month (unlimited locations, unlimited users)
- **Enterprise:** $199/month (+ advanced features)

### Option C: Free Trial
- **14-day free trial** (no card required)
- Then $99/month

**Recommendation:** Start with Option A + Free Trial

---

## ⏭️ NEXT ACTIONS

1. ✅ Research complete - Choose **Stripe**
2. [ ] Create Stripe account (today)
3. [ ] Define pricing plans
4. [ ] Implement checkout flow
5. [ ] Set up webhook endpoint
6. [ ] Test end-to-end

---

**Decision:** Using **STRIPE** as primary payment gateway  
**Decision Date:** January 7, 2026  
**Approved By:** [To be confirmed]
