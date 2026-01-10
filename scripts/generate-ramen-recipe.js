#!/usr/bin/env node
/**
 * Script to generate a ramen recipe lane
 * Source: https://www.justonecookbook.com/homemade-chashu-miso-ramen/
 *
 * This script demonstrates the current capabilities and limitations
 * of the MCP tool system for recipe generation.
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

// Recipe metadata
const RECIPE_SOURCE = 'https://www.justonecookbook.com/homemade-chashu-miso-ramen/';
const RECIPE_NAME = 'Homemade Miso Ramen';
const SERVINGS = 2;

// Nutrition per serving (from source)
const NUTRITION_PER_SERVING = {
  calories: 433,
  carbs_g: 37,
  protein_g: 19,
  fat_g: 25,
  sodium_mg: 1216,
};

console.log(`Generating recipe: ${RECIPE_NAME}`);
console.log(`Source: ${RECIPE_SOURCE}`);
console.log(`Servings: ${SERVINGS}\n`);

// ============================================================================
// PHASE 1: GATHER INGREDIENTS
// ============================================================================

const gatherTemplates = [
  {
    intent: 'Gather garlic cloves from pantry',
    duration: 10000,
    produce: { garlic_cloves: 2 },
  },
  {
    intent: 'Gather fresh ginger from fridge',
    duration: 10000,
    produce: { ginger_tsp: 0.5 },
  },
  {
    intent: 'Gather shallot from pantry',
    duration: 10000,
    produce: { shallot_count: 1 },
  },
  {
    intent: 'Gather toasted sesame seeds from pantry',
    duration: 10000,
    produce: { sesame_seeds_tbsp: 1 },
  },
  {
    intent: 'Get sesame oil from pantry',
    duration: 10000,
    produce: { sesame_oil_tbsp: 1 },
  },
  {
    intent: 'Get ground pork from fridge',
    duration: 15000,
    produce: { ground_pork_lb: 0.25 },
  },
  {
    intent: 'Get doubanjiang (spicy chili bean paste) from pantry',
    duration: 10000,
    produce: { doubanjiang_tsp: 1 },
  },
  {
    intent: 'Get miso paste from fridge',
    duration: 10000,
    produce: { miso_tbsp: 3 },
  },
  {
    intent: 'Gather sugar from pantry',
    duration: 10000,
    produce: { sugar_tbsp: 1 },
  },
  {
    intent: 'Get sake from pantry',
    duration: 10000,
    produce: { sake_tbsp: 1 },
  },
  {
    intent: 'Get chicken stock from fridge',
    duration: 15000,
    produce: { chicken_stock_cups: 4 },
  },
  {
    intent: 'Get kosher salt from pantry',
    duration: 10000,
    produce: { salt_tsp: 1 },
  },
  {
    intent: 'Get white pepper from pantry',
    duration: 10000,
    produce: { white_pepper_tsp: 0.25 },
  },
  {
    intent: 'Get fresh ramen noodles from pantry',
    duration: 15000,
    produce: { ramen_noodles_servings: 2 },
  },
];

const gatherBusyTemplates = gatherTemplates.map(t => ({
  templateType: 'busy',
  id: randomUUID(),
  intent: t.intent,
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: t.duration,
  references: [],
  willConsume: {},
  willProduce: t.produce,
}));

// ============================================================================
// PHASE 2: PREP WORK
// ============================================================================

const prepTemplates = [
  {
    intent: 'Mince 2 garlic cloves',
    duration: 45000,
    consume: { garlic_cloves: 2 },
    produce: { minced_garlic_batch: 1 },
  },
  {
    intent: 'Grate fresh ginger',
    duration: 30000,
    consume: { ginger_tsp: 0.5 },
    produce: { grated_ginger_batch: 1 },
  },
  {
    intent: 'Mince shallot',
    duration: 45000,
    consume: { shallot_count: 1 },
    produce: { minced_shallot_batch: 1 },
  },
];

const prepBusyTemplates = prepTemplates.map(t => ({
  templateType: 'busy',
  id: randomUUID(),
  intent: t.intent,
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: t.duration,
  references: [],
  willConsume: t.consume,
  willProduce: t.produce,
}));

// ============================================================================
// PHASE 3: COOKING
// ============================================================================

const cookingTemplates = [
  {
    intent: 'Heat sesame oil in large pot over medium heat',
    duration: 60000,
    consume: { sesame_oil_tbsp: 1 },
    produce: { hot_oil_in_pot: 1 },
  },
  {
    intent: 'Sauté garlic, ginger, and shallot until fragrant (1-2 min)',
    duration: 90000,
    consume: {
      hot_oil_in_pot: 1,
      minced_garlic_batch: 1,
      grated_ginger_batch: 1,
      minced_shallot_batch: 1,
      sesame_seeds_tbsp: 1,
    },
    produce: { aromatic_base_in_pot: 1 },
  },
  {
    intent: 'Add ground pork and cook until browned (3-4 min)',
    duration: 210000,
    consume: {
      aromatic_base_in_pot: 1,
      ground_pork_lb: 0.25,
    },
    produce: { pork_aromatic_mix_in_pot: 1 },
  },
  {
    intent: 'Add doubanjiang and miso, stir to combine',
    duration: 30000,
    consume: {
      pork_aromatic_mix_in_pot: 1,
      doubanjiang_tsp: 1,
      miso_tbsp: 3,
    },
    produce: { flavored_pork_base_in_pot: 1 },
  },
  {
    intent: 'Add sugar and sake, stir well',
    duration: 20000,
    consume: {
      flavored_pork_base_in_pot: 1,
      sugar_tbsp: 1,
      sake_tbsp: 1,
    },
    produce: { seasoned_pork_base_in_pot: 1 },
  },
  {
    intent: 'Pour in chicken stock and bring to simmer',
    duration: 180000,
    consume: {
      seasoned_pork_base_in_pot: 1,
      chicken_stock_cups: 4,
    },
    produce: { simmering_broth_in_pot: 1 },
  },
  {
    intent: 'Season broth with salt and white pepper to taste',
    duration: 30000,
    consume: {
      simmering_broth_in_pot: 1,
      salt_tsp: 1,
      white_pepper_tsp: 0.25,
    },
    produce: { finished_ramen_broth_in_pot: 1 },
  },
  {
    intent: 'Boil water in separate pot for noodles',
    duration: 300000,
    consume: {},
    produce: { boiling_water_pot: 1 },
  },
  {
    intent: 'Cook ramen noodles until al dente (15 sec less than package)',
    duration: 120000,
    consume: {
      boiling_water_pot: 1,
      ramen_noodles_servings: 2,
    },
    produce: { cooked_noodles_batch: 1 },
  },
  {
    intent: 'Drain noodles thoroughly',
    duration: 30000,
    consume: { cooked_noodles_batch: 1 },
    produce: { drained_noodles_servings: 2 },
  },
];

const cookingBusyTemplates = cookingTemplates.map(t => ({
  templateType: 'busy',
  id: randomUUID(),
  intent: t.intent,
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: t.duration,
  references: [],
  willConsume: t.consume,
  willProduce: t.produce,
}));

// ============================================================================
// PHASE 4: ASSEMBLY
// ============================================================================

// NOTE: Here's where we hit a major limitation!
// We have nutritional data but NO WAY to attach it to the template
// The finished dish should produce nutrition outputs, but there's no
// mechanism to connect the nutrition facts to the recipe

const assemblyTemplate = {
  templateType: 'busy',
  id: randomUUID(),
  intent: 'Divide noodles between 2 bowls and ladle hot broth over top',
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: 60000,
  references: [],
  willConsume: {
    drained_noodles_servings: 2,
    finished_ramen_broth_in_pot: 1,
  },
  willProduce: {
    // PROBLEM #1: No way to represent nutrition outputs!
    // We want to produce: calories_kcal, carbs_g, protein_g, fat_g, sodium_mg
    // But these aren't "physical" resources like ingredients

    // PROBLEM #2: No way to attach metadata like source URL
    // Should track: recipe_source, servings, prep_time, cook_time

    // Current workaround: just output the finished dish
    miso_ramen_bowls: 2,
  },
};

// ============================================================================
// CREATE LANE STRUCTURE
// ============================================================================

const allBusyTemplates = [
  ...gatherBusyTemplates,
  ...prepBusyTemplates,
  ...cookingBusyTemplates,
  assemblyTemplate,
];

// Create sub-lanes for organization
const gatherLane = {
  templateType: 'lane',
  id: randomUUID(),
  intent: 'Gather all ramen ingredients',
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: gatherBusyTemplates.reduce((sum, t) => sum + t.estimatedDuration, 0),
  references: [],
  segments: gatherBusyTemplates.map((t, i) => ({
    templateId: t.id,
    relationshipId: randomUUID(),
    offset: gatherBusyTemplates.slice(0, i).reduce((sum, t) => sum + t.estimatedDuration, 0),
  })),
};

const prepLane = {
  templateType: 'lane',
  id: randomUUID(),
  intent: 'Prep aromatics for ramen',
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: prepBusyTemplates.reduce((sum, t) => sum + t.estimatedDuration, 0),
  references: [],
  segments: prepBusyTemplates.map((t, i) => ({
    templateId: t.id,
    relationshipId: randomUUID(),
    offset: prepBusyTemplates.slice(0, i).reduce((sum, t) => sum + t.estimatedDuration, 0),
  })),
};

const cookingLane = {
  templateType: 'lane',
  id: randomUUID(),
  intent: 'Cook ramen broth and noodles',
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: cookingBusyTemplates.reduce((sum, t) => sum + t.estimatedDuration, 0),
  references: [],
  segments: cookingBusyTemplates.map((t, i) => ({
    templateId: t.id,
    relationshipId: randomUUID(),
    offset: cookingBusyTemplates.slice(0, i).reduce((sum, t) => sum + t.estimatedDuration, 0),
  })),
};

// Main recipe lane
const mainRecipeLane = {
  templateType: 'lane',
  id: randomUUID(),
  intent: `${RECIPE_NAME} (${SERVINGS} servings) - Source: ${RECIPE_SOURCE}`,
  authorId: 'agent',
  version: '0.0.0',
  estimatedDuration: gatherLane.estimatedDuration + prepLane.estimatedDuration +
                      cookingLane.estimatedDuration + assemblyTemplate.estimatedDuration,
  references: [],
  segments: [
    {
      templateId: gatherLane.id,
      relationshipId: randomUUID(),
      offset: 0,
    },
    {
      templateId: prepLane.id,
      relationshipId: randomUUID(),
      offset: gatherLane.estimatedDuration,
    },
    {
      templateId: cookingLane.id,
      relationshipId: randomUUID(),
      offset: gatherLane.estimatedDuration + prepLane.estimatedDuration,
    },
    {
      templateId: assemblyTemplate.id,
      relationshipId: randomUUID(),
      offset: gatherLane.estimatedDuration + prepLane.estimatedDuration + cookingLane.estimatedDuration,
    },
  ],
};

// ============================================================================
// ADD TO LIBRARY
// ============================================================================

const newTemplates = [
  ...allBusyTemplates,
  gatherLane,
  prepLane,
  cookingLane,
  mainRecipeLane,
];

library.templates.push(...newTemplates);

writeFileSync(TEMPLATES_PATH, JSON.stringify(library, null, 2));

console.log(`✅ Generated ${newTemplates.length} templates`);
console.log(`   - ${allBusyTemplates.length} busy templates`);
console.log(`   - 4 lane templates`);
console.log(`\n📊 Main recipe lane ID: ${mainRecipeLane.id}`);
console.log(`⏱️  Total estimated time: ${Math.round(mainRecipeLane.estimatedDuration / 1000 / 60)} minutes`);

console.log(`\n❌ IDENTIFIED LIMITATIONS:`);
console.log(`   1. No way to attach nutrition data (calories, macros) to templates`);
console.log(`   2. No way to output nutrition variables (protein_g, carbs_g, etc.)`);
console.log(`   3. No recipe metadata fields (source URL, servings, tags)`);
console.log(`   4. No way to scale recipes based on servings`);
console.log(`   5. No aggregation of nutrition across nested lanes`);
console.log(`\n💡 Nutrition data for this recipe (per serving):`);
console.log(`   - Calories: ${NUTRITION_PER_SERVING.calories} kcal`);
console.log(`   - Carbs: ${NUTRITION_PER_SERVING.carbs_g}g`);
console.log(`   - Protein: ${NUTRITION_PER_SERVING.protein_g}g`);
console.log(`   - Fat: ${NUTRITION_PER_SERVING.fat_g}g`);
console.log(`   - Sodium: ${NUTRITION_PER_SERVING.sodium_mg}mg`);
console.log(`\n   ⚠️  This data is currently lost - not stored anywhere in the templates!`);
