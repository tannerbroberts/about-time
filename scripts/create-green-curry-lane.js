#!/usr/bin/env node
/**
 * Create Indian Green Curry lane from scratch using MCP tool patterns
 * Source: Common knowledge recipe
 *
 * Contract:
 * - Input: dollars_usd (~$20)
 * - Output: nutrition variables (calories, protein, carbs, fat, fiber, sodium)
 * - Internal: ingredients, prepped items, cooked curry, served meal
 */

import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATES_PATH = join(__dirname, '../src/data/templates.json');

console.log('🍛 CREATING INDIAN GREEN CURRY LANE');
console.log('='.repeat(70));
console.log();

const library = JSON.parse(readFileSync(TEMPLATES_PATH, 'utf8'));

// Recipe details
const RECIPE = {
  name: 'Indian Green Curry with Chicken and Rice',
  servings: 4,
  totalCost: 20.50,
  nutritionPerServing: {
    calories_kcal: 520,
    protein_g: 35,
    carbs_g: 48,
    fat_g: 20,
    fiber_g: 3,
    sodium_mg: 680,
  },
  ingredients: [
    { name: 'chicken_breast_lbs', amount: 1.5, cost: 8.00 },
    { name: 'green_curry_paste_tbsp', amount: 2, cost: 3.00 },
    { name: 'coconut_milk_cans', amount: 1, cost: 2.00 },
    { name: 'bell_pepper_count', amount: 1, cost: 1.50 },
    { name: 'onion_count', amount: 1, cost: 0.75 },
    { name: 'bamboo_shoots_cups', amount: 1, cost: 2.50 },
    { name: 'jasmine_rice_cups', amount: 2, cost: 1.00 },
    { name: 'garlic_cloves', amount: 3, cost: 0.50 },
    { name: 'ginger_tbsp', amount: 1, cost: 0.50 },
    { name: 'fish_sauce_tbsp', amount: 1, cost: 0.50 },
    { name: 'brown_sugar_tsp', amount: 1, cost: 0.10 },
    { name: 'vegetable_oil_tbsp', amount: 2, cost: 0.15 },
  ],
};

const templates = [];

// Helper to add back-references
function createLaneWithBacklinks(laneTemplate, childTemplates) {
  // Add back-references to children
  laneTemplate.segments.forEach(segment => {
    const child = childTemplates.find(t => t.id === segment.templateId);
    if (child) {
      child.references.push({
        parentId: laneTemplate.id,
        relationshipId: segment.relationshipId,
      });
    }
  });
  return laneTemplate;
}

console.log('Phase 1: SHOPPING');
console.log('-'.repeat(70));

// === SHOPPING PHASE ===

// Start with dollars (this makes dollars an input to the lane)
const startWithMoney = {
  templateType: 'busy',
  id: randomUUID(),
  intent: 'Prepare to go shopping with $20.50',
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: 60000, // 1 minute
  references: [],
  willConsume: {
    dollars_usd: 20.50, // CONSUME DOLLARS - makes it a lane input!
  },
  willProduce: {
    ready_to_shop_with_dollars_usd: 20.50,
  },
};
templates.push(startWithMoney);
console.log(`  ✓ ${startWithMoney.intent}`);

// Travel to store
const travelToStore = {
  templateType: 'busy',
  id: randomUUID(),
  intent: 'Travel to grocery store (30 minutes)',
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: 1800000, // 30 minutes
  references: [],
  willConsume: {
    ready_to_shop_with_dollars_usd: 20.50,
  },
  willProduce: {
    at_store_with_dollars_usd: 20.50,
  },
};
templates.push(travelToStore);
console.log(`  ✓ ${travelToStore.intent}`);

// Purchase all ingredients (single transaction)
const ingredientsPurchased = {};
RECIPE.ingredients.forEach(ing => {
  ingredientsPurchased[ing.name] = ing.amount;
});

