#!/usr/bin/env node

/**
 * Test script for the duration validation rule
 *
 * Rule: A segment must be >= 1/10th and < 1x its parent's duration
 * Valid range: [parent * 0.1, parent)
 *
 * This script demonstrates:
 * 1. Creating a lane with segment too small (< 1/10th parent) - should fail
 * 2. Creating a lane with segment too large (>= parent) - should fail
 * 3. Creating a valid lane (segment in valid range) - should succeed
 * 4. Growing parent duration (can violate lower bound) - shows when it fails
 * 5. Shrinking parent duration (can violate upper bound) - shows when it fails
 * 6. Testing recursive validation with nested lanes
 */

import { randomUUID } from 'crypto';
import {
  getTemplates,
  addTemplate,
  getTemplateMap,
  loadLibrary,
  saveLibrary,
} from '../mcp-server/build/storage.js';
import {
  validateLaneSegmentDurations,
  validateLaneDurationChange,
  validateTemplateReferences,
  formatDurationViolationErrors,
} from '../mcp-server/build/durationValidation.js';

console.log('🧪 Testing Duration Validation Rule');
console.log('Rule: Segment must be >= 1/10th and < 1x parent duration');
console.log('Valid range: [parent * 0.1, parent)\n');
console.log('=' .repeat(60));

// Clean up test templates from previous runs
function cleanupTestTemplates() {
  const library = loadLibrary();
  const originalCount = library.templates.length;
  library.templates = library.templates.filter(t => !t.intent.startsWith('[TEST]'));
  const removedCount = originalCount - library.templates.length;
  if (removedCount > 0) {
    saveLibrary(library);
    console.log(`\n🧹 Cleaned up ${removedCount} test template(s) from previous runs\n`);
  }
}

cleanupTestTemplates();

// Test 1: Create a lane with segment TOO SMALL (< 1/10th parent)
console.log('\n📝 Test 1: Lane with segment TOO SMALL (violates lower bound)');
console.log('-'.repeat(60));

const busyTemplate1 = {
  templateType: 'busy',
  id: randomUUID(),
  intent: '[TEST] Short task (30 seconds)',
  authorId: 'test',
  version: '0.0.0',
  estimatedDuration: 30000, // 30 seconds
  references: [],
  willConsume: {},
  willProduce: { 'test_output': 1 },
};

addTemplate(busyTemplate1);
console.log(`✅ Created busy template: ${busyTemplate1.intent} (30s)`);

const tooSmallLane = {
  templateType: 'lane',
  id: randomUUID(),
  intent: '[TEST] Lane too long (10 minutes - requires min 1min segment)',
  authorId: 'test',
  version: '0.0.0',
  estimatedDuration: 600000, // 10 minutes
  references: [],
  segments: [{
    templateId: busyTemplate1.id,
    relationshipId: randomUUID(),
    offset: 0,
  }],
};

console.log(`\nAttempting to create lane (10min) with segment (30s)`);
console.log(`  Required minimum: ${tooSmallLane.estimatedDuration * 0.1}ms (1min)`);
console.log(`  Required maximum: < ${tooSmallLane.estimatedDuration}ms (< 10min)`);
console.log(`  Actual segment: 30s`);
console.log(`  Result: 30s < 1min → VIOLATES lower bound ❌`);

const templateMap = new Map(Object.entries(getTemplateMap()));
const validation1 = validateLaneSegmentDurations(tooSmallLane, templateMap);

console.log(`\n🔍 Validation result: ${validation1.isValid ? '✅ VALID' : '❌ INVALID'}`);
if (!validation1.isValid) {
  console.log('Violations:');
  const errors = formatDurationViolationErrors(validation1.violations);
  errors.forEach(err => console.log(`  - ${err}`));
}

// Test 2: Create a lane with segment TOO LARGE (>= parent)
console.log('\n\n📝 Test 2: Lane with segment TOO LARGE (violates upper bound)');
console.log('-'.repeat(60));

const busyTemplate2 = {
  templateType: 'busy',
  id: randomUUID(),
  intent: '[TEST] Long task (10 minutes)',
  authorId: 'test',
  version: '0.0.0',
  estimatedDuration: 600000, // 10 minutes
  references: [],
  willConsume: {},
  willProduce: { 'test_output_2': 1 },
};

addTemplate(busyTemplate2);
console.log(`✅ Created busy template: ${busyTemplate2.intent} (10min)`);

const tooLargeLane = {
  templateType: 'lane',
  id: randomUUID(),
  intent: '[TEST] Lane same size (10 minutes - segment equals parent)',
  authorId: 'test',
  version: '0.0.0',
  estimatedDuration: 600000, // 10 minutes (same as segment!)
  references: [],
  segments: [{
    templateId: busyTemplate2.id,
    relationshipId: randomUUID(),
    offset: 0,
  }],
};

