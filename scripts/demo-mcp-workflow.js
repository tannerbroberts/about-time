#!/usr/bin/env node
/**
 * Demonstration of complete MCP tool workflow for recipe creation
 * Creates a simple Berry Protein Smoothie with full nutrition tracking
 *
 * This simulates what an agent would do with the MCP tools
 */

import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATES_PATH = join(__dirname, '../src/data/templates.json');

// Load existing templates
const library = JSON.parse(readFileSync(TEMPLATES_PATH, 'utf8'));

console.log('🧪 DEMONSTRATION: Complete MCP Tool Workflow');
console.log('='.repeat(70));
console.log('\nRecipe: Berry Protein Smoothie');
console.log('Servings: 1');
console.log('Time: 5 minutes');
console.log('Difficulty: Easy\n');

// Recipe data
const RECIPE = {
  name: 'Berry Protein Smoothie',
  servings: 1,
  totalTime: 300000, // 5 minutes
  ingredients: [
    { name: 'frozen_berries_cups', amount: 1, gatherTime: 15000 },
    { name: 'banana_count', amount: 1, gatherTime: 10000 },
    { name: 'protein_powder_scoops', amount: 1, gatherTime: 10000 },
    { name: 'almond_milk_cups', amount: 1, gatherTime: 10000 },
    { name: 'honey_tbsp', amount: 1, gatherTime: 10000 },
    { name: 'ice_cubes', amount: 4, gatherTime: 5000 },
  ],
  nutrition: {
    calories_kcal: 320,
    protein_g: 25,
    carbs_g: 45,
    fat_g: 5,
    fiber_g: 8,
    sugar_g: 28,
  },
};

const templates = [];

console.log('Step 1: Using create_busy_template for gathering ingredients');
console.log('-'.repeat(70));

// STEP 1: Create busy templates for gathering ingredients
const gatherTemplates = [];
RECIPE.ingredients.forEach((ing, i) => {
  const template = {
    templateType: 'busy',
    id: randomUUID(),
    intent: `Get ${ing.name.replace(/_/g, ' ')} from kitchen`,
    authorId: 'agent',
    version: '0.0.0',
    estimatedDuration: ing.gatherTime,
    references: [],
    willConsume: {},
    willProduce: { [ing.name]: ing.amount },
  };
  gatherTemplates.push(template);
  templates.push(template);
  console.log(`  ✓ Created: "${template.intent}" (${ing.gatherTime}ms) → ${ing.name}: ${ing.amount}`);
});

console.log(`\n  Total: ${gatherTemplates.length} gather templates\n`);

// STEP 2: Create busy template for blending
console.log('Step 2: Using create_busy_template for preparation steps');
console.log('-'.repeat(70));

const blendTemplate = {
  templateType: 'busy',
  id: randomUUID(),
  intent: 'Add all ingredients to blender and blend until smooth',
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: 60000, // 1 minute
  references: [],
  willConsume: Object.fromEntries(
    RECIPE.ingredients.map(ing => [ing.name, ing.amount])
  ),
  willProduce: {
    berry_smoothie_servings: 1,
  },
};
templates.push(blendTemplate);
console.log(`  ✓ Created: "${blendTemplate.intent}" (60000ms)`);
console.log(`    Consumes: ${Object.keys(blendTemplate.willConsume).length} ingredients`);
console.log(`    Produces: berry_smoothie_servings: 1\n`);

// STEP 3: Add nutrition metadata to blend template
console.log('Step 3: Using add_nutrition_to_template (NEW!)');
console.log('-'.repeat(70));

blendTemplate.nutrition = {
  servings: RECIPE.servings,
  perServing: RECIPE.nutrition,
};

console.log(`  ✓ Added nutrition metadata to blend template`);
console.log(`    Servings: ${RECIPE.servings}`);
console.log(`    Per serving: ${RECIPE.nutrition.calories_kcal} kcal, ${RECIPE.nutrition.protein_g}g protein\n`);

// STEP 4: Create nutrition summary template
console.log('Step 4: Using create_nutrition_summary_template (NEW!)');
console.log('-'.repeat(70));

const nutritionSummary = {
  templateType: 'busy',
  id: randomUUID(),
  intent: 'Berry protein smoothie ready to drink with complete nutrition info',
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: 5000,
  references: [],
  willConsume: {
    berry_smoothie_servings: 1,
  },
  willProduce: {
    berry_smoothie_servings: 1,
    ...RECIPE.nutrition, // Nutrition as output variables!
  },
};
templates.push(nutritionSummary);

console.log(`  ✓ Created nutrition summary template`);
console.log(`    Consumes: berry_smoothie_servings: 1`);
console.log(`    Produces: berry_smoothie_servings + ${Object.keys(RECIPE.nutrition).length} nutrition variables`);
Object.entries(RECIPE.nutrition).forEach(([key, value]) => {
  console.log(`      - ${key}: ${value}`);
});
console.log();