const purchaseIngredients = {
  templateType: 'busy',
  id: randomUUID(),
  intent: `Purchase all curry ingredients ($${RECIPE.totalCost.toFixed(2)})`,
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: 1200000, // 20 minutes
  references: [],
  willConsume: {
    at_store_with_dollars_usd: RECIPE.totalCost,
  },
  willProduce: ingredientsPurchased,
};
templates.push(purchaseIngredients);
console.log(`  ✓ ${purchaseIngredients.intent}`);

// Travel home
const travelHome = {
  templateType: 'busy',
  id: randomUUID(),
  intent: 'Travel home from store (30 minutes)',
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: 1800000, // 30 minutes
  references: [],
  willConsume: ingredientsPurchased,
  willProduce: {
    ...ingredientsPurchased,
    at_home: 1,
  },
};
templates.push(travelHome);
console.log(`  ✓ ${travelHome.intent}\n`);

// Shopping lane
const shoppingLaneId = randomUUID();
const shoppingSegments = [
  { id: startWithMoney.id, relId: randomUUID(), offset: 0 },
  { id: travelToStore.id, relId: randomUUID(), offset: 60000 },
  { id: purchaseIngredients.id, relId: randomUUID(), offset: 1860000 },
  { id: travelHome.id, relId: randomUUID(), offset: 3060000 },
];

const shoppingLane = {
  templateType: 'lane',
  id: shoppingLaneId,
  intent: 'Shop for curry ingredients',
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: 4860000, // 81 minutes
  references: [],
  segments: shoppingSegments.map(s => ({
    templateId: s.id,
    relationshipId: s.relId,
    offset: s.offset,
  })),
};
createLaneWithBacklinks(shoppingLane, templates);
templates.push(shoppingLane);

console.log('Phase 2: PREPARATION');
console.log('-'.repeat(70));

// === PREP PHASE ===

const prepTemplates = [
  {
    intent: 'Dice chicken into bite-sized pieces',
    duration: 300000, // 5 min
    consume: { chicken_breast_lbs: 1.5 },
    produce: { diced_chicken_lbs: 1.5 },
  },
  {
    intent: 'Chop bell pepper into strips',
    duration: 180000, // 3 min
    consume: { bell_pepper_count: 1 },
    produce: { chopped_bell_pepper_cups: 1 },
  },
  {
    intent: 'Slice onion',
    duration: 180000, // 3 min
    consume: { onion_count: 1 },
    produce: { sliced_onion_cups: 0.75 },
  },
  {
    intent: 'Mince garlic and ginger',
    duration: 180000, // 3 min
    consume: { garlic_cloves: 3, ginger_tbsp: 1 },
    produce: { minced_aromatics_tbsp: 2 },
  },
  {
    intent: 'Rinse jasmine rice',
    duration: 120000, // 2 min
    consume: { jasmine_rice_cups: 2 },
    produce: { rinsed_rice_cups: 2 },
  },
  {
    intent: 'Measure and organize curry paste and coconut milk',
    duration: 120000, // 2 min
    consume: { green_curry_paste_tbsp: 2, coconut_milk_cans: 1 },
    produce: { curry_paste_ready_tbsp: 2, coconut_milk_ready_cups: 1.5 },
  },
];

const prepBusyTemplates = prepTemplates.map(t => {
  const template = {
    templateType: 'busy',
    id: randomUUID(),
    intent: t.intent,
    authorId: 'agent',
    version: '0.0.0',
    estimatedDuration: t.duration,
    references: [],
    willConsume: t.consume,
    willProduce: t.produce,
  };
  templates.push(template);
  console.log(`  ✓ ${template.intent}`);
  return template;
});

const prepLaneId = randomUUID();
let prepOffset = 0;
const prepSegments = prepBusyTemplates.map(t => {
  const seg = { id: t.id, relId: randomUUID(), offset: prepOffset };
  prepOffset += t.estimatedDuration;
  return seg;
});

const prepLane = {
  templateType: 'lane',
  id: prepLaneId,
  intent: 'Prepare all curry ingredients',
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: prepOffset,
  references: [],
  segments: prepSegments.map(s => ({
    templateId: s.id,
    relationshipId: s.relId,
    offset: s.offset,
  })),
};
createLaneWithBacklinks(prepLane, templates);
templates.push(prepLane);
console.log();