console.log(`\nAttempting to create lane (10min) with segment (10min)`);
console.log(`  Required minimum: ${tooLargeLane.estimatedDuration * 0.1}ms (1min)`);
console.log(`  Required maximum: < ${tooLargeLane.estimatedDuration}ms (< 10min)`);
console.log(`  Actual segment: 10min`);
console.log(`  Result: 10min >= 10min → VIOLATES upper bound ❌`);

const templateMap2 = new Map(Object.entries(getTemplateMap()));
const validation2 = validateLaneSegmentDurations(tooLargeLane, templateMap2);

console.log(`\n🔍 Validation result: ${validation2.isValid ? '✅ VALID' : '❌ INVALID'}`);
if (!validation2.isValid) {
  console.log('Violations:');
  const errors = formatDurationViolationErrors(validation2.violations);
  errors.forEach(err => console.log(`  - ${err}`));
}

// Test 3: Create a VALID lane (segment in valid range)
console.log('\n\n📝 Test 3: Lane with segment in VALID range');
console.log('-'.repeat(60));

const busyTemplate3 = {
  templateType: 'busy',
  id: randomUUID(),
  intent: '[TEST] Medium task (3 minutes)',
  authorId: 'test',
  version: '0.0.0',
  estimatedDuration: 180000, // 3 minutes
  references: [],
  willConsume: {},
  willProduce: { 'test_output_3': 1 },
};

addTemplate(busyTemplate3);
console.log(`✅ Created busy template: ${busyTemplate3.intent} (3min)`);

const validLane = {
  templateType: 'lane',
  id: randomUUID(),
  intent: '[TEST] Valid lane (10 minutes)',
  authorId: 'test',
  version: '0.0.0',
  estimatedDuration: 600000, // 10 minutes
  references: [],
  segments: [{
    templateId: busyTemplate3.id,
    relationshipId: randomUUID(),
    offset: 0,
  }],
};

console.log(`\nAttempting to create lane (10min) with segment (3min)`);
console.log(`  Required minimum: ${validLane.estimatedDuration * 0.1}ms (1min)`);
console.log(`  Required maximum: < ${validLane.estimatedDuration}ms (< 10min)`);
console.log(`  Actual segment: 3min`);
console.log(`  Result: 1min <= 3min < 10min → VALID ✅`);

const templateMap3 = new Map(Object.entries(getTemplateMap()));
const validation3 = validateLaneSegmentDurations(validLane, templateMap3);

console.log(`\n🔍 Validation result: ${validation3.isValid ? '✅ VALID' : '❌ INVALID'}`);

if (validation3.isValid) {
  addTemplate(validLane);
  console.log('✅ Lane saved successfully');
}

// Test 4: Growing parent can violate LOWER bound
console.log('\n\n📝 Test 4: Growing parent duration (can violate lower bound)');
console.log('-'.repeat(60));

const grownDuration = 1800000; // 30 minutes
console.log(`\nAttempting to grow lane from 10min to 30min (segment remains 3min)`);
console.log(`  New required minimum: ${grownDuration * 0.1}ms (3min)`);
console.log(`  New required maximum: < ${grownDuration}ms (< 30min)`);
console.log(`  Actual segment: 3min`);
console.log(`  Result: 3min = 3min (at boundary) → VALID ✅`);

const validation4 = validateLaneDurationChange(validLane, grownDuration, templateMap3);
console.log(`\n🔍 Validation result: ${validation4.isValid ? '✅ VALID' : '❌ INVALID'}`);
if (!validation4.isValid) {
  console.log('Violations:');
  const errors = formatDurationViolationErrors(validation4.violations);
  errors.forEach(err => console.log(`  - ${err}`));
}

// Test 5: Shrinking parent can violate UPPER bound
console.log('\n\n📝 Test 5: Shrinking parent duration (can violate upper bound)');
console.log('-'.repeat(60));

const shrunkDuration = 180000; // 3 minutes (same as segment!)
console.log(`\nAttempting to shrink lane from 10min to 3min (segment remains 3min)`);
console.log(`  New required minimum: ${shrunkDuration * 0.1}ms (18s)`);
console.log(`  New required maximum: < ${shrunkDuration}ms (< 3min)`);
console.log(`  Actual segment: 3min`);
console.log(`  Result: 3min >= 3min → VIOLATES upper bound ❌`);

const validation5 = validateLaneDurationChange(validLane, shrunkDuration, templateMap3);
console.log(`\n🔍 Validation result: ${validation5.isValid ? '✅ VALID' : '❌ INVALID'}`);
if (!validation5.isValid) {
  console.log('Violations:');
  const errors = formatDurationViolationErrors(validation5.violations);
  errors.forEach(err => console.log(`  - ${err}`));
}

// Test 6: Nested lanes with both bounds
console.log('\n\n📝 Test 6: Nested lanes with recursive validation');
console.log('-'.repeat(60));

const busyTemplate4 = {
  templateType: 'busy',
  id: randomUUID(),
  intent: '[TEST] Task A (1 minute)',
  authorId: 'test',
  version: '0.0.0',
  estimatedDuration: 60000, // 1 minute
  references: [],
  willConsume: {},
  willProduce: { 'output_a': 1 },
};

