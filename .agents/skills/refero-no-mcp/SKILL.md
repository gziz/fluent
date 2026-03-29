---
name: refero-no-mcp
description: Research-First design methodology without MCP dependencies. Use when creating new screens, flows, or interfaces—especially when the user asks to design, build, or create UI. Guides systematic research using web browsing, curated design galleries, and reference sites, pattern extraction from real products, and quality craft. Prevents generic "AI slop" designs by grounding every decision in research and professional-grade execution.
---

# Research-First Design (No MCP)

Don't guess—know. Study real products, learn from the best, then design with confidence.

**But remember:** References are just ingredients. Your product needs its own flavor. Use research for a rock-solid foundation (80%), then breathe **soul** into it (20%)—the distinctive choices that make your design memorable.

**Mindset:** Research isn't copying the average. It's finding what the TOP 10% do that others don't. Generic findings ("offer discount", "show social proof") are table stakes—hunt for specific tactics with exact copy, exact numbers, exact conditions. Generic design copies patterns. Great design understands psychology.

> Always ask: "If I showed this to 10 users tomorrow, what would they remember?"

---

## Before You Start: Discovery

**Never design blind.** Ask these questions first:

```
1. WHAT are we building?
   → Screen type, Platform, Scope

2. WHO is this for?
   → Audience, Technical level

3. WHAT should users accomplish?
   → Primary action, Success metric

4. WHAT feeling should it evoke?
   → Tone, Energy

5. WHAT JOB is the user hiring this page to do?
   → "Help me decide" (pricing, comparison)
   → "Convince me to trust you" (fintech, healthcare, enterprise)
   → "Get me started without friction" (onboarding, signup)
   → "Show me what to do next" (empty state, dashboard)
   → "Make me feel I'm not missing out" (waitlist, upgrade)

6. WHAT objections might they have?
   → "Is it worth the price?" / "Is it legit?" / "Will it work for me?"

7. WHAT should they remember tomorrow?
   → The hook, the differentiator, the "aha"

8. ANY constraints?
   → Brand guidelines, Technical requirements, Inspirations
```

**Output a Design Brief:**
> "I'm designing a **[WHAT]** for **[WHO]** that helps them **[GOAL]** and should feel **[TONE]**. The user's job: **[JOB]**. Main objection to overcome: **[OBJECTION]**. They should remember: **[HOOK]**. Constraints: **[CONSTRAINTS]**."

---

## The Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  0. DISCOVER → Design Brief                                     │
│                              ↓                                  │
│  1. RESEARCH                                                    │
│     Browse real products: galleries, live sites, competitors    │
│     Try different angles until patterns emerge                  │
│     → Raw material: dozens of references                        │
│                              ↓                                  │
│  2. ANALYZE                                                     │
│     Extract and structure what you found                        │
│     Compare approaches, identify patterns                       │
│     → Synthesis: documented patterns + decisions                │
│                              ↓                                  │
│  3. DESIGN                                                      │
│     Apply craft: typography, color, spacing, copy               │
│     Define soul: what makes THIS product unique                 │
│     → Blueprint: design system + unique identity                │
│                              ↓                                  │
│  4. IMPLEMENT                                                   │
│     Build the actual interface                                  │
│     Validate against references and quality gates               │
│     → Ship-ready design                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Research

**Goal:** Gather raw material. Use web browsing and design galleries to study real products systematically.

### Research Sources

Since we're not using Refero MCP tools, gather references from these sources:

| Source | URL | Best For |
|--------|-----|----------|
| **Refero.design** | refero.design | Browse 150K+ screens visually |
| **Mobbin** | mobbin.com | Mobile & web UI patterns |
| **Dribbble** | dribbble.com | Visual inspiration (filter carefully) |
| **Land-book** | land-book.com | Landing page patterns |
| **SaaS Landing Page** | saaslandingpage.com | SaaS-specific patterns |
| **Page Flows** | pageflows.com | User flow recordings |
| **Live sites** | Direct URLs | The gold standard — real products |
| **Godly** | godly.website | Curated web design inspiration |
| **Dark Mode Design** | darkmodedesign.com | Dark theme patterns |

**Best approach:** Browse live products directly. Visit the actual websites of companies known for great design (Linear, Stripe, Notion, Vercel, Arc, Superhuman, etc.).

