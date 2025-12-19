#!/usr/bin/env node
import { randomUUID } from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getTemplates, getVocabulary, addTemplate, getTemplateById } from './storage.js';
import type { BusyTemplate, LaneTemplate, Template, StateLedger } from './types.js';

// Common units that indicate a variable represents a measurable quantity
const UNIT_PATTERNS = [
  // Volume
  'cups', 'cup', 'liters', 'liter', 'l', 'ml', 'milliliters', 'milliliter',
  'gallons', 'gallon', 'gal', 'quarts', 'quart', 'qt', 'pints', 'pint', 'pt',
  'tablespoons', 'tablespoon', 'tbsp', 'teaspoons', 'teaspoon', 'tsp',
  'floz', 'fl_oz', 'fluid_ounces', 'fluid_ounce',
  // Weight/Mass
  'grams', 'gram', 'g', 'kg', 'kilograms', 'kilogram',
  'pounds', 'pound', 'lbs', 'lb', 'ounces', 'ounce', 'oz',
  'mg', 'milligrams', 'milligram',
  // Length/Distance
  'meters', 'meter', 'm', 'km', 'kilometers', 'kilometer',
  'centimeters', 'centimeter', 'cm', 'millimeters', 'millimeter', 'mm',
  'inches', 'inch', 'in', 'feet', 'foot', 'ft', 'yards', 'yard', 'yd',
  'miles', 'mile', 'mi',
  // Time (for durations as variables)
  'seconds', 'second', 'sec', 's', 'minutes', 'minute', 'min',
  'hours', 'hour', 'hr', 'days', 'day', 'weeks', 'week',
  // Count/Quantity (these are unit-agnostic, so they're acceptable as-is)
  'count', 'units', 'unit', 'pieces', 'piece', 'items', 'item',
  'servings', 'serving', 'portions', 'portion', 'batches', 'batch',
];

// Substances that commonly have variable units and REQUIRE a unit suffix
const MEASURABLE_SUBSTANCES = [
  'water', 'flour', 'sugar', 'salt', 'oil', 'butter', 'milk', 'cream',
  'rice', 'pasta', 'beans', 'coffee', 'tea', 'juice', 'wine', 'beer',
  'honey', 'syrup', 'vinegar', 'sauce', 'broth', 'stock',
  'meat', 'chicken', 'beef', 'pork', 'fish',
  'vegetables', 'fruit', 'cheese', 'eggs',
  'paint', 'cement', 'concrete', 'sand', 'gravel', 'soil', 'dirt',
  'fuel', 'gas', 'gasoline', 'diesel', 'propane',
  'chemicals', 'solution', 'mixture', 'compound',
  'fabric', 'thread', 'yarn', 'wire', 'cable', 'rope',
  'wood', 'lumber', 'metal', 'steel', 'aluminum', 'plastic',
];

/**
 * Validates that variable names for measurable substances include a unit.
 * Returns an array of validation errors, empty if all variables are valid.
 */
function validateVariableNames(variables: StateLedger): string[] {
  const errors: string[] = [];
  const variableNames = Object.keys(variables);

  for (const varName of variableNames) {
    const lowerName = varName.toLowerCase();
    const parts = lowerName.split(/[_\s-]+/);

    // Check if the variable name contains a measurable substance
    const containsSubstance = MEASURABLE_SUBSTANCES.some(substance =>
      parts.includes(substance) || lowerName.includes(substance)
    );

    if (containsSubstance) {
      // Check if the variable name also contains a unit
      const containsUnit = UNIT_PATTERNS.some(unit => {
        // Match unit as a complete word/part (not substring of another word)
        // e.g., "g" should match "flour_g" but not "sugar" (which contains 'g')
        return parts.includes(unit) ||
          lowerName.endsWith(`_${unit}`) ||
          lowerName.endsWith(`-${unit}`) ||
          // Special case for single-letter units at word boundaries
          (unit.length === 1 && parts.some(p => p === unit));
      });

      if (!containsUnit) {
        errors.push(
          `Variable "${varName}" contains a measurable substance but no unit. ` +
          `When a variable represents something that can be measured in different units ` +
          `(e.g., cups, liters, grams), the unit MUST be part of the variable name. ` +
          `Example: "water_cups", "flour_grams", "oil_ml".`
        );
      }
    }
  }

  return errors;
}

// Create server instance
const server = new McpServer({
  name: 'about-time',
  version: '0.0.1',
});

