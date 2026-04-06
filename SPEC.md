# Dr. Amara Osei — Nutrition PWA Spec

## Concept & Vision
A warm, inviting "Link in Bio" PWA for plant-based sports nutritionist Dr. Amara Osei, RD. The experience feels like chatting with a knowledgeable friend who happens to be a world-class nutritionist. The primary value hook: a free AI-generated 7-day meal plan that demonstrates Dr. Amara's expertise and converts visitors into consultation bookings.

**Personality:** Warm, empowering, scientifically grounded. Not preachy about plant-based — inclusive and practical.

---

## Design Language

### Aesthetic Direction
Warm wellness — inspired by Lovable's health/wellness aesthetic. Cream backgrounds, soft terracotta accents, generous whitespace. Think: a sunny kitchen, not a clinical office.

### Color Palette
- **Primary:** `#2D5016` (deep moss green — trust, growth, nutrition)
- **Secondary:** `#F5E6D3` (warm cream — approachable, clean)
- **Accent:** `#C4784A` (terracotta — warmth, energy, action)
- **Background:** `#FDFAF6` (off-white — easy on eyes)
- **Text:** `#1A1A1A` (near-black — readable)
- **Text Muted:** `#6B6B6B` (warm gray)
- **Success:** `#4A7C23` (fresh green)
- **Error:** `#C44A3A` (soft red)

### Typography
- **Headings:** "Fraunces" (Google Fonts) — warm serif with personality
- **Body:** "Manrope" (Google Fonts) — humanist sans, highly readable
- **Fallbacks:** Georgia, system-ui

### Spatial System
- Base unit: 8px
- Card padding: 24px
- Section gaps: 48px
- Border radius: 16px (cards), 24px (buttons), 50% (avatars)

### Motion Philosophy
- Entrance: fade-up, 300ms ease-out, staggered 80ms
- Chat bubbles: slide-in from bottom, 200ms spring
- Button hover: scale 1.02, 150ms ease
- Loading: gentle pulse, not spinners

### Visual Assets
- Icons: Phosphor Icons (regular weight)
- Avatar: Dr. Amara photo (circular)
- Decorative: subtle leaf/plant motifs as section dividers

---

## Layout & Structure

### Single Page — Three Accordion Tabs
```
┌──────────────────────────────────────┐
│  [Avatar] Dr. Amara Osei, RD         │
│  Plant-Based Performance Nutrition   │
│  [Verified Badge]                    │
├──────────────────────────────────────┤
│  [ 🍽 Get Your Free Meal Plan ]      │  ← HERO CTA (default open)
├──────────────────────────────────────┤
│  [ 💬 Chat with Amara ]              │  ← Chat tab
├──────────────────────────────────────┤
│  [ 📞 Book a Consultation ]          │  ← Contact/Booking tab
└──────────────────────────────────────┘
```

### Hero CTA Section (Open by Default)
- Dr. Amara's headshot + brief credential intro
- "Get Your Free 7-Day Plant-Based Meal Plan" headline
- Subtext: "Personalized to your goals, dietary needs & lifestyle"
- Single CTA button → expands chat interface
- Small trust signals: "500+ athletes coached", "Plant-Based Nutrition Specialist"

### Chat Interface (Inside Hero Section After Click)
- Chat history area (scrollable)
- AI asks: goals, dietary restrictions, cooking budget, experience level
- Response bubbles with Dr. Amara's "voice"
- Input field + send button
- After 4 questions answered → generates meal plan
- Soft ask for email to "send your personalized plan"

### Chat Tab (Full Chat Mode)
- Full chat interface with Dr. Amara
- Can ask anything about plant-based nutrition
- Implicit lead capture through conversation

### Book Consultation Tab
- Simple form: name, email, preferred time, consultation type
- Calendly-style availability display
- Chat-based booking confirmation

---

## Features & Interactions

### 1. Meal Plan Generator Flow
**Entry:** Hero CTA button "Get Your Free Meal Plan"

**Questions (asked sequentially):**
1. "What are your main fitness or health goals?" (weight loss, muscle gain, energy, endurance, general health)
2. "Any dietary restrictions I should know about?" (none, gluten-free, nut-free, soy-free, raw)
3. "What's your weekly food budget?" (budget, moderate, premium)
4. "How comfortable are you in the kitchen?" (beginner, intermediate, advanced)