### Search by Facts, Not Feelings

When searching galleries or browsing sites, look for what's literally on the screen—not abstract concepts:
- ✅ "pricing toggle", "testimonial carousel", "feature comparison table"
- ✅ Company names: "Stripe", "Linear", "Notion"
- ✅ Visual styles: "dark mode", "minimalist", "gradient"
- ❌ "user-friendly pricing" (subjective, not searchable)

### Search Strategy: Experiment

Don't settle on the first query. Try multiple angles until you've seen the landscape.

**Query Types:**

| Type | Example | Purpose |
|------|---------|---------|
| **Broad** | "[screen type]" | See overall landscape |
| **Style** | "minimalist", "dark", "playful" + [type] | Visual direction |
| **Specific** | "[exact UI element or interaction]" | Exact UI patterns |
| **Leader** | Company names known for great design | Best-in-class examples |
| **Component** | "[specific element]: toggle, card, table, modal" | Individual elements |
| **Adjacent** | Similar problem in different industry | Fresh unexpected patterns |

**Research Loop:**

```
1. Start BROAD → visit 5-10 live sites in your space
2. Notice interesting patterns → screenshot and document
3. Find a great example → explore their full product
4. Try different ELEMENTS → "plan comparison", "feature table"
5. Go CROSS-PLATFORM → designing for mobile? check web too
6. Visit galleries (Mobbin, Refero) for more examples
7. Browse competitors → see what they do differently
8. Repeat until you've studied 20-30+ real examples
```

**Example:** Designing a pricing page
```
Visit Linear.app/pricing → study their approach
Visit Notion.so/pricing → different strategy
Visit Vercel.com/pricing → enterprise angle
Search Mobbin for "pricing" → mobile patterns
Search land-book for "pricing" → landing page patterns
Visit 5 competitors → industry-specific patterns
→ 20+ references, clear picture of patterns
```

**Go Deep, Not Just Wide:**

Don't stop at the obvious. The best inspiration hides beyond surface results:
- Skip the usual suspects (Stripe, Linear, Notion) — everyone copies them
- Search adjacent industries — fintech can learn from healthcare
- Find the weird ones — unconventional solutions spark original ideas

**The gold is in the long tail.** First few results = what everyone sees. Deeper exploration = unique inspiration.

### How to Browse Effectively

**When visiting live sites:**
1. Take screenshots of key screens
2. Note exact details: font sizes, colors, spacing, copy
3. Use browser DevTools to inspect specific values
4. Look at multiple viewport sizes
5. Test interactions: hover states, animations, transitions

