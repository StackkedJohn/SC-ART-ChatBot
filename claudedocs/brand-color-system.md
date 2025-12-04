# Brand Color System Documentation

## Overview
This document outlines the brand color system implemented across the Next.js AI Knowledge Base application.

## Brand Colors

### Primary Colors

#### Coral/Salmon Pink (#f1737a)
- **HSL:** `357, 79%, 69%`
- **Usage:** Primary interactive elements, buttons, links, accents, highlights
- **Accessibility:** Provides good contrast with white and cream backgrounds
- **CSS Variable:** `--primary`
- **Tailwind Classes:** `bg-primary`, `text-primary`, `border-primary`, `bg-brand-coral`

#### Dark Charcoal (#363636)
- **HSL:** `0, 0%, 21%`
- **Usage:** Primary text, headings, dark UI elements
- **Accessibility:** Excellent contrast ratio with light backgrounds (AAA compliant)
- **CSS Variable:** `--foreground`
- **Tailwind Classes:** `text-foreground`, `bg-brand-charcoal`

#### Cream/Light Yellow (#ffeec6)
- **HSL:** `44, 100%, 89%`
- **Usage:** Primary background, card backgrounds, light surfaces
- **Accessibility:** Provides warm, inviting base while maintaining readability
- **CSS Variable:** `--background`
- **Tailwind Classes:** `bg-background`, `bg-brand-cream`

### Extended Brand Palette

#### Coral Variations
- **Coral Dark:** `#e5565e` - Hover states, darker accents
- **Coral Light:** `#f99ba0` - Subtle highlights, disabled states

#### Charcoal Variations
- **Charcoal Light:** `#585858` - Muted text, secondary content

#### Cream Variations
- **Cream Dark:** `#f5dfa7` - Elevated surfaces, cards

## Color Application Guide

### Backgrounds
- **Page Background:** `bg-background` (cream #ffeec6)
- **Card/Surface:** `bg-card` (lighter cream 95% lightness)
- **Elevated Elements:** `bg-popover` (lighter cream)

### Text
- **Primary Text:** `text-foreground` (charcoal #363636)
- **Muted Text:** `text-muted-foreground` (40% lightness gray)
- **On Primary:** `text-primary-foreground` (white for coral backgrounds)

### Interactive Elements
- **Buttons Primary:** `bg-primary text-primary-foreground` (coral with white text)
- **Buttons Secondary:** `bg-secondary text-secondary-foreground` (cream variation)
- **Links:** `text-primary hover:text-primary/80`
- **Focus Ring:** `ring-primary` (coral)

### Borders & Dividers
- **Default Border:** `border-border` (85% lightness gray)
- **Input Border:** `border-input` (85% lightness gray)
- **Subtle Dividers:** `border-muted`

### State Colors

#### Success
- Background: `bg-green-100`
- Text: `text-green-800`
- Border: `border-green-300`

#### Warning
- Background: `bg-orange-100`
- Text: `text-orange-800`
- Border: `border-orange-300`

#### Error/Destructive
- Background: `bg-destructive` (50% lightness red)
- Text: `text-destructive-foreground` (white)

## Accessibility Considerations

### Contrast Ratios (WCAG 2.1)
- **Charcoal on Cream:** ~11.5:1 (AAA - excellent)
- **Coral on White:** ~3.8:1 (AA - good for large text)
- **Coral on Cream:** ~3.5:1 (AA - good for large text, borders)
- **White on Coral:** ~2.9:1 (Use for buttons with larger text)

### Best Practices
1. **Text Size:** Use coral primarily for interactive elements, not small body text
2. **Buttons:** Coral with white text works well for primary actions
3. **Links:** Coral provides clear visual distinction on cream background
4. **Focus States:** Coral ring provides clear keyboard navigation feedback

## Utility Classes

### Custom Component Classes
```css
.btn-primary          /* Primary button styling */
.card-brand          /* Brand-styled card */
.link-brand          /* Brand-styled link */
.success-state       /* Success state styling */
.warning-state       /* Warning state styling */
.text-brand-coral    /* Direct coral text */
.text-brand-charcoal /* Direct charcoal text */
```

### Direct Brand Color Usage
```css
bg-brand-coral         /* Coral background */
bg-brand-coral-dark    /* Darker coral */
bg-brand-coral-light   /* Lighter coral */
bg-brand-charcoal      /* Charcoal background */
bg-brand-charcoal-light /* Lighter charcoal */
bg-brand-cream         /* Cream background */
bg-brand-cream-dark    /* Darker cream */
```

## Implementation Files

### Configuration Files
- **Tailwind Config:** `/tailwind.config.ts`
  - Extended color palette with brand colors
  - Direct brand color utilities

- **Global CSS:** `/app/globals.css`
  - CSS variables for theme system
  - Component utility classes
  - Base styling

### Usage Examples

#### Button Component
```tsx
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Click Me
</Button>
```

#### Card Component
```tsx
<Card className="bg-card border-border">
  <CardHeader className="text-foreground">
    <h2>Title</h2>
  </CardHeader>
</Card>
```

#### Link
```tsx
<a href="#" className="text-primary hover:text-primary/80">
  Learn More
</a>
```

## Dark Mode Support

The system includes optional dark mode support with:
- **Background:** Dark charcoal variation (15% lightness)
- **Foreground:** Cream text for contrast
- **Primary:** Coral remains consistent
- **Surfaces:** Slightly lighter charcoal (18% lightness)

## Migration Notes

### Replaced Colors
- Previous blue primary → Coral pink
- Gray backgrounds → Cream
- Dark text → Charcoal

### Hardcoded Colors to Update
Some components may still contain hardcoded colors (e.g., `text-gray-600`, `text-blue-500`). These should be replaced with semantic tokens:
- `text-gray-600` → `text-muted-foreground`
- `text-blue-500` → `text-primary`
- `bg-white` → `bg-card`
- `border-gray-200` → `border-border`

## Testing Recommendations

1. **Visual Testing:** Check all pages for consistent color application
2. **Accessibility Testing:** Verify contrast ratios meet WCAG AA standards
3. **Interactive States:** Test hover, focus, and active states
4. **Responsive Design:** Ensure colors work across all breakpoints
5. **Browser Testing:** Check appearance in multiple browsers

## Future Enhancements

Consider adding:
- Additional semantic tokens for specific use cases
- Enhanced dark mode theming
- Color mode toggle component
- Animation and transition utilities aligned with brand