**Output:** AI generates a 7-day meal plan formatted nicely in chat:
```
🍽 YOUR 7-DAY PLANT-BASED MEAL PLAN
Goal: Muscle Gain | Budget: Moderate | Skill: Intermediate

DAY 1 — Monday
Breakfast: Overnight oats with berries + protein smoothie
Lunch: Quinoa bowl with roasted chickpeas
Dinner: Tempeh stir-fry with brown rice
Snacks: Hummus + veggies, almond butter toast
...
```

**Email Capture:** After plan delivered:
> "Want this plan as a printable PDF with full recipes and macros? Drop your email below and I'll send it right over — plus a free consultation offer!"

### 2. Consultation Booking Flow
**Entry:** "Book a Consultation" tab or booking CTA in chat

**Form Fields:**
- Name
- Email
- Preferred consultation type (Initial Assessment, Follow-up, Package)
- Preferred day/time (dropdown of available slots)
- Message (optional)

**Confirmation:** Chat-style confirmation message with booking details

### 3. Chat Agent
- Responds to plant-based nutrition questions
- Uses Dr. Amara's voice and expertise
- Can answer FAQ, provide nutrition tips
- Soft-persuades toward consultation booking
- Captures email when user shows interest

### 4. Offline Mode (PWA)
- Service worker caches all assets
- Works offline after first load
- "Offline" indicator if no network
- Queues messages for send when back online

---

## Component Inventory

### ChatBubble
- **User:** Right-aligned, terracotta background, white text
- **AI:** Left-aligned, cream background, dark text, Dr. Amara avatar
- **States:** default, loading (typing indicator), error

### PrimaryButton
- Background: moss green gradient
- Text: white, Manrope semibold
- Hover: scale 1.02, slight shadow
- Active: scale 0.98
- Disabled: 50% opacity, no pointer

### AccordionTab
- Closed: icon + label, subtle bottom border
- Open: icon + label highlighted, content revealed with slide-down
- Hover: background tint

### InputField
- Label above, cream background, green focus ring
- Error: red border + error message below
- Placeholder text in muted gray

### MealPlanCard
- Generated plan displayed in styled card
- Day headers in moss green
- Meals listed with emojis
- "Get PDF" CTA at bottom

---

## Technical Approach

### Stack
- **Frontend:** Vanilla JS + CSS (no build step needed for MVP)
- **PWA:** manifest.json + service worker (sw.js)
- **Backend:** n8n workflow + Ollama (glm-5:cloud via local MCP)
- **Database:** Supabase (leads table — already working)

### n8n Workflow: Meal Plan Generator
```
[Webhook] → [AI Agent (glm-5:cloud)] → [Conditional: email provided?] 
  → YES: [Save to Supabase leads] → [Send email via Resend] 
  → NO: [Return plan in chat]
```

### Supabase Schema (existing leads table)
```sql
-- leads table already exists with columns:
-- id, created_at, name, email, phone, zip_code, service_type,
-- roof_type, urgency, status, tier, summary, chat_transcript,
-- visualizer_image_url, city, notes, image_url, contractor_id
-- For nutrition: use service_type='meal-plan-request',
-- notes=chat_transcript, city=dietary_restrictions
```

### PWA → n8n Webhook
- Endpoint: `POST https://n8n.srv1524386.hstgr.cloud/webhook/meal-plan`
- Body: `{ name, goals, dietary_restrictions, budget, skill_level, email? }`
- Response: `{ plan: "7-day meal plan text...", email_sent: true/false }`

### Offline Strategy
- Service worker caches: HTML, CSS, JS, fonts, icons
- Chat messages queued in localStorage when offline
- Auto-retry when connection restored

---

## Content

### Dr. Amara Bio
Dr. Amara Osei, RD is a Registered Dietitian specializing in plant-based sports nutrition. She helps athletes and active individuals optimize performance through evidence-based, sustainable eating — no dogmatism, just results. Based in Toronto, working with clients worldwide.

### Trust Signals
- "500+ Athletes Coached"
- "MSc in Sports Nutrition, University of Toronto"
- "Plant-Based Nutrition Specialist, eCornell"
- "Featured in: Men's Health, Women's Running, Toronto Star"

### Sample Meal Plan (Demo Output)
Pre-written 7-day plan for demonstration when AI is unavailable.

---

## File Structure
```
/tmp/nutritionist-pwa-demo/
├── SPEC.md
├── index.html          # Main PWA page
├── styles.css          # All styles
├── app.js             # Chat + meal plan logic
├── manifest.json      # PWA manifest
├── sw.js              # Service worker
└── public/
    └── icons/         # PWA icons (placeholder)
```
