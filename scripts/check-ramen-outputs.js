#!/usr/bin/env node
/**
 * Check the actual output variables from the ramen recipe
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATES_PATH = join(__dirname, '../src/data/templates.json');
const library = JSON.parse(readFileSync(TEMPLATES_PATH, 'utf8'));

console.log('🍜 RAMEN RECIPE OUTPUTS');
console.log('='.repeat(70));

// Find ramen lane
const ramenLane = library.templates.find(t =>
  t.templateType === 'lane' && t.intent.includes('Homemade Miso Ramen')
);

console.log('Lane ID:', ramenLane.id);
console.log('Intent:', ramenLane.intent);
console.log('Segments:', ramenLane.segments.length);
console.log('');

// Find the last segment (should be nutrition summary if we added it)
const lastSegment = ramenLane.segments[ramenLane.segments.length - 1];
const lastTemplate = library.templates.find(t => t.id === lastSegment.templateId);

console.log('📋 Last Segment in Lane:');
console.log('-'.repeat(70));
console.log('Template ID:', lastTemplate.id);
console.log('Intent:', lastTemplate.intent);
console.log('Type:', lastTemplate.templateType);
console.log('');

if (lastTemplate.templateType === 'busy') {
  console.log('📤 willProduce (Output Variables):');
  console.log('-'.repeat(70));

  const outputs = lastTemplate.willProduce;

  // Separate food from nutrition
  const foodOutputs = {};
  const nutritionOutputs = {};

  Object.entries(outputs).forEach(([key, value]) => {
    if (key.includes('calories') || key.includes('protein') || key.includes('carbs') ||
        key.includes('fat') || key.includes('sodium') || key.includes('fiber') ||
        key.includes('sugar') || key.includes('vitamin') || key.includes('calcium') ||
        key.includes('potassium') || key.includes('iron')) {
      nutritionOutputs[key] = value;
    } else {
      foodOutputs[key] = value;
    }
  });

  console.log('\n🍲 Food Outputs:');
  Object.entries(foodOutputs).forEach(([key, value]) => {
    console.log(`  - ${key}: ${value}`);
  });

  console.log('\n💊 Nutrition Outputs:');
  if (Object.keys(nutritionOutputs).length > 0) {
    Object.entries(nutritionOutputs).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });
    console.log(`\n✅ SUCCESS: Ramen recipe has ${Object.keys(nutritionOutputs).length} nutrition outputs!`);

    // Show per-serving breakdown
    console.log('\n📊 Per Serving (recipe makes 2 servings):');
    Object.entries(nutritionOutputs).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value / 2}`);
    });
  } else {
    console.log('  ❌ NO NUTRITION OUTPUTS FOUND');
    console.log('\n  This means the nutrition summary template was not added to the lane.');
  }
}

// Check metadata
console.log('\n📋 Recipe Metadata:');
console.log('-'.repeat(70));
if (ramenLane.recipeMetadata) {
  console.log('  ✓ Source:', ramenLane.recipeMetadata.sourceUrl);
  console.log('  ✓ Servings:', ramenLane.recipeMetadata.servings);
  console.log('  ✓ Difficulty:', ramenLane.recipeMetadata.difficulty);
  console.log('  ✓ Cuisine:', ramenLane.recipeMetadata.cuisine);
  console.log('  ✓ Tags:', ramenLane.recipeMetadata.tags.join(', '));
} else {
  console.log('  (no metadata added yet)');
}

// Check if blend template has nutrition metadata
console.log('\n💊 Nutrition Metadata on Templates:');
console.log('-'.repeat(70));
const templatesWithNutrition = library.templates.filter(t =>
  t.templateType === 'busy' && t.nutrition &&
  (t.intent.includes('ramen') || t.intent.includes('noodles'))
);

if (templatesWithNutrition.length > 0) {
  console.log(`  ✓ Found ${templatesWithNutrition.length} template(s) with nutrition metadata:`);
  templatesWithNutrition.forEach(t => {
    console.log(`    - "${t.intent}"`);
    console.log(`      Servings: ${t.nutrition.servings}`);
    if (t.nutrition.perServing) {
      console.log(`      Calories: ${t.nutrition.perServing.calories_kcal} kcal`);
      console.log(`      Protein: ${t.nutrition.perServing.protein_g}g`);
    }
  });
} else {
  console.log('  (no templates have nutrition metadata)');
}