// STEP 5: Create lane for gathering
console.log('Step 5: Using create_lane_template for organization');
console.log('-'.repeat(70));

const gatherLane = {
  templateType: 'lane',
  id: randomUUID(),
  intent: 'Gather all smoothie ingredients',
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: gatherTemplates.reduce((sum, t) => sum + t.estimatedDuration, 0),
  references: [],
  segments: gatherTemplates.map((t, i) => ({
    templateId: t.id,
    relationshipId: randomUUID(),
    offset: gatherTemplates.slice(0, i).reduce((sum, t) => sum + t.estimatedDuration, 0),
  })),
};
templates.push(gatherLane);

console.log(`  ✓ Created gather lane with ${gatherLane.segments.length} segments`);
console.log(`    Duration: ${gatherLane.estimatedDuration}ms\n`);

// STEP 6: Create main recipe lane
console.log('Step 6: Creating main recipe lane');
console.log('-'.repeat(70));

const mainLane = {
  templateType: 'lane',
  id: randomUUID(),
  intent: `${RECIPE.name} (${RECIPE.servings} serving)`,
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: gatherLane.estimatedDuration + blendTemplate.estimatedDuration + nutritionSummary.estimatedDuration,
  references: [],
  segments: [
    {
      templateId: gatherLane.id,
      relationshipId: randomUUID(),
      offset: 0,
    },
    {
      templateId: blendTemplate.id,
      relationshipId: randomUUID(),
      offset: gatherLane.estimatedDuration,
    },
    {
      templateId: nutritionSummary.id,
      relationshipId: randomUUID(),
      offset: gatherLane.estimatedDuration + blendTemplate.estimatedDuration,
    },
  ],
};
templates.push(mainLane);

console.log(`  ✓ Created main recipe lane`);
console.log(`    Total duration: ${Math.round(mainLane.estimatedDuration / 1000)} seconds\n`);

// STEP 7: Add recipe metadata
console.log('Step 7: Using add_recipe_metadata_to_lane (NEW!)');
console.log('-'.repeat(70));

mainLane.recipeMetadata = {
  sourceUrl: 'Common knowledge recipe',
  servings: RECIPE.servings,
  prepTime: RECIPE.totalTime,
  cookTime: 0,
  difficulty: 'easy',
  cuisine: 'American',
  tags: ['smoothie', 'breakfast', 'protein', 'healthy', 'quick'],
};

console.log(`  ✓ Added recipe metadata to main lane`);
console.log(`    Source: ${mainLane.recipeMetadata.sourceUrl}`);
console.log(`    Difficulty: ${mainLane.recipeMetadata.difficulty}`);
console.log(`    Tags: ${mainLane.recipeMetadata.tags.join(', ')}\n`);

// Add all templates to library
library.templates.push(...templates);
writeFileSync(TEMPLATES_PATH, JSON.stringify(library, null, 2));

console.log('='.repeat(70));
console.log('✅ WORKFLOW COMPLETE!');
console.log('='.repeat(70));
console.log(`\nGenerated ${templates.length} templates:`);
console.log(`  - ${gatherTemplates.length} ingredient gathering templates`);
console.log(`  - 1 blending template (with nutrition metadata)`);
console.log(`  - 1 nutrition summary template`);
console.log(`  - 2 lane templates\n`);

console.log('📋 RECIPE CONTRACT:');
console.log('-'.repeat(70));
console.log('\n📥 INPUTS (What you need):');
RECIPE.ingredients.forEach(ing => {
  console.log(`  - ${ing.name}: ${ing.amount}`);
});

console.log('\n📤 OUTPUTS (What you get):');
console.log(`  - berry_smoothie_servings: 1`);
Object.entries(RECIPE.nutrition).forEach(([key, value]) => {
  console.log(`  - ${key}: ${value}`);
});

console.log('\n📊 METADATA:');
console.log(`  - Servings: ${mainLane.recipeMetadata.servings}`);
console.log(`  - Time: ${Math.round(mainLane.estimatedDuration / 1000)} seconds`);
console.log(`  - Difficulty: ${mainLane.recipeMetadata.difficulty}`);
console.log(`  - Tags: ${mainLane.recipeMetadata.tags.join(', ')}`);

console.log('\n' + '='.repeat(70));
console.log('🎉 SUCCESS! The MCP tools now enable:');
console.log('='.repeat(70));
console.log('\n✓ Complete ingredient tracking (inputs)');
console.log('✓ Full nutrition output variables (outputs)');
console.log('✓ Recipe metadata (source, servings, tags)');
console.log('✓ Hierarchical lane organization');
console.log('✓ State flow validation');
console.log('\nAgents can now generate lanes that show:');
console.log('  INGREDIENTS → RECIPE STEPS → NUTRITION FACTS\n');

console.log(`Main lane ID: ${mainLane.id}`);
console.log(`Total templates in library: ${library.templates.length}\n`);
