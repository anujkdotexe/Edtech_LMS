# 03. UI/UX Design System Document

## Aesthetics & Design Philosophy
Our visual design merges two powerful design aesthetics:
1. **Duolingo's Friendly Gamification**: Chunky progress bars, bright status indicators, glowing active streaks, and friendly illustrated badges.
2. **Linear & Notion's Modern SaaS Minimalism**: Sleek typography, generous whitespace, unified light-mode panels, light borders, subtle shadows, and subtle glassmorphic elements.

---

## Design System Tokens (Light Mode First)

Our CSS custom properties are organized to present a clean, bright, modern experience:

```css
:root {
  /* Harmonious Light Brand Colors */
  --color-primary: 243 75% 59%;      /* Indigo: #4F46E5 */
  --color-secondary: 240 40% 96%;    /* Soft Ice Blue: #F4F4F6 */
  
  /* System Accents */
  --color-success: 142 76% 36%;      /* Emerald: #16A34A (Easy difficulty, complete actions) */
  --color-warning: 38 92% 50%;       /* Orange Flame: #EAB308 (Streaks, medium difficulty) */
  --color-danger: 0 84% 60%;         /* Crimson: #EF4444 (Hard difficulty, errors, warning alerts) */
  
  /* Text Hues */
  --color-text-primary: 215 28% 17%;   /* Navy Dark: #1E293B */
  --color-text-secondary: 215 16% 47%; /* Slate Neutral: #64748B */
  --color-text-tertiary: 215 20% 65%;  /* Slate Muted: #94A3B8 */
  
  /* Background & Borders */
  --color-bg-primary: 0 0% 100%;       /* Bright White */
  --color-bg-secondary: 240 30% 98%;   /* Soft Gray-Blue */
  --color-border: 214 32% 91%;         /* Crisp Light Border: #E2E8F0 */
  
  /* Layout Metrics */
  --border-radius-sm: 6px;
  --border-radius-md: 12px;
  --border-radius-lg: 20px;
  
  --shadow-subtle: 0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05);
  --shadow-premium: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
}
```

---

## Typography & Component Standards

### Typographic Grid
- **Font Stack**: `Outfit` for large display headings (friendly, rounded details) paired with `Inter` for highly legible body copy.
- **Headings**:
  - `h1`: 32px, semibold, tracking tight.
  - `h2`: 24px, semibold, tracking tight.
  - `h3`: 18px, medium.
- **Buttons**: All buttons must incorporate a distinct `active:translate-y-[2px] transition-all` effect to provide physical feel.

---

## Framer Motion Micro-Animations Specs

Dynamic components represent the heartbeat of the user experience. All animations use realistic spring physics instead of flat linear curves:

### 1. The Orange Streak Flame
```typescript
export const streakFlameAnimation = {
  animate: {
    scale: [1, 1.15, 1],
    rotate: [0, -3, 3, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};
```

### 2. Premium XP Level-Up Dialog
Fires on advancing 250 XP. The card scales up dramatically, trigger dynamic color shifts, and fires visual XP counts rising through the layout:
```typescript
export const levelUpModal = {
  initial: { scale: 0.8, opacity: 0, y: 50 },
  animate: { 
    scale: 1, 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 15 } 
  },
  exit: { scale: 0.9, opacity: 0, y: 20 }
};
```

### 3. Dynamic Progress Bars
All course and quiz progress bars must animate their width dynamically when the state updates:
```typescript
export const progressFill = {
  initial: { width: 0 },
  animate: (targetWidth: number) => ({
    width: `${targetWidth}%`,
    transition: { duration: 0.6, ease: "circOut" }
  })
};
```

---

## Visual States for Quiz & Course Cards
- **Locked Course**: Represented as a glassmorphic background layer (`backdrop-blur-md bg-white/60`) over the card with a centralized, premium padlock icon that bounces slightly on hover.
- **Instant Quiz Feedback**:
  - **Correct Answer**: Selection immediately scales slightly, turns deep emerald green with a checkmark, and plays an encouraging sound.
  - **Incorrect Answer**: Vibrates along the X-axis (shake animation), highlighting the selected element in crimson red while showing the correct answer in green.
