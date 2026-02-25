# Happy Path: Zero to Hero User Journey

## Overview

This document describes the ideal user journey through About Time, from discovering the application to becoming a proficient user who tracks meal prep, consumption, shopping, composition, and analyzes their nutrition behaviors.

## Core User Journey

### Phase 1: Discovery & First Template (5 minutes)

**User Goal**: Find a recipe online and create their first meal template.

1. **User discovers a recipe online** (e.g., "Greek Yogurt Bowl with Berries")
   - Finds recipe on a website, blog, or social media
   - Has preparation details: ingredients, time, nutrition facts

2. **Opens About Time for the first time**
   - Lands in **BUILD** tab (default first-time view)
   - Sees empty state with friendly call-to-action: "Build your first meal template"
   - Clicks "Create Template" button

3. **Creates first template using manual form**
   - Enters basic info:
     - Name: "Greek Yogurt Bowl with Berries"
     - Duration: 10 minutes (prep + consume)
     - Description: "High-protein breakfast with fresh berries"
   - Defines **food variables consumed** (ingredients):
     - Greek yogurt: 200g
     - Mixed berries: 100g
     - Granola: 30g
     - Honey: 15ml
   - Defines **food variables produced** (nutritional output):
     - Calories: 450 kcal
     - Protein: 25g
     - Carbs: 55g
     - Fats: 12g
     - Fiber: 8g
   - Sets resource consumption:
     - Prep time: 5 minutes
     - Cost: $3.50

4. **Saves template to library**
   - Template added to personal library
   - User sees first template card with color badge
   - Success notification: "Template created!"

**Key Learning**: Users understand that templates capture both what goes in (consumed) and what comes out (produced).

---

### Phase 2: Building a Taxonomy (15 minutes)

**User Goal**: Create a personal taxonomy of meal templates organized by meal type, nutrition goals, and occasions.

5. **Creates more meal templates**
   - **Breakfast templates**:
     - "Protein Pancakes" (high protein, moderate carbs)
     - "Overnight Oats" (fiber-focused, meal prep friendly)
     - "Scrambled Eggs with Toast" (quick, high protein)
   - **Lunch templates**:
     - "Grilled Chicken Salad" (low carb, high protein)
     - "Quinoa Buddha Bowl" (balanced macros, vegetarian)
     - "Turkey Sandwich" (quick, portable)
   - **Dinner templates**:
     - "Baked Salmon with Veggies" (omega-3, low carb)
     - "Stir-Fry Chicken" (high protein, moderate carbs)
     - "Pasta Primavera" (carb-focused, vegetarian)
   - **Snack templates**:
     - "Protein Shake" (quick, post-workout)
     - "Apple with Almond Butter" (fiber, healthy fats)
     - "Hummus with Veggies" (fiber, moderate protein)

6. **Develops personal taxonomy through custom variables**
   - Uses standard variables: calories, protein, carbs, fats, fiber
   - Adds custom variables for personal tracking:
     - `water_ml`: Water content in meals
     - `caffeine_mg`: Caffeine tracking (coffee, tea)
     - `meal_prep_friendly`: Boolean flag for batch cooking
     - `cooking_skill_level`: 1-5 scale (ease of preparation)
     - `spice_level`: 1-5 scale (personal preference)
   - Organizes templates using naming conventions:
     - Prefix by meal type: "BREAKFAST - ...", "LUNCH - ...", "DINNER - ..."
     - Tag by goal: "HP - ..." (high protein), "LC - ..." (low carb)
     - Mark occasions: "WD - ..." (weekday), "WE - ..." (weekend)

7. **Uses the template library effectively**
   - Searches by name: "chicken" → finds all chicken-based meals
   - Sorts by protein: finds highest protein options
   - Saves custom filters:
     - "High Protein Meals" (protein_g > 30)
     - "Quick Meals" (duration < 15 minutes)
     - "Meal Prep Friendly" (meal_prep_friendly = true)
   - Filter picker dropdown lets them switch contexts quickly

**Key Learning**: Users build a personalized taxonomy that reflects their nutrition goals, lifestyle, and preferences.

---

### Phase 3: Advanced Template Composition (20 minutes)

**User Goal**: Create complex meal templates using composition and access nested template variables.