// Tool: Get vocabulary (all variable names used in StateLedgers)
server.tool(
  'get_vocabulary',
  'Get all unique variable names used in template StateLedgers (willConsume/willProduce). Use this before creating further variable names to ensure consistent variable naming. RULE: Variables for measurable substances (water, flour, oil, etc.) MUST include the unit in the name (e.g., "water_cups", "flour_grams").',
  {},
  async () => {
    const vocabulary = getVocabulary();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            count: vocabulary.length,
            variables: vocabulary,
            hint: 'Reuse these variable names when creating new templates to maintain consistency. IMPORTANT: Variables for measurable substances must include units (e.g., "water_cups", "flour_grams", "oil_ml").',
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Get templates
server.tool(
  'get_templates',
  'Get all templates from the library. Optionally filter by type (busy or lane).',
  {
    templateType: z.enum(['busy', 'lane']).optional().describe('Filter by template type'),
  },
  async ({ templateType }) => {
    let templates = getTemplates();
    if (templateType) {
      templates = templates.filter((t) => t.templateType === templateType);
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            count: templates.length,
            templates: templates.map((t) => ({
              id: t.id,
              intent: t.intent,
              templateType: t.templateType,
              estimatedDuration: t.estimatedDuration,
              version: t.version,
              ...(t.templateType === 'busy' ? {
                willConsume: (t as BusyTemplate).willConsume,
                willProduce: (t as BusyTemplate).willProduce,
              } : {
                segmentCount: (t as LaneTemplate).segments.length,
              }),
            })),
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Get template by ID
server.tool(
  'get_template',
  'Get a specific template by its ID.',
  {
    templateId: z.string().describe('The ID of the template to retrieve'),
  },
  async ({ templateId }) => {
    const template = getTemplateById(templateId);
    if (!template) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: `Template with ID ${templateId} not found` }),
          },
        ],
      };
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(template, null, 2),
        },
      ],
    };
  }
);

// Tool: Create busy template
server.tool(
  'create_busy_template',
  'Create a new busy template (an atomic activity with resource consumption/production). Durations are in milliseconds. IMPORTANT: Variable names for measurable substances (water, flour, oil, etc.) MUST include the unit (e.g., "water_cups", "flour_grams", "oil_ml").',
  {
    intent: z.string().describe('Human-readable description of what this activity does'),
    estimatedDuration: z.number().describe('Estimated duration in milliseconds'),
    willConsume: z.record(z.number()).describe('Variables consumed (name -> quantity). For measurable substances, include unit in name (e.g., "water_cups", "flour_grams")'),
    willProduce: z.record(z.number()).describe('Variables produced (name -> quantity). For measurable substances, include unit in name (e.g., "water_cups", "flour_grams")'),
    authorId: z.string().optional().describe('Author ID (defaults to "agent")'),
    version: z.string().optional().describe('SemVer version (defaults to "0.0.0")'),
  },
  async ({ intent, estimatedDuration, willConsume, willProduce, authorId, version }) => {
    // Validate variable names for measurable substances
    const consumeErrors = validateVariableNames(willConsume);
    const produceErrors = validateVariableNames(willProduce);
    const allErrors = [...consumeErrors, ...produceErrors];

    if (allErrors.length > 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Variable naming validation failed',
              details: allErrors,
              hint: 'Variables representing measurable substances (water, flour, oil, etc.) must include their unit in the name. Examples: "water_cups", "flour_grams", "oil_ml".',
            }, null, 2),
          },
        ],
      };
    }

    const template: BusyTemplate = {
      templateType: 'busy',
      id: randomUUID(),
      intent,
      authorId: authorId ?? 'agent',
      version: version ?? '0.0.0',
      estimatedDuration,
      willConsume,
      willProduce,
    };
    
    try {
      addTemplate(template);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Created busy template: ${intent}`,
              template,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            }),
          },
        ],
      };
    }
  }
);

// Tool: Create lane template
server.tool(
  'create_lane_template',
  'Create a new lane template (a container for sequencing other templates). Offsets are in milliseconds relative to lane start.',
  {
    intent: z.string().describe('Human-readable description of the overall workflow'),
    estimatedDuration: z.number().describe('Total estimated duration in milliseconds'),
    segments: z.array(z.object({
      templateId: z.string().describe('ID of the template to include'),
      offset: z.number().describe('When this segment starts (ms from lane start)'),
    })).describe('Ordered list of template references with offsets'),
    authorId: z.string().optional().describe('Author ID (defaults to "agent")'),
    version: z.string().optional().describe('SemVer version (defaults to "0.0.0")'),
  },
  async ({ intent, estimatedDuration, segments, authorId, version }) => {
    const template: LaneTemplate = {
      templateType: 'lane',
      id: randomUUID(),
      intent,
      authorId: authorId ?? 'agent',
      version: version ?? '0.0.0',
      estimatedDuration,
      segments,
    };
    
    try {
      addTemplate(template);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Created lane template: ${intent}`,
              template,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            }),
          },
        ],
      };
    }
  }
);

// Tool: Search templates by intent
server.tool(
  'search_templates',
  'Search templates by intent (case-insensitive substring match).',
  {
    query: z.string().describe('Search query to match against template intents'),
  },
  async ({ query }) => {
    const templates = getTemplates();
    const matches = templates.filter((t) =>
      t.intent.toLowerCase().includes(query.toLowerCase())
    );
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query,
            count: matches.length,
            matches: matches.map((t) => ({
              id: t.id,
              intent: t.intent,
              templateType: t.templateType,
            })),
          }, null, 2),
        },
      ],
    };
  }
);

// Run the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('About Time MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