console.log('Phase 3: COOKING');
console.log('-'.repeat(70));

// === COOKING PHASE ===

const cookingTemplates = [
  {
    intent: 'Cook jasmine rice in rice cooker (20 minutes)',
    duration: 1200000, // 20 min
    consume: { rinsed_rice_cups: 2 },
    produce: { cooked_rice_servings: 4 },
  },
  {
    intent: 'Heat oil in large pan over medium-high heat',
    duration: 120000, // 2 min
    consume: { vegetable_oil_tbsp: 2 },
    produce: { hot_oil_in_pan: 1 },
  },
  {
    intent: 'Sauté aromatics until fragrant (2 minutes)',
    duration: 120000, // 2 min
    consume: { hot_oil_in_pan: 1, minced_aromatics_tbsp: 2 },
    produce: { aromatic_oil_in_pan: 1 },
  },
  {
    intent: 'Add curry paste and cook for 1 minute',
    duration: 60000, // 1 min
    consume: { aromatic_oil_in_pan: 1, curry_paste_ready_tbsp: 2 },
    produce: { curry_base_in_pan: 1 },
  },
  {
    intent: 'Add chicken and cook until no longer pink (5-7 minutes)',
    duration: 360000, // 6 min
    consume: { curry_base_in_pan: 1, diced_chicken_lbs: 1.5 },
    produce: { chicken_curry_in_pan: 1 },
  },
  {
    intent: 'Add coconut milk and bring to simmer',
    duration: 180000, // 3 min
    consume: { chicken_curry_in_pan: 1, coconut_milk_ready_cups: 1.5 },
    produce: { simmering_curry_in_pan: 1 },
  },
  {
    intent: 'Add vegetables, fish sauce, and sugar',
    duration: 120000, // 2 min
    consume: {
      simmering_curry_in_pan: 1,
      chopped_bell_pepper_cups: 1,
      sliced_onion_cups: 0.75,
      bamboo_shoots_cups: 1,
      fish_sauce_tbsp: 1,
      brown_sugar_tsp: 1,
    },
    produce: { curry_with_vegetables_in_pan: 1 },
  },
  {
    intent: 'Simmer curry for 10 minutes until vegetables tender',
    duration: 600000, // 10 min
    consume: { curry_with_vegetables_in_pan: 1 },
    produce: { finished_green_curry_servings: 4 },
  },
];

const cookingBusyTemplates = cookingTemplates.map(t => {
  const template = {
    templateType: 'busy',
    id: randomUUID(),
    intent: t.intent,
    authorId: 'agent',
    version: '0.0.0',
    estimatedDuration: t.duration,
    references: [],
    willConsume: t.consume,
    willProduce: t.produce,
  };
  templates.push(template);
  console.log(`  ✓ ${template.intent}`);
  return template;
});

const cookingLaneId = randomUUID();
let cookOffset = 0;
const cookSegments = cookingBusyTemplates.map(t => {
  const seg = { id: t.id, relId: randomUUID(), offset: cookOffset };
  cookOffset += t.estimatedDuration;
  return seg;
});

const cookingLane = {
  templateType: 'lane',
  id: cookingLaneId,
  intent: 'Cook green curry and rice',
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: cookOffset,
  references: [],
  segments: cookSegments.map(s => ({
    templateId: s.id,
    relationshipId: s.relId,
    offset: s.offset,
  })),
};
createLaneWithBacklinks(cookingLane, templates);
templates.push(cookingLane);
console.log();

console.log('Phase 4: SERVING & EATING');
console.log('-'.repeat(70));

// === SERVING ===

const servingTemplate = {
  templateType: 'busy',
  id: randomUUID(),
  intent: 'Plate curry over rice in 4 bowls',
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: 300000, // 5 min
  references: [],
  willConsume: {
    finished_green_curry_servings: 4,
    cooked_rice_servings: 4,
  },
  willProduce: {
    plated_curry_meals: 4,
  },
  nutrition: {
    servings: RECIPE.servings,
    perServing: RECIPE.nutritionPerServing,
  },
};
templates.push(servingTemplate);
console.log(`  ✓ ${servingTemplate.intent}`);

