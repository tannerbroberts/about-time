#!/usr/bin/env node
/**
 * Validate all lane templates using the validation logic
 * This simulates what the validate_all_lanes MCP tool does
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { validateLane } = require('../mcp-server/node_modules/@tannerbroberts/about-time-core/dist/index.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATES_PATH = join(__dirname, '../src/data/templates.json');

console.log('🔍 VALIDATING ALL LANE TEMPLATES');
console.log('='.repeat(70));
console.log();

// Load templates
const library = JSON.parse(readFileSync(TEMPLATES_PATH, 'utf8'));
const templates = library.templates;

// Create template map for O(1) lookups
const templateMap = {};
templates.forEach(t => {
  templateMap[t.id] = t;
});

// Find all lane templates
const laneTemplates = templates.filter(t => t.templateType === 'lane');

console.log(`Found ${laneTemplates.length} lane templates\n`);

// Validate each lane
const results = laneTemplates.map(lane => {
  const validation = validateLane(lane, templateMap);
  return {
    id: lane.id,
    intent: lane.intent,
    isValid: validation.isValid,
    contractInputs: validation.contractInputs,
    contractOutputs: validation.contractOutputs,
    errorCount: validation.errors.length,
    errors: validation.errors,
    firstBusy: validation.firstBusy,
    lastBusy: validation.lastBusy,
  };
});

// Summary
const validLanes = results.filter(r => r.isValid);
const invalidLanes = results.filter(r => !r.isValid);
const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);

console.log('📊 VALIDATION SUMMARY');
console.log('-'.repeat(70));
console.log(`  Total Lanes:    ${laneTemplates.length}`);
console.log(`  Valid Lanes:    ${validLanes.length} ✅`);
console.log(`  Invalid Lanes:  ${invalidLanes.length} ${invalidLanes.length > 0 ? '❌' : ''}`);
console.log(`  Total Errors:   ${totalErrors}`);
console.log();

// Show details for each lane
console.log('📋 DETAILED RESULTS');
console.log('='.repeat(70));

results.forEach((result, index) => {
  const status = result.isValid ? '✅' : '❌';
  console.log(`\n${index + 1}. ${status} ${result.intent}`);
  console.log(`   ID: ${result.id}`);
  console.log(`   Errors: ${result.errorCount}`);

  // Show contract
  const inputCount = Object.keys(result.contractInputs).length;
  const outputCount = Object.keys(result.contractOutputs).length;

  if (inputCount > 0 || outputCount > 0) {
    console.log(`\n   📥 Inputs (${inputCount}):`);
    if (inputCount > 0) {
      Object.entries(result.contractInputs).forEach(([key, value]) => {
        console.log(`      - ${key}: ${value}`);
      });
    } else {
      console.log(`      (none)`);
    }

    console.log(`\n   📤 Outputs (${outputCount}):`);
    if (outputCount > 0) {
      Object.entries(result.contractOutputs).forEach(([key, value]) => {
        console.log(`      - ${key}: ${value}`);
      });
    } else {
      console.log(`      (none)`);
    }
  }

  // Show first and last busy
  if (result.firstBusy) {
    console.log(`\n   🎬 First busy: ${result.firstBusy.intent}`);
  }
  if (result.lastBusy) {
    console.log(`   🏁 Last busy: ${result.lastBusy.intent}`);
  }

  // Show errors
  if (result.errors.length > 0) {
    console.log(`\n   ⚠️  ERRORS:`);
    result.errors.forEach((err, i) => {
      console.log(`      ${i + 1}. [${err.type}] ${err.message}`);
      if (err.busyTemplate) {
        console.log(`         Template: ${err.busyTemplate.intent}`);
      }
    });
  }
});

// Highlight recipe lanes with nutrition tracking
console.log('\n\n' + '='.repeat(70));
console.log('🍽️  RECIPE LANES WITH NUTRITION TRACKING');
console.log('='.repeat(70));

const recipeLanes = results.filter(r => {
  const outputs = Object.keys(r.contractOutputs);
  return outputs.some(key =>
    key.includes('calories') || key.includes('protein') ||
    key.includes('carbs') || key.includes('fat')
  );
});

if (recipeLanes.length > 0) {
  console.log(`\nFound ${recipeLanes.length} recipe lane(s) with nutrition outputs:\n`);

  recipeLanes.forEach((lane, index) => {
    console.log(`${index + 1}. ${lane.intent}`);
    console.log(`   ID: ${lane.id}`);
    console.log(`   Status: ${lane.isValid ? '✅ Valid' : '❌ Invalid'}`);

    // Show nutrition outputs
    const nutritionOutputs = Object.entries(lane.contractOutputs).filter(([key]) =>
      key.includes('calories') || key.includes('protein') ||
      key.includes('carbs') || key.includes('fat') ||
      key.includes('fiber') || key.includes('sugar') || key.includes('sodium')
    );

    if (nutritionOutputs.length > 0) {
      console.log(`\n   💊 Nutrition Outputs (${nutritionOutputs.length}):`);
      nutritionOutputs.forEach(([key, value]) => {
        console.log(`      - ${key}: ${value}`);
      });
    }
    console.log();
  });
} else {
  console.log('\n  No recipe lanes with nutrition tracking found.');
}

// Final status
console.log('='.repeat(70));
if (invalidLanes.length === 0) {
  console.log('✅ ALL LANES VALID - No validation errors!');
} else {
  console.log(`❌ ${invalidLanes.length} LANE(S) HAVE VALIDATION ERRORS`);
  console.log('\nInvalid lanes:');
  invalidLanes.forEach(lane => {
    console.log(`  - ${lane.intent}`);
    console.log(`    Errors: ${lane.errorCount}`);
  });
}
console.log('='.repeat(70));
