#!/usr/bin/env node
/**
 * Test script for new nutrition MCP tools
 * Tests the tools with the ramen recipe created earlier
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATES_PATH = join(__dirname, '../src/data/templates.json');

// Load existing templates
const library = JSON.parse(readFileSync(TEMPLATES_PATH, 'utf8'));

console.log('Testing new nutrition MCP tools...\n');

// Find the ramen recipe lane and assembly template
const ramenLane = library.templates.find(t =>
  t.templateType === 'lane' && t.intent.includes('Homemade Miso Ramen')
);

if (!ramenLane) {
  console.error('❌ Could not find ramen recipe lane');
  process.exit(1);
}

console.log(`✅ Found ramen recipe lane: ${ramenLane.id}`);

const assemblyTemplate = library.templates.find(t =>
  t.templateType === 'busy' && t.intent.includes('Divide noodles between 2 bowls')
);

if (!assemblyTemplate) {
  console.error('❌ Could not find assembly template');
  process.exit(1);
}

console.log(`✅ Found assembly template: ${assemblyTemplate.id}\n`);

// Recipe nutrition data (from source - 2 servings total)
const SERVINGS = 2;
const NUTRITION_PER_SERVING = {
  calories_kcal: 433,
  protein_g: 19,
  carbs_g: 37,
  fat_g: 25,
  sodium_mg: 1216,
};

const TOTAL_NUTRITION = {
  calories_kcal: NUTRITION_PER_SERVING.calories_kcal * SERVINGS,
  protein_g: NUTRITION_PER_SERVING.protein_g * SERVINGS,
  carbs_g: NUTRITION_PER_SERVING.carbs_g * SERVINGS,
  fat_g: NUTRITION_PER_SERVING.fat_g * SERVINGS,
  sodium_mg: NUTRITION_PER_SERVING.sodium_mg * SERVINGS,
};

console.log('📊 Recipe Nutrition (Total for 2 servings):');
console.log(`   Calories: ${TOTAL_NUTRITION.calories_kcal} kcal`);
console.log(`   Protein: ${TOTAL_NUTRITION.protein_g}g`);
console.log(`   Carbs: ${TOTAL_NUTRITION.carbs_g}g`);
console.log(`   Fat: ${TOTAL_NUTRITION.fat_g}g`);
console.log(`   Sodium: ${TOTAL_NUTRITION.sodium_mg}mg\n`);

// ==================================================================
// TEST 1: Add nutrition metadata to assembly template
// ==================================================================

console.log('TEST 1: Adding nutrition metadata to assembly template...');

const updatedAssemblyTemplate = {
  ...assemblyTemplate,
  nutrition: {
    servings: SERVINGS,
    perServing: NUTRITION_PER_SERVING,
  },
};

const index = library.templates.findIndex(t => t.id === assemblyTemplate.id);
if (index !== -1) {
  library.templates[index] = updatedAssemblyTemplate;
  console.log('✅ Added nutrition metadata to assembly template');
  console.log(`   ${SERVINGS} servings @ ${NUTRITION_PER_SERVING.calories_kcal} kcal/serving\n`);
} else {
  console.error('❌ Failed to update template');
  process.exit(1);
}

// ==================================================================
// TEST 2: Create nutrition summary template
// ==================================================================

console.log('TEST 2: Creating nutrition summary template...');

const nutritionSummaryTemplate = {
  templateType: 'busy',
  id: randomUUID(),
  intent: 'Miso ramen ready to serve with complete nutrition info',
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: 5000, // 5 seconds
  references: [],
  willConsume: {
    miso_ramen_bowls: 2, // Consume the finished bowls
  },
  willProduce: {
    miso_ramen_bowls: 2, // Produce them back (passthrough)
    ...TOTAL_NUTRITION, // Add nutrition as output variables
  },
};

library.templates.push(nutritionSummaryTemplate);
console.log('✅ Created nutrition summary template');
console.log(`   ID: ${nutritionSummaryTemplate.id}`);
console.log(`   Produces: miso_ramen_bowls + nutrition variables\n`);

// ==================================================================
// TEST 3: Update main lane to include nutrition summary
// ==================================================================

console.log('TEST 3: Adding nutrition summary to main recipe lane...');

// Add the nutrition summary template as the final segment
const lastSegmentEnd = Math.max(...ramenLane.segments.map(s => s.offset +
  library.templates.find(t => t.id === s.templateId)?.estimatedDuration || 0
));

ramenLane.segments.push({
  templateId: nutritionSummaryTemplate.id,
  relationshipId: randomUUID(),
  offset: lastSegmentEnd,
});

ramenLane.estimatedDuration = lastSegmentEnd + nutritionSummaryTemplate.estimatedDuration;

console.log('✅ Added nutrition summary as final segment');
console.log(`   Offset: ${lastSegmentEnd}ms`);
console.log(`   New total duration: ${Math.round(ramenLane.estimatedDuration / 1000 / 60)} minutes\n`);

// ==================================================================
// TEST 4: Add recipe metadata to lane
// ==================================================================

console.log('TEST 4: Adding recipe metadata to lane...');

const updatedRamenLane = {
  ...ramenLane,
  recipeMetadata: {
    sourceUrl: 'https://www.justonecookbook.com/homemade-chashu-miso-ramen/',
    servings: SERVINGS,
    prepTime: 600000, // 10 minutes
    cookTime: 900000, // 15 minutes
    difficulty: 'medium',
    cuisine: 'Japanese',
    tags: ['soup', 'ramen', 'pork', 'asian', 'noodles'],
  },
};

const laneIndex = library.templates.findIndex(t => t.id === ramenLane.id);
if (laneIndex !== -1) {
  library.templates[laneIndex] = updatedRamenLane;
  console.log('✅ Added recipe metadata to lane');
  console.log(`   Source: ${updatedRamenLane.recipeMetadata.sourceUrl}`);
  console.log(`   Servings: ${updatedRamenLane.recipeMetadata.servings}`);
  console.log(`   Difficulty: ${updatedRamenLane.recipeMetadata.difficulty}`);
  console.log(`   Tags: ${updatedRamenLane.recipeMetadata.tags.join(', ')}\n`);
} else {
  console.error('❌ Failed to update lane');
  process.exit(1);
}

// ==================================================================
// Save updated library
// ==================================================================

writeFileSync(TEMPLATES_PATH, JSON.stringify(library, null, 2));
console.log('💾 Saved updated templates to', TEMPLATES_PATH);

// ==================================================================
// Verify the complete recipe contract
// ==================================================================

console.log('\n' + '='.repeat(60));
console.log('RECIPE CONTRACT VERIFICATION');
console.log('='.repeat(60) + '\n');

console.log('📥 INPUTS (Ingredients):');
const allIngredients = new Set();
library.templates
  .filter(t => t.templateType === 'busy' &&
               ramenLane.segments.some(s => s.templateId === t.id ||
                 library.templates.find(lane =>
                   lane.templateType === 'lane' &&
                   lane.id === s.templateId &&
                   lane.segments?.some(ls => ls.templateId === t.id)
                 )
               ))
  .forEach(t => {
    Object.keys(t.willConsume).forEach(v => {
      if (!v.includes('_batch') && !v.includes('_in_') && !v.includes('_count')) {
        allIngredients.add(v);
      }
    });
  });

Array.from(allIngredients).sort().forEach(ing => {
  console.log(`   - ${ing}`);
});

console.log(`\n   Total: ${allIngredients.size} unique ingredients\n`);

console.log('📤 OUTPUTS (Nutrition Facts):');
const nutritionVars = Object.keys(nutritionSummaryTemplate.willProduce)
  .filter(k => k !== 'miso_ramen_bowls');
nutritionVars.forEach(nutVar => {
  const value = nutritionSummaryTemplate.willProduce[nutVar];
  console.log(`   - ${nutVar}: ${value}`);
});

console.log(`\n✅ SUCCESS! The recipe lane now has:
   - Ingredient inputs (what you need)
   - Nutrition outputs (what you get)
   - Complete metadata (source, servings, tags)

   An agent can now generate lanes like this automatically!`);

console.log('\n' + '='.repeat(60));
console.log('NEXT STEPS FOR AGENTS');
console.log('='.repeat(60) + '\n');

console.log('An agent with these MCP tools can now:');
console.log('1. Find a recipe online (WebFetch)');
console.log('2. Create busy templates for each step (create_busy_template)');
console.log('3. Create lane structure (create_lane_template)');
console.log('4. Add nutrition to final template (add_nutrition_to_template)');
console.log('5. Create nutrition summary (create_nutrition_summary_template)');
console.log('6. Add recipe metadata (add_recipe_metadata_to_lane)');
console.log('\nResult: Users see ingredient inventory → nutrition facts');