// === EATING ===

const totalNutrition = {};
Object.keys(RECIPE.nutritionPerServing).forEach(key => {
  totalNutrition[key] = RECIPE.nutritionPerServing[key] * RECIPE.servings;
});

const eatingTemplate = {
  templateType: 'busy',
  id: randomUUID(),
  intent: 'Eat green curry meal (20 minutes)',
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: 1200000, // 20 min
  references: [],
  willConsume: {
    plated_curry_meals: 4,
  },
  willProduce: {
    ...totalNutrition, // NUTRITION OUTPUTS!
    dirty_plates_count: 4,
    dirty_utensils_count: 4,
  },
};
templates.push(eatingTemplate);
console.log(`  ✓ ${eatingTemplate.intent}`);
console.log(`     Produces nutrition: ${Object.keys(totalNutrition).join(', ')}\n`);

console.log('Phase 5: CLEANUP');
console.log('-'.repeat(70));

// === CLEANUP ===

const cleanupTemplates = [
  {
    intent: 'Wash plates and utensils',
    duration: 300000, // 5 min
    consume: { dirty_plates_count: 4, dirty_utensils_count: 4 },
    produce: { clean_dishes_count: 8 },
  },
  {
    intent: 'Wash cooking pans and rice cooker',
    duration: 300000, // 5 min
    consume: {},
    produce: { clean_cookware_count: 2 },
  },
  {
    intent: 'Wipe down counters and stove',
    duration: 180000, // 3 min
    consume: {},
    produce: { clean_kitchen: 1 },
  },
  {
    intent: 'Take out trash',
    duration: 120000, // 2 min
    consume: {},
    produce: { trash_removed: 1 },
  },
];

const cleanupBusyTemplates = cleanupTemplates.map(t => {
  const template = {
    templateType: 'busy',
    id: randomUUID(),
    intent: t.intent,
    authorId: 'agent',
    version: '0.0.0',
    estimatedDuration: t.duration,
    references: [],
    willConsume: t.consume,
    willProduce: t.produce,
  };
  templates.push(template);
  console.log(`  ✓ ${template.intent}`);
  return template;
});

const cleanupLaneId = randomUUID();
let cleanupOffset = 0;
const cleanupSegments = cleanupBusyTemplates.map(t => {
  const seg = { id: t.id, relId: randomUUID(), offset: cleanupOffset };
  cleanupOffset += t.estimatedDuration;
  return seg;
});

const cleanupLane = {
  templateType: 'lane',
  id: cleanupLaneId,
  intent: 'Clean up kitchen after meal',
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: cleanupOffset,
  references: [],
  segments: cleanupSegments.map(s => ({
    templateId: s.id,
    relationshipId: s.relId,
    offset: s.offset,
  })),
};
createLaneWithBacklinks(cleanupLane, templates);
templates.push(cleanupLane);
console.log();

console.log('Phase 6: FINAL PASSTHROUGH (Keep only nutrition outputs)');
console.log('-'.repeat(70));

// === FINAL PASSTHROUGH ===
// Consume all the "cleanup" outputs and at_home, pass through only nutrition

const finalPassthrough = {
  templateType: 'busy',
  id: randomUUID(),
  intent: 'Meal complete - nutrition consumed',
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: 5000, // 5 seconds
  references: [],
  willConsume: {
    ...totalNutrition, // Consume nutrition to pass it through
    clean_dishes_count: 8,
    clean_cookware_count: 2,
    clean_kitchen: 1,
    trash_removed: 1,
    at_home: 1,
  },
  willProduce: {
    ...totalNutrition, // Pass through only nutrition
  },
};
templates.push(finalPassthrough);
console.log(`  ✓ ${finalPassthrough.intent}`);
console.log(`     Passes through: ${Object.keys(totalNutrition).join(', ')}\n`);

// === MAIN LANE ===

console.log('Phase 7: ASSEMBLING MAIN LANE');
console.log('-'.repeat(70));