8. **Creates composite templates (LaneTemplates)**
   - **"Sunday Meal Prep Session"** (LaneTemplate):
     - Segments:
       - "Grilled Chicken Batch" (BusyTemplate, 45 min, produces 6 servings)
       - "Quinoa Batch Cook" (BusyTemplate, 25 min, produces 8 servings)
       - "Roasted Veggie Batch" (BusyTemplate, 35 min, produces 6 servings)
     - Total duration: 105 minutes (with parallel cooking)
     - **Accesses nested variables**: Can see total protein produced across all batches
   - **"Morning Routine"** (LaneTemplate):
     - Segments:
       - "Coffee with Milk" (5 min, 100 cal)
       - "Protein Pancakes" (15 min, 450 cal)
       - "Multivitamin" (1 min, 0 cal)
     - Total duration: 21 minutes
     - **Variable summaries**: Shows total calories, caffeine, protein for entire routine

9. **Uses the Template Editor (Hierarchy Viewer)**
   - Opens "Sunday Meal Prep Session" in editor
   - Sees recursive visualization:
     ```
     [Grilled Chicken Batch]
     [Quinoa Batch Cook]
     [Roasted Veggie Batch]
     [Sunday Meal Prep Session (base)]
     ```
   - **Applies layout functions** from about-time-core:
     - Uses "Pack Tightly" button → segments start immediately after each other
     - Uses "Distribute Evenly" button → spreads segments across 2-hour window
     - Uses "Add Gap" button → inserts 10-minute breaks between segments
   - **Properties panel shows**:
     - Variables declared in "Sunday Meal Prep Session" itself
     - **Summaries of nested segment variables**:
       - Total protein produced: 180g (across all batches)
       - Total prep time: 105 minutes
       - Total servings produced: 20 servings
       - Total cost: $25.00

10. **Reorders, adds, removes segments**
    - Reorders segments: moves "Quinoa Batch Cook" to start (uses less heat)
    - Adds new segment: "Brown Rice Batch" (30 min)
    - Removes segment: "Roasted Veggie Batch" (buying pre-made this week)
    - Uses helper buttons to re-apply layout after changes
    - All nested variable summaries update automatically

**Key Learning**: Users understand template composition, can build complex meal prep sessions, and leverage layout functions for efficient scheduling.

---

### Phase 4: Scheduling & Execution (30 minutes)

**User Goal**: Schedule meals for the week and track daily consumption.

11. **Switches to SCHEDULE tab**
    - Sees clean calendar view (day/week toggle)
    - Clicks FAB "+" button to add meals
    - Clicks desired time slot (e.g., Monday 8:00 AM)
    - Inline scheduler appears:
      - Searches templates: "breakfast"
      - Selects "Protein Pancakes"
      - Time picker: 8:00 AM
      - Impact preview: "+450 cal, +25g protein"
      - Layout option: "Insert (push others)"
      - Clicks "Add Meal"

12. **Schedules entire week**
    - Monday: 3 meals + 2 snacks
    - Tuesday: 3 meals + 1 snack
    - Uses "Copy Day" feature: Wednesday = Monday schedule
    - Applies layout preset: "Intermittent Fasting 16:8"
      - All meals distributed between 12:00 PM - 8:00 PM
      - Uses "Distribute Evenly" layout function
    - Views daily nutrition totals:
      - Monday: 2,050 cal, 155g protein ✅ (meets goals)
      - Tuesday: 1,800 cal, 130g protein ⚠️ (20g protein short)
    - Adds protein shake to Tuesday to hit goals

13. **Switches to EXECUTE tab on Monday morning**
    - Sees next meal countdown:
      ```
      🍳 Next Meal in 45m

      Protein Pancakes
      450 cal · 25g protein

      [Skip]  [Ate It]  [Reschedule]
      ```
    - Views nutrition progress (grouped):
      - **Macros** (expanded):
        - Calories: 0 / 2,000 kcal [          ]
        - Protein: 0 / 150g [          ]
      - **Micros** (collapsed)
      - **Custom** (collapsed)

14. **Tracks meals throughout the day**
    - 8:00 AM: Checks off "Protein Pancakes"
      - Satisfying completion animation
      - Nutrition updates: 450 / 2,000 cal, 25 / 150g protein
      - Progress bars update in real-time
    - 10:30 AM: Adds unscheduled snack (apple)
      - Uses "Add Snack" quick action
      - Updates nutrition budget
    - 12:30 PM: Checks off lunch
    - 3:00 PM: **Swaps scheduled snack**
      - Was: "Hummus with Veggies"
      - Swaps to: "Protein Shake" (need more protein)
      - One-tap swap from meal card
    - 6:00 PM: Checks off dinner
    - End of day: **All meals completed!**
      - Daily summary:
        - Calories: 2,050 / 2,000 (+50) ✅
        - Protein: 155 / 150 (+5g) ✅
        - Carbs: 198 / 200 (-2g) ✅
        - Fats: 67 / 65 (+2g) ✅

