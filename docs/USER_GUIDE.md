# About Time - User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Libraries](#libraries)
3. [Composite Variables](#composite-variables)
4. [Confidence Factors](#confidence-factors)
5. [Author Linking and Updates](#author-linking-and-updates)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Introduction

About Time is a meal planning and schedule optimization system that helps you organize your time using templates, variables, and libraries. This guide covers the advanced features that make template management powerful and flexible.

## Libraries

### What are Libraries?

Libraries are collections of templates that help you organize and scope your work. Think of them as folders or categories for your templates.

**Key Benefits:**
- **Organization**: Group related templates together
- **Scoping**: Templates in a library are visible within that context
- **Collaboration**: Share libraries with others (coming soon)
- **Reusability**: Build up a collection of templates you use frequently

### Types of Libraries

**Global Libraries**
- Not tied to any specific lane template
- Available across your entire workspace
- Great for frequently-used building blocks
- Example: "Common Meals", "Quick Workouts"

**Lane-Specific Libraries**
- Automatically created when you make a lane template
- Contains templates specific to that lane
- Perfect for organizing segments within a complex routine
- Example: "Sunday Meal Prep" lane has its own library

### Creating a Library

```typescript
// Manual creation
1. Click "Manage Libraries" in the Build view
2. Click "Create Library"
3. Enter name and description
4. Choose visibility (private/public)
5. Click "Create"

// Automatic creation
- A library is automatically created when you create a lane template
- Named "[Lane Name] Library"
```

### Adding Templates to Libraries

1. From template card, click menu → "Add to Library"
2. Select one or more libraries
3. Optionally add notes and tags
4. Click "Add"

**Multi-Library Support:**
- Templates can belong to multiple libraries
- Useful for templates that fit multiple categories
- Example: "Protein Shake" in both "Quick Meals" and "Post-Workout"

### Library Features

**De-duplication Toggle**
- View templates once even if they're in multiple libraries
- Shows "In X libraries" badge
- Toggle in search bar

**Usage Tracking**
- Tracks when templates are used
- Shows "Last used: X days ago"
- Helps identify unused templates

**Cleanup Tools**
- Find templates never used
- Find templates not used in 90+ days
- Bulk remove from library
- Statistics: total, never used, average usage

**Export/Import**
- Export library as JSON file
- Share with others
- Import creates new library with all templates
- Preserves notes, tags, and organization

## Composite Variables

### What are Composite Variables?

Composite variables are reusable groups of variables that represent common units or concepts.

**Example:**
Instead of defining these variables separately every time:
- calories: 500
- protein_g: 50
- carbs_g: 60
- fats_g: 15

Create a composite called "complete_meal" that contains all of them.

### Creating Composites

1. Click "Create Composite" in variable editor
2. Enter composite name (e.g., "complete_meal")
3. Add variables with values and confidence bounds
4. Set visibility (private/public)
5. Click "Create"

### Using Composites

**As Snapshot:**
- Frozen copy at a specific version
- Won't change even if source composite updates
- Use when you want stability

**As Live Link:**
- Reference to latest version
- Automatically pulls updates
- Use when you want to receive improvements

### Composite Expansion

When you use a composite with a count/multiplier, the system expands it:

```typescript
// Input: 3 × complete_meal
{
  compositeName: "complete_meal",
  count: 3,
  composition: {
    calories: 500,
    protein_g: 50
  }
}

// Output (expanded):
{
  calories: 1500,  // 500 × 3
  protein_g: 150   // 50 × 3
}
```

### Versioning and Updates

- Each composite has a version number
- Updates increment the version
- Snapshots stay at their captured version
- Live links automatically pull new versions

## Confidence Factors

### Understanding Confidence

Real-world measurements are never exact. Confidence factors let you express uncertainty:

```typescript
{
  value: 500,      // Nominal/expected value
  lower: 450,      // Minimum (10% lower)
  upper: 550       // Maximum (10% higher)
}
```

**Displayed as:** `500 ±10% (450-550)`

### When to Use Confidence

- **Measurements**: Food portions vary (±5-10%)
- **Time estimates**: Tasks rarely take exactly the same time (±20%)
- **Production**: Yields fluctuate (±15%)
- **Consumption**: Usage varies by day/person (±10-30%)

### Confidence Propagation

The system automatically combines confidence intervals when aggregating:

```typescript
// Meal 1: 500 ±10% (450-550)
// Meal 2: 600 ±15% (510-690)
// Total:  1100 ±12.7% (960-1240)
```

**Algorithm:**
1. Sum nominal values
2. Calculate combined uncertainty
3. Compute new confidence interval
4. Prevent unbounded growth with floor/ceiling

### Viewing Confidence

**Composite View:**
- Shows high-level units
- Example: "2 × complete_meal"

**Expanded View:**
- Shows all atomic values
- Example: "1000 calories ±12% (880-1120)"
- Toggle in search bar

## Author Linking and Updates

### Template Attribution

When you fork or link to someone else's template:
- Original author is tracked
- Version history maintained
- Updates available when author improves template

### Fork vs Live-Link

**Fork (Independent Copy):**
- Creates new template with new ID
- You own it completely
- Make any changes you want
- Won't receive author's updates
- Attribution preserved

**Live-Link (Connected):**
- References original template
- Automatically receives updates
- Can't modify the template
- Can break link at any time
- Always uses latest version

### Receiving Updates

**Notification:**
```
🔔 Template Update Available

Alice's Meal Prep v12 → v13
• Updated marinade timing (20m → 15m)
• Fixed typo in instructions

[View Changes] [Update Now] [Break Link]
```

**In Template Editor:**
```
ℹ️ Update Available: v13
[View Changes] [Update Now] [Break Link]
```

### Update Workflow

1. Receive notification of new version
2. View changelog to see what changed
3. Check if you have local modifications (warning shown)
4. Decide: Update, Break Link, or Dismiss
5. If updating, template syncs to new version
6. Success notification confirms update

### Breaking Links

**When to break:**
- You want to make custom modifications
- Don't want author's future updates
- Template diverged from your needs

**What happens:**
- Link removed (becomes "original")
- You own the template
- No more update notifications
- Can modify freely

## Best Practices

### Library Organization

**Do:**
- Use descriptive names ("Sunday Meal Prep", not "Library 1")
- Add descriptions to explain library purpose
- Use tags for cross-cutting concerns
- Review and clean up unused templates quarterly

**Don't:**
- Create too many small libraries (aim for 5-15)
- Let libraries grow unbounded (>50 templates)
- Forget to add templates to appropriate libraries

### Composite Variables

**Do:**
- Name composites clearly ("complete_meal" not "cm1")
- Include confidence bounds for all values
- Version composites when making significant changes
- Document what the composite represents

**Don't:**
- Create composites for single values (just use atomic)
- Nest composites too deeply (max 2-3 levels)
- Use live links unless you actually want auto-updates

### Confidence Factors

**Do:**
- Be realistic about uncertainty (usually ±5-20%)
- Tighter bounds for measured values (±5%)
- Wider bounds for estimates (±20-30%)
- Use expanded view to see combined uncertainty

**Don't:**
- Use zero confidence (always some variation)
- Use very wide bounds (±50%+) unless truly uncertain
- Ignore confidence in aggregated values

### Template Attribution

**Do:**
- Fork when you plan to customize
- Live-link when you want author's improvements
- Check for updates regularly (weekly)
- Read changelogs before updating

**Don't:**
- Modify live-linked templates (break link first)
- Ignore update notifications (they may fix bugs)
- Update without reviewing changes
- Fork unnecessarily (use live-link if possible)

## Troubleshooting

### Common Issues

**"Circular reference detected"**
- You're trying to add a lane template to a library where it would reference itself
- Solution: Don't add Lane A to Lane B's library if Lane B is in Lane A
- Check: GET /api/libraries/:id/check-cycles to find existing cycles

**"Template not found in library"**
- Template was removed from the library
- Solution: Add it back using "Add to Library"
- Check: Make sure you're in the right library

**"Update failed: local modifications"**
- You've modified a live-linked template
- Solution: Break the link first, then make changes
- Or: Discard local changes and update to new version

**"Composite expansion failed"**
- Referenced composite doesn't exist or was deleted
- Solution: Use snapshot instead of live-link
- Or: Recreate the composite with same name

**"Usage count not updating"**
- Template isn't being tracked when added to segments
- Solution: Ensure migration 0008 was applied
- Check: GET /api/templates/:id/usage-stats

### Getting Help

1. Check this guide's relevant section
2. Review error message carefully
3. Check API.md for endpoint documentation
4. Review ARCHITECTURE.md for technical details
5. File issue on GitHub with:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots if relevant

### Performance Tips

**Large Libraries:**
- Use search to find templates quickly
- Enable de-duplication to reduce visual clutter
- Archive unused templates regularly

**Complex Hierarchies:**
- Keep lane depth reasonable (<5 levels)
- Use composite variables instead of deep nesting
- Break up very large lanes into multiple smaller ones

**Confidence Calculations:**
- Expanded view is slower for many templates
- Use composite view when performance matters
- Confidence propagation is cached automatically

## Additional Resources

- **API Documentation**: See [API.md](./API.md)
- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Development Guide**: See [CLAUDE.md](../CLAUDE.md)
- **GitHub Issues**: Report bugs and request features