const mainLaneId = randomUUID();
const mainSegments = [
  { lane: shoppingLane, offset: 0 },
  { lane: prepLane, offset: shoppingLane.estimatedDuration },
  { lane: cookingLane, offset: shoppingLane.estimatedDuration + prepLane.estimatedDuration },
  { template: servingTemplate, offset: shoppingLane.estimatedDuration + prepLane.estimatedDuration + cookingLane.estimatedDuration },
  { template: eatingTemplate, offset: shoppingLane.estimatedDuration + prepLane.estimatedDuration + cookingLane.estimatedDuration + servingTemplate.estimatedDuration },
  { lane: cleanupLane, offset: shoppingLane.estimatedDuration + prepLane.estimatedDuration + cookingLane.estimatedDuration + servingTemplate.estimatedDuration + eatingTemplate.estimatedDuration },
  { template: finalPassthrough, offset: shoppingLane.estimatedDuration + prepLane.estimatedDuration + cookingLane.estimatedDuration + servingTemplate.estimatedDuration + eatingTemplate.estimatedDuration + cleanupLane.estimatedDuration },
];

const totalDuration = mainSegments[mainSegments.length - 1].offset +
  (mainSegments[mainSegments.length - 1].lane || mainSegments[mainSegments.length - 1].template).estimatedDuration;

const mainLane = {
  templateType: 'lane',
  id: mainLaneId,
  intent: `${RECIPE.name} - Complete meal preparation`,
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: totalDuration,
  references: [],
  segments: mainSegments.map(s => ({
    templateId: (s.lane || s.template).id,
    relationshipId: randomUUID(),
    offset: s.offset,
  })),
  recipeMetadata: {
    sourceUrl: 'Common knowledge - Indian/Thai fusion green curry',
    servings: RECIPE.servings,
    prepTime: prepLane.estimatedDuration,
    cookTime: cookingLane.estimatedDuration,
    difficulty: 'medium',
    cuisine: 'Indian',
    tags: ['curry', 'chicken', 'indian', 'coconut', 'rice', 'dinner'],
  },
};

createLaneWithBacklinks(mainLane, [shoppingLane, prepLane, cookingLane, servingTemplate, eatingTemplate, cleanupLane, finalPassthrough]);
templates.push(mainLane);

console.log(`  ✓ Created main lane: ${mainLane.intent}`);
console.log(`  ✓ Total duration: ${Math.round(totalDuration / 60000)} minutes`);
console.log(`  ✓ Segments: ${mainLane.segments.length}`);
console.log();

// Add all templates to library
library.templates.push(...templates);
writeFileSync(TEMPLATES_PATH, JSON.stringify(library, null, 2));

console.log('='.repeat(70));
console.log('✅ GREEN CURRY LANE COMPLETE!');
console.log('='.repeat(70));
console.log(`\nGenerated ${templates.length} templates:`);
console.log(`  - ${templates.filter(t => t.templateType === 'busy').length} busy templates`);
console.log(`  - ${templates.filter(t => t.templateType === 'lane').length} lane templates`);
console.log();
console.log('📋 CONTRACT SIGNATURE:');
console.log('-'.repeat(70));
console.log('  📥 INPUT:');
console.log(`     - dollars_usd: $${RECIPE.totalCost.toFixed(2)}`);
console.log();
console.log('  📤 OUTPUTS:');
Object.entries(totalNutrition).forEach(([key, value]) => {
  console.log(`     - ${key}: ${value} (for ${RECIPE.servings} servings)`);
});
console.log();
console.log('  🔄 INTERNAL VARIABLES:');
console.log('     - Ingredients (purchased with dollars)');
console.log('     - Prepped ingredients (chopped, diced, rinsed)');
console.log('     - Cooked curry and rice');
console.log('     - Plated meals (consumed during eating)');
console.log('     - Dirty dishes (consumed during cleanup)');
console.log();
console.log(`📊 Main Lane ID: ${mainLane.id}`);
console.log(`⏱️  Total Time: ${Math.round(totalDuration / 60000)} minutes (~${(totalDuration / 3600000).toFixed(1)} hours)`);
console.log(`💰 Total Cost: $${RECIPE.totalCost.toFixed(2)}`);
console.log();