**Key Learning**: Users schedule meals visually, track execution in real-time, and make on-the-fly adjustments to meet goals.

---

### Phase 5: Shopping & Meal Prep Composition (45 minutes)

**User Goal**: Generate shopping lists and execute meal prep sessions efficiently.

15. **Plans shopping list from scheduled meals**
    - Reviews weekly schedule (Monday - Sunday)
    - Sees all meals planned for the week
    - Generates shopping list (future feature):
      - Aggregates all `willConsume` variables across the week
      - Groups by ingredient category:
        - Produce: berries, apples, lettuce, tomatoes, etc.
        - Proteins: chicken, salmon, Greek yogurt, eggs
        - Grains: quinoa, oats, whole wheat bread
        - Pantry: almond butter, honey, olive oil
      - Shows quantities needed:
        - Greek yogurt: 1,400g (7 servings × 200g)
        - Chicken breast: 900g (6 servings × 150g)
        - Mixed berries: 700g (7 servings × 100g)

16. **Executes "Sunday Meal Prep Session"**
    - Opens Execute tab on Sunday afternoon
    - Sees "Sunday Meal Prep Session" as next scheduled activity
    - Countdown shows: "Next: Meal Prep in 15m"
    - Clicks "Start" at scheduled time
    - Hierarchy viewer shows all segments:
      ```
      [Grilled Chicken Batch] - 45 min
      [Quinoa Batch Cook] - 25 min
      [Brown Rice Batch] - 30 min
      ```
    - Layout applied: "Pack Tightly" with 5-minute gaps
    - Uses helper buttons during prep:
      - Clicks "Distribute Evenly" → spreads tasks over 2 hours (to use oven + stove efficiently)
      - Sees nested variable summaries:
        - Total protein produced: 180g
        - Total servings: 20 servings
        - Total cost: $25.00
    - Checks off each batch as completed
    - End of session:
      - All batches complete
      - Kitchen stocked with prepped meals for the week

17. **Composes meals from prepped batches**
    - Creates new templates using prepped components:
      - **"Quick Lunch Bowl"** (LaneTemplate):
        - Segments:
          - "Grilled Chicken Portion" (1 serving, 150g, 35g protein)
          - "Quinoa Portion" (1 serving, 100g, 15g carbs)
          - "Roasted Veggies Portion" (1 serving, 150g, 5g fiber)
        - Total duration: 5 minutes (assembly only, no cooking)
        - **Variable summaries**: 450 cal, 35g protein, 40g carbs, 10g fats
    - Schedules "Quick Lunch Bowl" for weekdays
    - Sees cost savings: $4.50/meal (vs. $12 eating out)

**Key Learning**: Users integrate meal prep into their workflow, compose meals from prepped batches, and optimize for time/cost efficiency.

---

### Phase 6: Analysis & Optimization (Ongoing)

**User Goal**: Analyze nutrition patterns, identify gaps, and optimize meal planning.

18. **Reviews weekly trends** (future feature)
    - Views nutrition analytics:
      - Average daily calories: 2,025 kcal (goal: 2,000)
      - Average daily protein: 152g (goal: 150g) ✅
      - Fiber average: 25g (goal: 30g) ⚠️ (5g short)
      - Meal completion rate: 95% (excellent adherence)
    - Identifies patterns:
      - Always skips breakfast on weekends
      - Protein highest on Monday-Wednesday (meal prep days)
      - Fiber consistently low (needs more vegetables)

19. **Optimizes template library**
    - Creates new templates to fill gaps:
      - "High-Fiber Breakfast" (15g fiber)
      - "Weekend Brunch" (flexible timing, enjoyable)
    - Adjusts existing templates:
      - Adds spinach to "Grilled Chicken Salad" (+3g fiber)
      - Increases berry portion in "Overnight Oats" (+2g fiber)
    - Uses saved filters to find optimization candidates:
      - "Low Fiber Meals" filter → identifies meals to enhance
      - "Weekend Meals" filter → finds relaxed options

20. **Refines personal taxonomy**
    - Tags templates with new categories:
      - `meal_prep_batch`: True for batch-cooking templates
      - `assembly_only`: True for no-cook templates
      - `seasonal`: Summer, Fall, Winter, Spring
    - Saves advanced filters:
      - "Summer High-Protein" (protein_g > 30, seasonal = Summer)
      - "Weekday Quick Assembly" (duration < 10, assembly_only = true)
    - Archives unused templates (but keeps for future reference)