**When using galleries:**
1. Search broadly first, then filter
2. Look at both iOS and web versions
3. Pay attention to flows, not just individual screens
4. Note which companies appear repeatedly (they're doing something right)

### Focus Your Research

Every task has two dimensions: the **challenge** you're solving and the **type** of research needed. Identify both before searching.

#### By Challenge — what problem are you solving?

| If the challenge is... | Focus research on... |
|------------------------|---------------------|
| **Building trust** (fintech, healthcare, enterprise) | Security signals, credentials, specificity, social proof |
| **Reducing friction** (onboarding, signup, checkout) | Progressive disclosure, smart defaults, inline validation |
| **Creating urgency** (waitlist, limited offer) | Scarcity cues, exclusivity, FOMO without cringe |
| **Turning negative to positive** (empty state, paywall, error) | Motivation, clear next action, opportunity framing |
| **Simplifying complexity** (complex pricing, settings) | Information hierarchy, progressive reveal, comparisons |
| **Standing out** (crowded market) | Bold visual choices, unique voice, memorable details |

**Ask:** "What's the #1 thing that could go wrong here?" Then research how others solved it.

#### By Goal — what type of research do you need?

**Visual direction** — finding the right style
```
Look for:  typography (fonts, sizes, weights), colors, spacing, details (shadows, radii, gradients)
Browse:    "dark mode", "minimalist dashboard", "gradient hero", "glassmorphism"
Extract:   font pairings, color palettes, spacing rhythm, micro-details
Skip:      conversion tactics, copy analysis
```

**Competitive analysis** — understanding how others position
```
Look for:  headlines, value propositions, pricing structure, feature framing
Browse:    competitor sites, "[competitor] pricing", "saas landing page"
Extract:   how they explain value, what objections they address, pricing tiers
Skip:      visual details (unless relevant to positioning)
```

**UX/Flow optimization** — improving journeys
```
Look for:  step count, friction points, error handling, save states
Browse:    "onboarding flow", "checkout", "signup", "cancellation" on Page Flows / Mobbin
Extract:   what reduces friction, decision points, recovery patterns
Skip:      visual polish (focus on structure)
```

**Component design** — specific UI elements
```
Look for:  all states (default, hover, active, disabled, loading, error, empty)
Browse:    component libraries, live products, design systems
Extract:   interaction patterns, edge cases, accessibility considerations
Skip:      page-level patterns
```

**Mix as needed:**
- Abstract request ("design a pricing page") → use all recipes
- Specific request ("find dark mode inspiration") → focus on Visual
- Mixed request ("pricing page like Linear") → Competitive + Visual

### Three Lenses (Use All)

**Lens A: Structure** — What do they all do?
- Layout, components, information hierarchy
- Common solutions to common problems

**Lens B: Visual Craft** — How does it LOOK and FEEL?
For each strong reference, notice:
1. **Typography** — What fonts? Serif or sans? What makes headlines feel premium?
2. **Color** — Warm or cool? How many colors? What's the accent?
3. **Spacing** — Tight or airy? What's the rhythm?
4. **Details** — Shadows, borders, radii, gradients?
5. **Icons/Illustrations** — Style? Stroke width? Custom or library?
6. **Overall vibe** — Premium? Playful? Technical? Minimal?

Don't copy—extract principles. "This feels premium because of tight letter-spacing and generous whitespace" → apply that principle to your design.

**Lens C: Conversion & Soul** — What makes this one WORK?
For each strong reference, ask:
1. What's the HOOK in the first 3 seconds?
2. How do they handle OBJECTIONS?
3. Where's the TRUST (social proof, guarantees)?
4. What's UNIQUE that I haven't seen in others?
5. What MICROCOPY has personality?
6. What would a user REMEMBER tomorrow?

**For Flows (additional lens):**
- Step count — how many screens to complete the task?
- Decision points — where does the user choose?
- Friction reducers — what makes it feel easy?
- Save states — can they resume if interrupted?
- Error handling — what happens when things go wrong?
- Recovery paths — how do they get back on track?

### Research Completion Check

Research is done when you can answer YES to all:
- [ ] Visited 10+ real products / gallery references
- [ ] Tried multiple angles (companies, styles, elements, platforms)
- [ ] Documented specific details from 5-10 best references (exact values from DevTools)
- [ ] Found 5+ clever tactics worth adapting (not common—clever)
- [ ] Each finding has EXACT details (copy/numbers/conditions), not generic descriptions
- [ ] Found at least 1 thing that surprised you
- [ ] Can describe "what the best products do and why"
- [ ] Can answer: "What do most products do?" and "What do the best ones do differently?"

**Common mistakes:**
- ❌ Only browsing design galleries without visiting live products
- ❌ Skimming screenshots without inspecting specific values
- ❌ Stopping at the first 5 sites when deeper exploration would help
- ❌ Only looking at one industry or style

**Good research vs bad research:**
```
❌ Surface research:
   - Visited 3 competitor sites
   - Took a few screenshots
   - Didn't inspect DevTools
   - Findings: "offer discount", "show value", "clean design" (generic)

✅ Real research:
   - Visited 15+ sites across companies, styles, platforms
   - Used DevTools to extract exact font sizes, colors, spacing
   - Documented specific copy, numbers, conditions
   - Findings with EXACT details: "Linear uses Inter 13px/500 for nav, 
     48px/-0.025em for hero, #5E6AD2 accent at 8% opacity for hovers"
   - Can explain "why" behind each pattern
```

### Output

Raw collection of 20-30+ references with specific details. Don't filter yet—gather everything potentially useful.

### Research Summary (Required)

**After completing research, ALWAYS present a summary to the user:**

```
📊 RESEARCH SUMMARY
────────────────────────────────────────
Sites visited: [count] | Screens documented: [count]

WHAT I FOUND:
  [Adapt to user's question — visual details, flow logic, patterns, etc.]
  
  Key findings (facts with sources):
  • [Company] — [specific detail: exact copy, size, color, step count, etc.]
  • [Company] — [specific detail]
  
  Notable differences:
  • [what varies between products — if relevant to the task]

GAPS: [what wasn't found]
────────────────────────────────────────
```

**Quality check:** Every finding should be a fact you observed, not an opinion. Include source (company/product name). Be specific — "20px font" not "large font", "5-step flow" not "short flow".

---

## Phase 2: Analyze

**Goal:** Structure your research. Extract patterns. Make decisions.

This phase is pure synthesis—no opinions, just document what you found.

### Research ≠ Copying the Average

**Don't just follow "best practices."** Research is about understanding WHY choices work, not copying WHAT everyone does.

**The experiment mindset:**
- Best practices = starting point, not destination
- "Safe" often = "forgettable"
- If 80% use approach A, but B fits YOUR context—use B
- Document reasoning: "Most use X, but we chose Y because..."

**When analyzing, ask:**
1. Why did they make this choice?
2. Does this serve THEIR users or MINE?
3. What's the bold choice that makes it memorable?

### What to Extract

For each strong reference, document:

| Category | What to notice |
|----------|----------------|
| **Layout** | Grid, max-width, spacing rhythm, visual hierarchy |
| **Typography** | Fonts, size scale, weights, special treatments |
| **Color** | Background, accent, text hierarchy, semantic colors |
| **Components** | Cards, buttons, navigation, interactive elements |
| **Copy** | Headline style, CTA language, tone |

### Pattern Table

Compare 3-5 best references:

| Aspect | Ref A | Ref B | Ref C | Pattern |
|--------|-------|-------|-------|---------|
| Background | White | Cream | Gray | Warm neutrals |
| Cards | Bordered | Colored | Shadowed | Color differentiation |
| Toggle | Pills | Switch | Tabs | Pills common |
| CTA style | Primary | Secondary | Ghost | Varies by tier |

### Steal List (Required — minimum 5 items)

Don't just document patterns—capture specific tactics to adapt:

| Source | What | Why It Works | How I'll Use It |
|--------|------|--------------|-----------------|
| Linear | "No credit card" under CTA | Kills objection at decision point | Same placement |
| Stripe | ROI calculator | Makes value tangible | Adapt for our metric |
| Notion | Real user avatars, not stock | Creates authenticity | Use real testimonials |
| Clearful | "2 taps to start" | Reduces perceived effort | Use in CTA area |
| Brilliant | Timeline showing trial | Makes process tangible | Visual trial explainer |

**STOP: If this table has fewer than 5 rows, go back to research.**

**Be specific, not vague:**
- ❌ "Linear — clean design" (not actionable)
- ✅ "Linear — 13px/20px body text, -0.01em tracking, 48px section gaps, #5E6AD2 accent at 8% opacity for hover states"

Categories to cover (pick relevant ones):
- [ ] Trust signal (social proof, guarantee, security)
- [ ] Objection killer (addresses "but what if...")
- [ ] Friction reducer (makes action feel easy)
- [ ] Visual treatment (typography, color, spacing you'll adapt)
- [ ] Micro-detail (shadow, border, animation, icon style)
- [ ] Memorable element (what will they screenshot?)

### Output

Structured document with:
1. Patterns identified across references
2. Specific choices for your design
3. Reasoning for each decision

---

## Phase 3: Design

**Goal:** Achieve professional quality. This is where craft matters.

You have the structure from research. Now execute like a senior product designer.

### Typography

**Scale:** Use a ratio (1.2 or 1.25). Max 6-8 sizes: Display (48-64px), H1 (36-48px), H2 (24-32px), Body (16-18px), Small (13-14px), Caption (11-12px).

**Leading:** Larger text = tighter (1.0-1.2). Body = looser (1.5-1.6).

**⚠️ LETTER-SPACING — DO NOT SKIP**

| Text Type | Letter-spacing |
|-----------|----------------|
| Body (14-18px) | `0` |
| Small text (11-13px) | `0.01-0.02em` — **required** |
| UI labels/buttons | `0.02em` — **required** |
| ALL CAPS | `0.06-0.1em` — **always required** |
| Large headings (32px+) | `-0.01` to `-0.02em` (tighten) |
| Display (48px+) | `-0.02` to `-0.03em` (tighten more) |

**Common mistakes:**
- ❌ ALL CAPS without tracking (looks cramped)
- ❌ Small text without positive tracking (hard to read)

**Line length:** 50-75 characters (`max-width: 65ch`). **Pairing:** Max 2 fonts.

→ Full guide: [references/typography.md](references/typography.md)

### Color

**Palette:** 4 layers — Neutrals (70-90%), Primary accent (5-10%), Semantic (success/warning/danger), Effects (rare).

**Neutrals:** 10-12 steps (50…950). Create breathing room with spacing, not faded text.

**Primary:** One brand color with scale (50–950). Use 600 default, 700 hover, 800 active, 100-200 for tints.

**Contrast:** 4.5:1 for body text (≤16px), 3:1 for large text.

**Dark theme:** Not inverted. Separate neutrals. Background `#0f0f0f`, not `#000`. Text `#f0f0f0`, not `#fff`.

**Tokens:** Name by purpose (`--primary`), not color (`--blue`).

→ Full guide: [references/color.md](references/color.md)

### Spacing (Summary)

**Base unit:** 4px or 8px. Everything multiplies from this.

```
4px system:  4, 8, 12, 16, 24, 32, 48, 64, 96
8px system:  8, 16, 24, 32, 48, 64, 96, 128
```

**Proximity = relationship.** Closer = connected, farther = separate. Spacing explains grouping.

**Rhythm:** Consistent gaps between similar elements. Larger gap = new section.

### Avoiding AI Slop

> **⛔ NO INDIGO/VIOLET** — Unless the user explicitly requests purple/indigo, do not use it. Every LLM defaults to indigo (#6366f1) because it's "safe." This makes it the biggest tell of AI-generated design. Choose brand-appropriate colors from your research instead.

**Generic AI output:**
- ❌ Default system fonts without intention
- ❌ Safe blue gradients everywhere
- ❌ Perfect symmetry (no visual tension)
- ❌ Blob/wave backgrounds (meaningless decoration)
- ❌ Stock illustrations that could be anywhere

**Professional design:**
- ✅ Brand-appropriate color chosen from research
- ✅ Intentional font pairing that matches tone
- ✅ Visual tension and asymmetry
- ✅ Purposeful whitespace
- ✅ Custom or curated imagery
- ✅ At least one "clever" element from Steal List implemented
- ✅ Social proof present (or justified absence)

**Generic structure trap:**
Don't default to: Hero → Features Grid → Pricing → FAQ → CTA
This is the "safe" template everyone uses. Ask: "What can I add, remove, or reorder to make this more effective for THIS product?"

→ Full guide: [references/anti-ai-slop.md](references/anti-ai-slop.md)

### Motion

Motion serves: **Feedback** (it worked), **Continuity** (where it went), **Hierarchy** (look here). If animation doesn't do one—remove it.

| Category | Duration | Examples |
|----------|----------|----------|
| Instant | 90–150ms | Hover, press, toggle |
| State change | 160–240ms | Accordion, tabs |
| Large transition | 240–360ms | Modal, drawer |

**Easing:** Enter = ease-out, Exit = ease-in, Change = ease-in-out.

**Micro-interactions:** Button press `scale: 0.98` 90ms. Hover background shift 120ms.

**Required:** `prefers-reduced-motion` support. No animation > 500ms in product UI.

**Anti-patterns:** ❌ 300ms+ on hover ❌ Linear easing ❌ Everything animates at once

→ Full guide: [references/motion.md](references/motion.md)

### Icons

Icons are typography, not illustration. Punctuation marks, not mini-pictures.

**Style:** One style per product (outline OR solid). Mixing libraries = visual collage.

**Optical corrections:** Geometric center ≠ visual center. Arrows, chevrons need 0.5–1px shift.

**Size:** Match text's visual weight. Icon height ≈ text line-height or smaller.

**Color:** `currentColor` inherits automatically. Semantic colors only for status.

**Accessibility:** Action icons need `aria-label`. Hit area 44×44px minimum.

**Libraries:** Lucide (SaaS default), Heroicons (Tailwind), Material Symbols, SF Symbols (Apple).

→ Full guide: [references/icons.md](references/icons.md)

### The Persuasion Layer (Before Visuals)

**STOP: Fill this table before writing any code.**

| Element | Your Answer | Implementation |
|---------|-------------|----------------|
| **Hook** (first 3 sec) | _______________ | Hero headline + visual |
| **Story arc** | Problem → Solution → Proof → Action | Section order |
| **Objection killers** | 1. _____ 2. _____ 3. _____ | Specific placement |
| **Trust signals** | [ ] Social proof [ ] Guarantee [ ] Security [ ] Specifics | Which and where |
| **Urgency/Scarcity** | _____ or "N/A — explain why" | If applicable |
| **The memorable thing** | _____ | What will they screenshot? |

**Required trust signals (pick at least 2):**
- Testimonials with real names/photos
- Company logos ("Trusted by...")
- Specific numbers ("50K+ users", "$2M saved")
- Guarantees ("Cancel anytime", "Money back")
- Security badges (if relevant)

**If you can't fill this table, you're designing decoration, not persuasion.**

### The Soul

~80% proven patterns + ~20% unique choices.

**Where to add distinctiveness:**
- One bold visual choice (color, type treatment, illustration style)
- Voice and personality in copy
- Micro-interactions that surprise
- One detail users will remember and mention

**Test:** "If someone screenshots this, would they know it's from THIS product?"

### Output

Complete design specification:
- Typography system (fonts, scale, spacing)
- Color palette with usage rules
- Spacing system
- Component patterns
- Unique identity elements

---

## Phase 4: Implement

**Goal:** Build it. Validate against references and quality standards.

### Build Checklist

- [ ] Semantic HTML structure
- [ ] CSS custom properties for all tokens
- [ ] Responsive breakpoints (320px, 768px, 1200px minimum)
- [ ] Hover/focus states for all interactive elements
- [ ] Accessible contrast ratios
- [ ] Smooth transitions (0.2s ease for most interactions)

→ For implementation details (forms, focus, images, touch, performance): [references/craft-details.md](references/craft-details.md)

### Quality Gate

| Category | Check |
|----------|-------|
| **Functional** | Primary action obvious? Error states? Works on mobile? |
| **Visual** | Squint test passes? Spacing rhythm? Typography intentional? Details polished? |
| **Persuasion** | Hook in 3 sec? 2+ trust signals? Objections addressed? Microcopy has personality? |
| **Polish** | No orphaned words? Icons aligned? Buttons consistent? Something memorable? |

### Side-by-Side Test

Place your implementation next to top 3 references.

Target: Match or exceed in 3/4 criteria:
- Polish (details, alignment, consistency)
- Clarity (hierarchy, readability)
- Uniqueness (memorable elements)
- Usability (obvious actions, no confusion)

### When to Return to Research

- Something feels "off" but you can't say why
- Stuck between two approaches
- New requirement invalidates earlier decisions

---

## Example

For a complete walkthrough (SaaS churn reduction), see [references/example-workflow.md](references/example-workflow.md).

---

## Reference Files

| Guide | What's Inside |
|-------|---------------|
| [typography.md](references/typography.md) | Scale, pairing, weight, line-height, letter-spacing, responsive type |
| [color.md](references/color.md) | Palette structure, neutrals, primary/semantic colors, dark theme, tokens |
| [motion.md](references/motion.md) | Micro-interactions, timing, easing, reduced motion, animation tokens |
| [icons.md](references/icons.md) | Grid system, optical corrections, accessibility, icon+text pairing |
| [craft-details.md](references/craft-details.md) | Focus states, forms, images, touch, performance, accessibility |
| [anti-ai-slop.md](references/anti-ai-slop.md) | What makes designs look generic and how to avoid it |
| [example-workflow.md](references/example-workflow.md) | Full walkthrough example |

---

## Resources

- **Refero.design** — Browse 150K+ screens visually
- **Mobbin** — Mobile & web UI patterns
- **Land-book** — Landing page inspiration
- **Page Flows** — User flow recordings
- **Godly** — Curated web design
- **Apple HIG / Material Design** — Platform conventions

---

*Don't guess. Research real products. Craft with intention. Infuse it with soul.*
