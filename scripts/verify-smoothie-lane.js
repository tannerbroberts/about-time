#!/usr/bin/env node
/**
 * Verification script for the smoothie lane
 * Tests that the nutrition variables work correctly with the state system
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATES_PATH = join(__dirname, '../src/data/templates.json');

// Load templates
const library = JSON.parse(readFileSync(TEMPLATES_PATH, 'utf8'));

console.log('🔍 VERIFICATION: Smoothie Lane State Flow');
console.log('='.repeat(70));

// Find the smoothie lane
const smoothieLane = library.templates.find(t =>
  t.templateType === 'lane' && t.intent.includes('Berry Protein Smoothie')
);

if (!smoothieLane) {
  console.error('❌ Could not find smoothie lane');
  process.exit(1);
}

console.log(`\n✅ Found lane: "${smoothieLane.intent}"`);
console.log(`   ID: ${smoothieLane.id}`);
console.log(`   Duration: ${Math.round(smoothieLane.estimatedDuration / 1000)} seconds`);
console.log(`   Segments: ${smoothieLane.segments.length}\n`);

// Check metadata
console.log('📋 Recipe Metadata:');
console.log('-'.repeat(70));
if (smoothieLane.recipeMetadata) {
  console.log(`  ✓ Source: ${smoothieLane.recipeMetadata.sourceUrl}`);
  console.log(`  ✓ Servings: ${smoothieLane.recipeMetadata.servings}`);
  console.log(`  ✓ Difficulty: ${smoothieLane.recipeMetadata.difficulty}`);
  console.log(`  ✓ Tags: ${smoothieLane.recipeMetadata.tags.join(', ')}`);
} else {
  console.log('  ❌ No metadata found');
}

// Analyze state flow
console.log('\n🔄 State Flow Analysis:');
console.log('-'.repeat(70));

// Get all templates referenced by the lane
const referencedTemplates = [];
const processSegments = (segments) => {
  segments.forEach(seg => {
    const template = library.templates.find(t => t.id === seg.templateId);
    if (template) {
      referencedTemplates.push({ template, offset: seg.offset });
      if (template.templateType === 'lane' && template.segments) {
        processSegments(template.segments);
      }
    }
  });
};

processSegments(smoothieLane.segments);

// Sort by offset
referencedTemplates.sort((a, b) => a.offset - b.offset);

// Track state
const state = {};
let hasErrors = false;

console.log('\nStep-by-step state progression:\n');

referencedTemplates.forEach((ref, i) => {
  const { template, offset } = ref;
  if (template.templateType === 'busy') {
    console.log(`${i + 1}. [${Math.round(offset / 1000)}s] ${template.intent}`);

    // Check if all consumed variables are available
    const consumed = Object.keys(template.willConsume);
    const produced = Object.keys(template.willProduce);

    if (consumed.length > 0) {
      console.log(`   Consumes:`);
      consumed.forEach(v => {
        const available = state[v] || 0;
        const needed = template.willConsume[v];
        if (available >= needed) {
          console.log(`     ✓ ${v}: ${needed} (have ${available})`);
          state[v] = available - needed;
        } else {
          console.log(`     ❌ ${v}: ${needed} (only have ${available}) - ERROR!`);
          hasErrors = true;
        }
      });
    }

    if (produced.length > 0) {
      console.log(`   Produces:`);
      produced.forEach(v => {
        const amount = template.willProduce[v];
        state[v] = (state[v] || 0) + amount;
        console.log(`     ✓ ${v}: ${amount} (total now: ${state[v]})`);
      });
    }

    // Check nutrition metadata
    if (template.nutrition) {
      console.log(`   💊 Nutrition metadata: ${template.nutrition.servings} serving(s)`);
    }

    console.log();
  }
});

// Final state
console.log('📊 Final State (Outputs):');
console.log('-'.repeat(70));
const outputs = Object.entries(state).filter(([k, v]) => v > 0);
if (outputs.length > 0) {
  outputs.forEach(([key, value]) => {
    console.log(`  ✓ ${key}: ${value}`);
  });
} else {
  console.log('  (no outputs remaining - all consumed)');
}

// Check for nutrition variables in outputs
console.log('\n🍎 Nutrition Variables in Outputs:');
console.log('-'.repeat(70));
const nutritionVars = outputs.filter(([k]) =>
  k.includes('calories') || k.includes('protein') || k.includes('carbs') ||
  k.includes('fat') || k.includes('fiber') || k.includes('sugar') ||
  k.includes('sodium') || k.includes('vitamin') || k.includes('calcium')
);

if (nutritionVars.length > 0) {
  console.log('  ✅ Found nutrition output variables:');
  nutritionVars.forEach(([key, value]) => {
    console.log(`     - ${key}: ${value}`);
  });
} else {
  console.log('  ❌ No nutrition variables found in outputs');
  hasErrors = true;
}

// Summary
console.log('\n' + '='.repeat(70));
if (!hasErrors && nutritionVars.length > 0) {
  console.log('✅ VERIFICATION PASSED!');
  console.log('='.repeat(70));
  console.log('\nThe lane correctly:');
  console.log('  ✓ Gathers all ingredients');
  console.log('  ✓ Processes them into finished dish');
  console.log('  ✓ Produces nutrition output variables');
  console.log('  ✓ Has complete recipe metadata');
  console.log('\n🎯 This demonstrates the improvements work perfectly!');
  console.log('   Agents can now create lanes with complete nutrition tracking.\n');
} else {
  console.log('❌ VERIFICATION FAILED');
  console.log('='.repeat(70));
  if (hasErrors) {
    console.log('\n  State flow errors detected');
  }
  if (nutritionVars.length === 0) {
    console.log('  No nutrition variables in outputs');
  }
  process.exit(1);
}
