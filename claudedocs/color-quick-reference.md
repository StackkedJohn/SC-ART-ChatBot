# Color Quick Reference Guide

## Brand Colors at a Glance

```
🎨 CORAL    #f1737a  ███████  Primary/Interactive
🎨 CHARCOAL #363636  ███████  Text/Dark
🎨 CREAM    #ffeec6  ███████  Background/Light
```

## Common Usage Patterns

### Buttons
```tsx
// Primary button (coral background, white text)
<Button>Click Me</Button>
<button className="bg-primary text-primary-foreground">Click Me</button>

// Secondary button (cream variation)
<Button variant="secondary">Cancel</Button>

// Outline button (cream background, charcoal border)
<Button variant="outline">Learn More</Button>

// Direct brand color
<button className="bg-brand-coral text-white">Custom</button>
```

### Cards & Surfaces
```tsx
// Standard card (cream background, charcoal text)
<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Custom card with brand styling
<div className="card-brand p-4">
  <h3 className="text-foreground">Heading</h3>
  <p className="text-muted-foreground">Description</p>
</div>
```

### Text Colors
```tsx
// Primary text (charcoal)
<p className="text-foreground">Main content</p>

// Muted text (lighter gray)
<p className="text-muted-foreground">Secondary content</p>

// Brand coral text
<span className="text-primary">Highlight</span>
<span className="text-brand-coral">Direct coral</span>

// On colored backgrounds
<div className="bg-primary">
  <p className="text-primary-foreground">White text</p>
</div>
```

### Links
```tsx
// Standard link (coral color)
<a href="#" className="text-primary hover:text-primary/80 underline">
  Link text
</a>

// Custom brand link
<a href="#" className="link-brand">
  Brand link
</a>
```

### Backgrounds
```tsx
// Page background (cream)
<div className="bg-background">Page content</div>

// Card background (lighter cream)
<div className="bg-card">Card content</div>

// Secondary background
<div className="bg-secondary">Secondary section</div>

// Direct brand backgrounds
<div className="bg-brand-cream">Cream background</div>
<div className="bg-brand-coral">Coral background</div>
<div className="bg-brand-charcoal">Dark background</div>
```

### Borders
```tsx
// Standard border (subtle gray)
<div className="border border-border">Content</div>

// Input border
<input className="border border-input" />

// Colored borders
<div className="border-2 border-primary">Coral border</div>
```

### Focus States
```tsx
// Standard focus ring (coral)
<button className="focus-visible:ring-2 focus-visible:ring-ring">
  Button
</button>

// Custom focus
<input className="focus:border-primary focus:ring-primary" />
```

### State Colors
```tsx
// Success state
<div className="success-state">
  Operation successful
</div>

// Warning state
<div className="warning-state">
  Warning message
</div>

// Error state
<div className="bg-destructive text-destructive-foreground">
  Error message
</div>
```

## Color Combinations

### High Contrast (AAA)
```
✅ Charcoal text on Cream background (#363636 on #ffeec6)
   Perfect for body text, headings, and long-form content
```

### Medium Contrast (AA)
```
✅ Coral on Cream (#f1737a on #ffeec6)
   Good for buttons, large text, borders, and interactive elements

✅ White on Coral (#ffffff on #f1737a)
   Good for button text and icons on coral backgrounds
```

### Color Hierarchy
```
1. HEADINGS:     text-foreground (charcoal - highest emphasis)
2. BODY TEXT:    text-foreground (charcoal - standard)
3. SECONDARY:    text-muted-foreground (gray - reduced emphasis)
4. INTERACTIVE:  text-primary (coral - draws attention)
```

## Component-Specific Examples

### Navigation
```tsx
<nav>
  <a className="text-foreground hover:text-primary">Home</a>
  <a className="text-muted-foreground hover:text-foreground">About</a>
</nav>
```

### Forms
```tsx
<form>
  <label className="text-foreground">Name</label>
  <input className="bg-background border-input focus:border-primary" />
  <p className="text-muted-foreground text-sm">Helper text</p>
  <Button type="submit">Submit</Button>
</form>
```

### Tables
```tsx
<table>
  <thead className="bg-secondary">
    <tr className="text-foreground font-semibold">
      <th>Column</th>
    </tr>
  </thead>
  <tbody className="bg-card">
    <tr className="border-b border-border hover:bg-muted">
      <td className="text-foreground">Data</td>
    </tr>
  </tbody>
</table>
```

### Alerts
```tsx
// Info (using primary/coral)
<div className="bg-primary/10 border-l-4 border-primary p-4">
  <p className="text-foreground">Information</p>
</div>

// Success
<div className="success-state p-4">
  <p>Success message</p>
</div>

// Warning
<div className="warning-state p-4">
  <p>Warning message</p>
</div>

// Error
<div className="bg-destructive/10 border-l-4 border-destructive p-4">
  <p className="text-destructive">Error message</p>
</div>
```

## Direct Brand Color Usage

When semantic tokens aren't sufficient:

### Backgrounds
- `bg-brand-coral` - Coral background
- `bg-brand-coral-dark` - Darker coral
- `bg-brand-coral-light` - Lighter coral
- `bg-brand-charcoal` - Dark background
- `bg-brand-charcoal-light` - Lighter dark
- `bg-brand-cream` - Cream background
- `bg-brand-cream-dark` - Darker cream

### Text
- `text-brand-coral` - Coral text
- `text-brand-charcoal` - Charcoal text

### Borders
- `border-brand-coral` - Coral border
- `border-brand-charcoal` - Charcoal border
- `border-brand-cream` - Cream border

## Opacity Modifiers

Use `/[value]` for opacity:
```tsx
<div className="bg-primary/10">10% opacity</div>
<div className="bg-primary/50">50% opacity</div>
<div className="bg-primary/90">90% opacity</div>
<div className="text-primary/80">80% opacity text</div>
```

## Dark Mode (Optional)

Add `dark:` prefix for dark mode variants:
```tsx
<div className="bg-background dark:bg-background">
  <p className="text-foreground dark:text-foreground">
    Adapts to dark mode
  </p>
</div>
```

## Migration Patterns

### Replace Old Colors
```tsx
// OLD → NEW
text-gray-600     → text-muted-foreground
text-gray-900     → text-foreground
text-blue-500     → text-primary
bg-white          → bg-card or bg-background
bg-gray-100       → bg-secondary or bg-muted
border-gray-200   → border-border
hover:bg-blue-50  → hover:bg-primary/10
```

## Tips & Best Practices

1. **Use Semantic Tokens First:** Always prefer `bg-primary` over `bg-brand-coral`
2. **Maintain Hierarchy:** Use muted colors for less important content
3. **Test Contrast:** Ensure text is readable on all backgrounds
4. **Consistent Interactive:** All clickable elements should use coral (primary)
5. **Subtle Backgrounds:** Use cream variations for depth without distraction
6. **Focus Visible:** Always include focus states for accessibility

## Color Selection Decision Tree

```
Need a color? Ask:
├─ Is it interactive? → use text-primary (coral)
├─ Is it text?
│  ├─ Primary content? → use text-foreground (charcoal)
│  └─ Secondary? → use text-muted-foreground
├─ Is it a background?
│  ├─ Page level? → use bg-background (cream)
│  ├─ Card/surface? → use bg-card (lighter cream)
│  └─ Highlighted? → use bg-primary (coral)
└─ Is it a border? → use border-border (subtle gray)
```

## Resources

- **Full Documentation:** `/claudedocs/brand-color-system.md`
- **Implementation Summary:** `/claudedocs/color-implementation-summary.md`
- **Live Preview:** `http://localhost:3000`