21. **Shares templates with community** (future feature)
    - Exports favorite templates:
      - "Sunday Meal Prep Session"
      - "Greek Yogurt Bowl with Berries"
      - "Quick Lunch Bowl"
    - Uploads to community library
    - Others can import and adapt to their taxonomy

**Key Learning**: Users continuously refine their system, analyze patterns, and optimize their nutrition strategy over time.

---

## Success Indicators

### Zero to Hero Metrics

**After 1 Week**:
- Created 10+ meal templates
- Established personal taxonomy with custom variables
- Scheduled 3+ days in advance
- 80%+ meal completion rate

**After 1 Month**:
- Library of 30+ templates
- Using composite templates (LaneTemplates)
- Applying layout functions effectively
- Consistent goal achievement (5+ days/week)
- Shopping list generation integrated into workflow

**After 3 Months**:
- Library of 50+ templates across all meal types
- Advanced taxonomy with 5+ custom variables
- Meal prep sessions scheduled and executed regularly
- 90%+ meal completion rate
- Cost savings of $100+/month vs. eating out
- Analyzing trends and optimizing continuously

---

## Key User Behaviors Supported

### 1. Meal Prep
- Create batch cooking templates (LaneTemplates)
- Track food variables consumed (ingredients, quantities)
- Track food variables produced (servings, nutrition per serving)
- Apply layout functions to optimize cooking order

### 2. Consumption
- Schedule meals throughout the day
- Check off meals as eaten
- Track actual vs. planned nutrition
- Make real-time adjustments

### 3. Shopping
- Generate shopping lists from scheduled meals (future)
- Aggregate `willConsume` variables across week
- Track costs and optimize budget

### 4. Composition
- Build composite templates from atomic meals
- Access nested template variables
- Apply layout functions for efficient scheduling
- Reuse components across templates

### 5. Analysis
- Review weekly nutrition trends (future)
- Identify gaps and patterns
- Optimize template library based on usage
- Continuously refine personal taxonomy

---

## Design Principles Supporting the Journey

1. **Progressive Disclosure**: Start simple (single meal template), gradually introduce complexity (composition, layout functions)

2. **User-Defined Taxonomy**: No prescribed categories; users create their own variable names and organization system

3. **Transparency**: Always show what's consumed (inputs) and produced (outputs) for each template

4. **Flexibility**: Support both atomic templates (BusyTemplate) and composite templates (LaneTemplate)

5. **Real-Time Feedback**: Immediate updates to nutrition budgets, variable summaries, and schedule changes

6. **Efficiency Tools**: Layout functions, quick actions, filters, and saved presets reduce cognitive load

7. **Iteration Friendly**: Templates can be edited, refined, and reorganized at any time without losing data

---

## Technical Requirements for Happy Path

### Template Editor Must Support:
- ✅ Helper buttons for layout functions (Pack, Distribute, Add Gap, etc.)
- ✅ Variable summaries for nested segments (recursive aggregation)
- ✅ Access to both template-declared variables AND nested segment variables
- ✅ Real-time updates when segments are added/removed/reordered

### Build View Must Support:
- ✅ User-defined taxonomy (custom variable names)
- ✅ Saved filters with picker dropdown
- ✅ Template composition (LaneTemplates with BusyTemplate segments)
- ✅ Recursive visualization of nested structure

### Schedule View Must Support:
- ✅ Visual calendar with meal placement
- ✅ Inline scheduler with template library integration
- ✅ Layout functions applied to daily schedules
- ✅ Nutrition impact preview before placement

### Execute View Must Support:
- ✅ Real-time nutrition tracking (consumed vs. goals)
- ✅ Meal check-off with satisfying feedback
- ✅ Quick actions for on-the-fly adjustments
- ✅ Daily summary with actual vs. planned

---

## Conclusion

The happy path transforms a new user into a proficient "hero" who:
- Has a personalized taxonomy of 50+ meal templates
- Uses composition to build complex meal prep sessions
- Schedules entire weeks in advance using layout functions
- Tracks execution with 90%+ completion rate
- Analyzes patterns and continuously optimizes
- Saves time and money through efficient meal planning

**The key differentiator**: Users create their OWN taxonomy of food variables, compose complex templates from atomic parts, and apply about-time-core layout functions directly in the UI.