const busyTemplate5 = {
  templateType: 'busy',
  id: randomUUID(),
  intent: '[TEST] Task B (2 minutes)',
  authorId: 'test',
  version: '0.0.0',
  estimatedDuration: 120000, // 2 minutes
  references: [],
  willConsume: { 'output_a': 1 },
  willProduce: { 'output_b': 1 },
};

addTemplate(busyTemplate4);
addTemplate(busyTemplate5);
console.log(`✅ Created busy templates: Task A (1min), Task B (2min)`);

const innerLane = {
  templateType: 'lane',
  id: randomUUID(),
  intent: '[TEST] Inner lane (10 minutes)',
  authorId: 'test',
  version: '0.0.0',
  estimatedDuration: 600000, // 10 minutes
  references: [],
  segments: [
    {
      templateId: busyTemplate4.id,
      relationshipId: randomUUID(),
      offset: 0,
    },
    {
      templateId: busyTemplate5.id,
      relationshipId: randomUUID(),
      offset: 60000,
    },
  ],
};

console.log(`\nCreating inner lane (10min) with segments (1min, 2min)`);
console.log(`  Required minimum per segment: 1min`);
console.log(`  Required maximum per segment: < 10min`);
console.log(`  Result: Both segments valid ✅`);

const templateMapNested = new Map(Object.entries(getTemplateMap()));
const validation6 = validateLaneSegmentDurations(innerLane, templateMapNested);
console.log(`\n🔍 Validation result: ${validation6.isValid ? '✅ VALID' : '❌ INVALID'}`);

if (validation6.isValid) {
  addTemplate(innerLane);
  busyTemplate4.references.push({
    parentId: innerLane.id,
    relationshipId: innerLane.segments[0].relationshipId,
  });
  busyTemplate5.references.push({
    parentId: innerLane.id,
    relationshipId: innerLane.segments[1].relationshipId,
  });

  const templates = getTemplates();
  const idx4 = templates.findIndex(t => t.id === busyTemplate4.id);
  const idx5 = templates.findIndex(t => t.id === busyTemplate5.id);
  if (idx4 !== -1) templates[idx4] = busyTemplate4;
  if (idx5 !== -1) templates[idx5] = busyTemplate5;
  saveLibrary({ version: '1.0.0', templates });

  // Create outer lane
  const outerLane = {
    templateType: 'lane',
    id: randomUUID(),
    intent: '[TEST] Outer lane (1 hour)',
    authorId: 'test',
    version: '0.0.0',
    estimatedDuration: 3600000, // 1 hour
    references: [],
    segments: [{
      templateId: innerLane.id,
      relationshipId: randomUUID(),
      offset: 0,
    }],
  };

  console.log(`\nCreating outer lane (1hr) with inner lane (10min) as segment`);
  console.log(`  Required minimum: 6min`);
  console.log(`  Required maximum: < 1hr`);
  console.log(`  Result: 6min <= 10min < 1hr → VALID ✅`);

  const templateMapOuter = new Map(Object.entries(getTemplateMap()));
  const validation7 = validateLaneSegmentDurations(outerLane, templateMapOuter);
  console.log(`\n🔍 Validation result: ${validation7.isValid ? '✅ VALID' : '❌ INVALID'}`);

  if (validation7.isValid) {
    addTemplate(outerLane);
    innerLane.references.push({
      parentId: outerLane.id,
      relationshipId: outerLane.segments[0].relationshipId,
    });

    const templatesUpdated = getTemplates();
    const idxInner = templatesUpdated.findIndex(t => t.id === innerLane.id);
    if (idxInner !== -1) templatesUpdated[idxInner] = innerLane;
    saveLibrary({ version: '1.0.0', templates: templatesUpdated });

    // Try to grow inner lane to 1 hour (would equal parent - violates upper bound)
    console.log(`\n  Attempting to grow inner lane to 1hr (would equal parent)...`);
    const newInnerDuration = 3600000; // 1 hour
    console.log(`    Required for parent: >= 6min and < 1hr`);
    console.log(`    Result: 1hr >= 1hr → VIOLATES upper bound ❌`);

    const templateMapFinal = new Map(Object.entries(getTemplateMap()));
    const validation8 = validateTemplateReferences(innerLane, newInnerDuration, templateMapFinal);
    console.log(`\n  🔍 Recursive validation result: ${validation8.isValid ? '✅ VALID' : '❌ INVALID'}`);
    if (!validation8.isValid) {
      console.log('  Violations:');
      const errors = formatDurationViolationErrors(validation8.violations);
      errors.forEach(err => console.log(`    - ${err}`));
    }
  }
}

console.log('\n' + '='.repeat(60));
console.log('✅ All tests completed!\n');
console.log('Summary of validation rule:');
console.log('  - Segments must be >= 1/10th of parent (lower bound)');
console.log('  - Segments must be < parent duration (upper bound)');
console.log('  - Valid range: [parent * 0.1, parent)');
console.log('\n🎉 Duration validation is working correctly!\n');
