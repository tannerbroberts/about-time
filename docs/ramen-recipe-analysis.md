# Ramen Recipe Lane: MCP Tool Analysis

## Overview

Created a complete miso ramen recipe lane using current MCP tools to identify gaps in nutrition tracking capabilities.

**Recipe Source**: https://www.justonecookbook.com/homemade-chashu-miso-ramen/
**Lane ID**: `e52faa6c-0755-47ab-887f-dc0341bef880`
**Templates Generated**: 32 (28 busy + 4 lanes)
**Estimated Time**: 23 minutes

## What Works Well

### 1. Ingredient Variable Tracking
The system handles ingredient variables perfectly:
- `garlic_cloves: 2`
- `ginger_tsp: 0.5`
- `ground_pork_lb: 0.25`
- `chicken_stock_cups: 4`

Variable validation enforces unit naming (e.g., `flour_cups` not `flour`).

### 2. State Flow Management
The lane correctly tracks:
- **Inputs**: Raw ingredients from pantry/fridge
- **Intermediate states**: `minced_garlic_batch`, `aromatic_base_in_pot`, `cooked_noodles_batch`
- **Outputs**: `miso_ramen_bowls: 2`

### 3. Hierarchical Organization
Lane nesting works well for recipe structure:
```
Main Recipe Lane
├─ Gather Ingredients Lane (14 steps)
├─ Prep Aromatics Lane (3 steps)
├─ Cook Broth & Noodles Lane (10 steps)
└─ Assemble Bowls (1 step)
```

## Critical Gaps Identified

### ❌ PROBLEM 1: No Nutrition Data Storage

**Issue**: Recipe has nutritional information, but nowhere to store it.

**Available Data** (per serving):
- Calories: 433 kcal
- Carbs: 37g
- Protein: 19g
- Fat: 25g
- Sodium: 1216mg

**Current Workaround**: None. This data is completely lost.

**User Impact**: Agent cannot generate lanes with nutrition outputs. Users can't see nutritional value of meals.

### ❌ PROBLEM 2: No Nutrition Output Variables

**Issue**: `willProduce` only handles physical items, not nutritional properties.

**What We Want**:
```json
{
  "willProduce": {
    "miso_ramen_bowls": 2,
    "calories_kcal": 866,
    "protein_g": 38,
    "carbs_g": 74,
    "fat_g": 50,
    "sodium_mg": 2432
  }
}
```

**Current Limitation**: Variable validation might not recognize nutrition variables as valid. Unclear if `calories_kcal`, `protein_g`, etc. would be accepted.

### ❌ PROBLEM 3: No Recipe Metadata

**Issue**: No structured way to store recipe-level information.

**What We Need**:
- Source URL
- Servings count
- Prep time vs cook time breakdown
- Difficulty level
- Dietary tags (vegetarian, gluten-free, etc.)
- Cuisine type
- Author/contributor

**Current Workaround**: Cramming metadata into `intent` field:
```
"intent": "Homemade Miso Ramen (2 servings) - Source: https://..."
```

This is not parseable or queryable.

### ❌ PROBLEM 4: No Serving Size Scaling

**Issue**: Recipe quantities are hardcoded.

**Example**: Recipe is for 2 servings. If user wants 4 servings:
- Must manually double all ingredient quantities
- Nutrition values must be manually doubled
- No relationship between servings and quantities

**What We Want**:
```json
{
  "baseServings": 2,
  "ingredients": {
    "garlic_cloves": { "perServing": 1, "total": 2 },
    "ground_pork_lb": { "perServing": 0.125, "total": 0.25 }
  },
  "nutrition": {
    "perServing": { "calories_kcal": 433, "protein_g": 19 },
    "total": { "calories_kcal": 866, "protein_g": 38 }
  }
}
```

### ❌ PROBLEM 5: No Nutrition Aggregation

**Issue**: For nested lanes, no way to sum nutrition across all busy templates.

**Example**: The main recipe lane contains 4 sub-lanes. Even if individual busy templates had nutrition data, there's no tool to:
1. Traverse the lane hierarchy
2. Sum up all nutrition from busy templates
3. Calculate per-serving values
4. Attach totals to parent lane

## Proposed Solutions

Based on these real-world failures, here are the MCP tools we need:

### Tool 1: `add_nutrition_metadata`
```javascript
{
  templateId: 'uuid',
  servings: 2,
  nutritionPerServing: {
    calories_kcal: 433,
    protein_g: 19,
    carbs_g: 37,
    fat_g: 25,
    sodium_mg: 1216,
  },
  sourceUrl: 'https://...',
  tags: ['asian', 'soup', 'pork'],
}
```

Extends BusyTemplate with optional `nutrition` field.

### Tool 2: `calculate_lane_nutrition`
```javascript
{
  laneId: 'uuid',
  servings: 2,
}
// Returns aggregated nutrition for entire lane
```

Recursively traverses lane, sums nutrition from all busy templates, divides by servings.

### Tool 3: `create_nutrition_output_template`
```javascript
{
  intent: 'Miso ramen ready to serve with nutrition info',
  consumeTemplate: 'uuid', // The finished dish
  nutritionData: { ... },
}
// Creates a passthrough template that produces nutrition variables
```

Converts nutrition metadata into actual `willProduce` variables for state flow.

### Tool 4: `scale_recipe_by_servings`
```javascript
{
  laneId: 'uuid',
  fromServings: 2,
  toServings: 4,
}
// Creates new lane with all quantities scaled
```

Multiplies all ingredient quantities and nutrition values proportionally.

## Type Extensions Needed

### BusyTemplate Extension
```typescript
interface BusyTemplate {
  // ... existing fields
  nutrition?: {
    servings?: number;
    perServing?: {
      calories_kcal?: number;
      protein_g?: number;
      carbs_g?: number;
      fat_g?: number;
      fiber_g?: number;
      sugar_g?: number;
      sodium_mg?: number;
      potassium_mg?: number;
      calcium_mg?: number;
      iron_mg?: number;
      vitamin_c_mg?: number;
    };
  };
}
```

### LaneTemplate Extension
```typescript
interface LaneTemplate {
  // ... existing fields
  recipeMetadata?: {
    sourceUrl?: string;
    servings?: number;
    prepTime?: Duration;
    cookTime?: Duration;
    difficulty?: 'easy' | 'medium' | 'hard';
    cuisine?: string;
    tags?: string[];
  };
}
```

## Variable Naming Convention

Need to verify/extend `validateVariableNames` to accept nutrition variables:

**Energy**:
- `calories_kcal`

**Macronutrients (grams)**:
- `protein_g`
- `carbs_g`
- `fat_g`
- `fiber_g`
- `sugar_g`

**Micronutrients (milligrams)**:
- `sodium_mg`
- `potassium_mg`
- `calcium_mg`
- `iron_mg`
- `vitamin_c_mg`
- `vitamin_a_mcg` (micrograms)
- `vitamin_d_mcg`

These should be added to accepted patterns or explicitly whitelisted.

## Test Case Requirements

After implementing tools, verify with ramen recipe:

1. Add nutrition metadata to final assembly template
2. Calculate total nutrition for main recipe lane
3. Create passthrough template that produces nutrition variables
4. Verify lane now has both ingredient inputs and nutrition outputs
5. Scale recipe from 2 servings to 4 servings
6. Verify all values doubled correctly

## Success Criteria

An agent using the improved MCP tools should be able to:

1. Find a recipe online (done ✅)
2. Extract ingredients, steps, and nutrition data (agent task)
3. Create a lane with ingredient inputs (done ✅)
4. Attach nutrition metadata to templates (NEW TOOL NEEDED)
5. Generate nutrition output variables (NEW TOOL NEEDED)
6. Final lane shows:
   - **Inputs**: `flour_cups`, `eggs_count`, `milk_cups`, etc.
   - **Outputs**: `calories_kcal`, `protein_g`, `carbs_g`, etc.
7. User sees complete "recipe contract": ingredients → nutrition

## Implementation Priority

**Phase 1** (Critical for basic nutrition support):
- Add `nutrition` field to BusyTemplate type
- Create `add_nutrition_metadata` tool
- Create `create_nutrition_output_template` tool
- Update variable validation for nutrition variables

**Phase 2** (Enhanced features):
- Add `recipeMetadata` to LaneTemplate type
- Create `calculate_lane_nutrition` tool
- Create lane metadata search/filter tools

**Phase 3** (Advanced features):
- Create `scale_recipe_by_servings` tool
- Add ingredient substitution support
- Add cost estimation per serving
