#!/usr/bin/env node
import { randomUUID } from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  getTemplates,
  getVocabulary,
  addTemplate,
  getTemplateById,
  loadLibrary,
  saveLibrary,
  getTemplateMap,
  saveTemplateMap,
} from './storage.js';
import type { BusyTemplate, LaneTemplate, Template, StateLedger } from './types.js';
import {
  applyLaneLayout,
  packSegments,
  equallyDistributeSegments,
  distributeSegmentOffsetsByInterval,
  fitLaneDurationToLast,
  insertGap,
  addSegmentToEnd,
  pushSegmentToStart,
  insertSegmentAt,
  visualizeLane,
  visualizeLaneIds,
  validateLane,
  validateVariableNames,
  UNIT_PATTERNS,
  MEASURABLE_SUBSTANCES,
} from '@tannerbroberts/about-time-core';

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
    // Validate duration is positive (0-duration templates are not allowed)
    if (estimatedDuration <= 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Invalid duration',
              details: 'estimatedDuration must be greater than 0. Every busy template represents an action that takes time for a person to read or hear the intent.',
            }, null, 2),
          },
        ],
      };
    }

    // Validate variable names for measurable substances
    const consumeResult = validateVariableNames(willConsume);
    const produceResult = validateVariableNames(willProduce);
    const allErrors = [...consumeResult.errors, ...produceResult.errors];

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
      references: [],
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
      relationshipId: z.string().describe('Unique ID for this specific relationship'),
      offset: z.number().describe('When this segment starts (ms from lane start)'),
    })).describe('Ordered list of template references with offsets'),
    authorId: z.string().optional().describe('Author ID (defaults to "agent")'),
    version: z.string().optional().describe('SemVer version (defaults to "0.0.0")'),
  },
  async ({ intent, estimatedDuration, segments, authorId, version }) => {
    // Validate duration is positive
    if (estimatedDuration <= 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Invalid duration',
              details: 'estimatedDuration must be greater than 0.',
            }, null, 2),
          },
        ],
      };
    }

    const template: LaneTemplate = {
      templateType: 'lane',
      id: randomUUID(),
      intent,
      authorId: authorId ?? 'agent',
      version: version ?? '0.0.0',
      estimatedDuration,
      references: [],
      segments,
    };

    try {
      // Add back-references to all child templates (bidirectional linking)
      const templates = getTemplates();
      const updatedChildren: string[] = [];

      for (const segment of segments) {
        const childTemplate = getTemplateById(segment.templateId);
        if (!childTemplate) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: `Child template ${segment.templateId} not found`,
                  details: 'All segment templates must exist before creating the lane',
                }),
              },
            ],
          };
        }

        // Check if this relationship already exists
        const existingRef = childTemplate.references.find(
          ref => ref.parentId === template.id && ref.relationshipId === segment.relationshipId
        );

        if (!existingRef) {
          // Add back-reference to child template
          childTemplate.references.push({
            parentId: template.id,
            relationshipId: segment.relationshipId,
          });

          // Update child template in storage
          const childIndex = templates.findIndex(t => t.id === segment.templateId);
          if (childIndex !== -1) {
            templates[childIndex] = childTemplate;
            updatedChildren.push(childTemplate.id);
          }
        }
      }

      // Save updated children
      if (updatedChildren.length > 0) {
        saveLibrary({ version: '1.0.0', templates });
      }

      // Add the lane template
      addTemplate(template);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Created lane template: ${intent}`,
              template,
              backlinksAdded: updatedChildren.length,
              note: 'Bidirectional links established between lane and child templates',
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

// Tool: Validate lane template
server.tool(
  'validate_lane_template',
  'Validate a lane template against state transition contract rules. Checks: (1) No busy template overlaps, (2) Only first busy can have unsatisfied inputs, (3) Only last busy can have unconsumed outputs, (4) All internal state must be produced before consumed.',
  {
    laneId: z.string().describe('The ID of the lane template to validate'),
  },
  async ({ laneId }) => {
    const template = getTemplateById(laneId);
    if (!template) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: `Template with ID ${laneId} not found` }),
          },
        ],
      };
    }

    if (template.templateType !== 'lane') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: `Template ${laneId} is not a lane template (type: ${template.templateType})`,
            }),
          },
        ],
      };
    }

    const templateMap = getTemplateMap();
    const result = validateLane(template as LaneTemplate, templateMap);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            isValid: result.isValid,
            contractSignature: {
              inputs: result.contractInputs,
              outputs: result.contractOutputs,
            },
            firstBusy: result.firstBusy ? {
              id: result.firstBusy.id,
              intent: result.firstBusy.intent,
            } : null,
            lastBusy: result.lastBusy ? {
              id: result.lastBusy.id,
              intent: result.lastBusy.intent,
            } : null,
            errors: result.errors,
            errorCount: result.errors.length,
          }, null, 2),
        },
      ],
    };
  }
);

// ==================== LAYOUT OPERATIONS ====================

// Tool: Apply lane layout
server.tool(
  'apply_lane_layout',
  'Apply flexbox-style layout rules to a lane\'s segments. Supports justifyContent (start, end, center, space-between, space-around, space-evenly) and gap options.',
  {
    laneId: z.string().describe('The ID of the lane to layout'),
    justifyContent: z.enum(['start', 'end', 'center', 'space-between', 'space-around', 'space-evenly']).optional().describe('How to distribute segments within the lane (default: start)'),
    gap: z.number().optional().describe('Gap duration in milliseconds between segments (default: 0)'),
  },
  async ({ laneId, justifyContent, gap }) => {
    const templateMap = getTemplateMap();
    const result = applyLaneLayout(laneId, templateMap, { justifyContent, gap });
    
    if (!result) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, error: `Lane ${laneId} not found or is not a lane template` }),
          },
        ],
      };
    }
    
    saveTemplateMap(templateMap);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Applied layout to lane: ${result.intent}`,
            lane: {
              id: result.id,
              intent: result.intent,
              estimatedDuration: result.estimatedDuration,
              segments: result.segments,
            },
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Pack segments
server.tool(
  'pack_segments',
  'Remove all gaps between segments, packing them starting at offset 0. Does NOT resize the lane duration.',
  {
    laneId: z.string().describe('The ID of the lane to pack'),
  },
  async ({ laneId }) => {
    const templateMap = getTemplateMap();
    const result = packSegments(laneId, templateMap);
    
    if (!result) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, error: `Lane ${laneId} not found or is not a lane template` }),
          },
        ],
      };
    }
    
    saveTemplateMap(templateMap);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Packed segments in lane: ${result.intent}`,
            lane: {
              id: result.id,
              intent: result.intent,
              segments: result.segments,
            },
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Equally distribute segments
server.tool(
  'equally_distribute_segments',
  'Equally distribute segments across the lane\'s duration using space-between logic (first segment at 0, last segment ends at duration).',
  {
    laneId: z.string().describe('The ID of the lane'),
  },
  async ({ laneId }) => {
    const templateMap = getTemplateMap();
    const result = equallyDistributeSegments(laneId, templateMap);
    
    if (!result) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, error: `Lane ${laneId} not found or is not a lane template` }),
          },
        ],
      };
    }
    
    saveTemplateMap(templateMap);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Equally distributed segments in lane: ${result.intent}`,
            lane: {
              id: result.id,
              intent: result.intent,
              segments: result.segments,
            },
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Distribute segments by interval
server.tool(
  'distribute_segments_by_interval',
  'Distribute segments with a fixed interval (gap) between them, starting from offset 0.',
  {
    laneId: z.string().describe('The ID of the lane'),
    interval: z.number().describe('The gap duration in milliseconds between segments'),
  },
  async ({ laneId, interval }) => {
    const templateMap = getTemplateMap();
    const result = distributeSegmentOffsetsByInterval(laneId, interval, templateMap);
    
    if (!result) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, error: `Lane ${laneId} not found or is not a lane template` }),
          },
        ],
      };
    }
    
    saveTemplateMap(templateMap);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Distributed segments with ${interval}ms interval in lane: ${result.intent}`,
            lane: {
              id: result.id,
              intent: result.intent,
              segments: result.segments,
            },
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Fit lane duration to last segment
server.tool(
  'fit_lane_duration_to_last',
  'Resize lane\'s estimatedDuration to match the end-time of its last segment (offset + child duration).',
  {
    laneId: z.string().describe('The ID of the lane to resize'),
  },
  async ({ laneId }) => {
    const templateMap = getTemplateMap();
    const result = fitLaneDurationToLast(laneId, templateMap);
    
    if (!result) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, error: `Lane ${laneId} not found or is not a lane template` }),
          },
        ],
      };
    }
    
    saveTemplateMap(templateMap);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Fitted lane duration to last segment: ${result.intent}`,
            lane: {
              id: result.id,
              intent: result.intent,
              estimatedDuration: result.estimatedDuration,
              segments: result.segments,
            },
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Insert gap
server.tool(
  'insert_gap',
  'Insert empty space before a specific segment by shifting it and all subsequent segments forward.',
  {
    laneId: z.string().describe('The ID of the lane'),
    beforeSegmentIndex: z.number().describe('Index of the segment before which to insert the gap (0-based)'),
    gapDuration: z.number().describe('Duration of the gap to insert in milliseconds'),
  },
  async ({ laneId, beforeSegmentIndex, gapDuration }) => {
    const templateMap = getTemplateMap();
    const result = insertGap(laneId, beforeSegmentIndex, gapDuration, templateMap);
    
    if (!result) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, error: `Lane ${laneId} not found, is not a lane template, or index is out of bounds` }),
          },
        ],
      };
    }
    
    saveTemplateMap(templateMap);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Inserted ${gapDuration}ms gap before segment ${beforeSegmentIndex} in lane: ${result.intent}`,
            lane: {
              id: result.id,
              intent: result.intent,
              segments: result.segments,
            },
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Add segment to end
server.tool(
  'add_segment_to_end',
  'Add a new segment at the very end of the lane (after the current last segment ends).',
  {
    laneId: z.string().describe('The ID of the lane'),
    childId: z.string().describe('The ID of the template to add as a segment'),
    relationshipId: z.string().describe('Unique ID for this specific relationship'),
  },
  async ({ laneId, childId, relationshipId }) => {
    const templateMap = getTemplateMap();
    const result = addSegmentToEnd(laneId, childId, relationshipId, templateMap);

    if (!result) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, error: `Lane ${laneId} or child ${childId} not found, or lane is not a lane template` }),
          },
        ],
      };
    }

    // Add back-reference to child template (bidirectional linking)
    const childTemplate = templateMap[childId];
    if (childTemplate) {
      const existingRef = childTemplate.references.find(
        ref => ref.parentId === laneId && ref.relationshipId === relationshipId
      );

      if (!existingRef) {
        childTemplate.references.push({
          parentId: laneId,
          relationshipId: relationshipId,
        });
      }
    }

    saveTemplateMap(templateMap);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Added segment ${childId} to end of lane: ${result.intent}`,
            lane: {
              id: result.id,
              intent: result.intent,
              segments: result.segments,
            },
            note: 'Bidirectional link established',
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Push segment to start
server.tool(
  'push_segment_to_start',
  'Add a new segment at offset 0 and shift all existing segments forward by the new child\'s duration.',
  {
    laneId: z.string().describe('The ID of the lane'),
    childId: z.string().describe('The ID of the template to add as a segment'),
    relationshipId: z.string().describe('Unique ID for this specific relationship'),
  },
  async ({ laneId, childId, relationshipId }) => {
    const templateMap = getTemplateMap();
    const result = pushSegmentToStart(laneId, childId, relationshipId, templateMap);

    if (!result) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, error: `Lane ${laneId} or child ${childId} not found, or lane is not a lane template` }),
          },
        ],
      };
    }

    // Add back-reference to child template (bidirectional linking)
    const childTemplate = templateMap[childId];
    if (childTemplate) {
      const existingRef = childTemplate.references.find(
        ref => ref.parentId === laneId && ref.relationshipId === relationshipId
      );

      if (!existingRef) {
        childTemplate.references.push({
          parentId: laneId,
          relationshipId: relationshipId,
        });
      }
    }

    saveTemplateMap(templateMap);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Pushed segment ${childId} to start of lane: ${result.intent}`,
            lane: {
              id: result.id,
              intent: result.intent,
              segments: result.segments,
            },
            note: 'Bidirectional link established',
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Insert segment at offset
server.tool(
  'insert_segment_at',
  'Insert a segment at a specific offset and shift all segments that start at or after that offset forward by the new child\'s duration.',
  {
    laneId: z.string().describe('The ID of the lane'),
    childId: z.string().describe('The ID of the template to add as a segment'),
    offset: z.number().describe('The offset in milliseconds at which to insert'),
    relationshipId: z.string().describe('Unique ID for this specific relationship'),
  },
  async ({ laneId, childId, offset, relationshipId }) => {
    const templateMap = getTemplateMap();
    const result = insertSegmentAt(laneId, childId, offset, relationshipId, templateMap);

    if (!result) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, error: `Lane ${laneId} or child ${childId} not found, or lane is not a lane template` }),
          },
        ],
      };
    }

    // Add back-reference to child template (bidirectional linking)
    const childTemplate = templateMap[childId];
    if (childTemplate) {
      const existingRef = childTemplate.references.find(
        ref => ref.parentId === laneId && ref.relationshipId === relationshipId
      );

      if (!existingRef) {
        childTemplate.references.push({
          parentId: laneId,
          relationshipId: relationshipId,
        });
      }
    }

    saveTemplateMap(templateMap);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Inserted segment ${childId} at offset ${offset}ms in lane: ${result.intent}`,
            lane: {
              id: result.id,
              intent: result.intent,
              segments: result.segments,
            },
            note: 'Bidirectional link established',
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Visualize lane
server.tool(
  'visualize_lane',
  'Generate a text-based ASCII visualization of a lane and its segments. 1 character = 1 second. █ = busy, _ = lane, ░ = empty space. DEBUG UTILITY ONLY - for quick inspection of lane structure.',
  {
    laneId: z.string().describe('The ID of the lane to visualize'),
  },
  async ({ laneId }) => {
    const templateMap = getTemplateMap();
    
    try {
      const visualization = visualizeLane(laneId, templateMap);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              laneId,
              visualization: `\n${visualization}`,
              legend: '█ = busy template, _ = lane floor, ░ = empty gap space',
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

// Tool: Visualize lane with IDs
server.tool(
  'visualize_lane_ids',
  'Generate a text-based visualization of a lane using template IDs as characters. Requires all template IDs to be exactly 1 character. DEBUG UTILITY ONLY.',
  {
    laneId: z.string().describe('The ID of the lane to visualize (must be a single character)'),
  },
  async ({ laneId }) => {
    const templateMap = getTemplateMap();
    
    try {
      const visualization = visualizeLaneIds(laneId, templateMap);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              laneId,
              visualization: `\n${visualization}`,
              note: 'Each character represents a template ID. Requires single-character IDs.',
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

// Tool: Create passthrough template from validation errors
server.tool(
  'create_passthrough_template',
  'Analyze a lane\'s validation errors and create a pass-through busy template that consumes and produces the same variables, capping off unconsumed outputs. Use this to resolve "unsatisfied produce" errors by creating a summary template like "Leave out ingredients for use" or "Serve fresh baked bread".',
  {
    laneId: z.string().describe('The lane to analyze for unsatisfied produce errors'),
    intent: z.string().describe('Human-readable description (e.g., "Leave out ingredients for use", "Serve fresh baked bread")'),
    estimatedDuration: z.number().describe('Duration in ms - time for a person to read/hear the intent (must be > 0)'),
    addToLane: z.boolean().optional().describe('If true, automatically append to the lane (default: false)'),
  },
  async ({ laneId, intent, estimatedDuration, addToLane }) => {
    // Validate duration is positive
    if (estimatedDuration <= 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Invalid duration',
              details: 'estimatedDuration must be greater than 0. Every busy template represents an action that takes time for a person to read or hear the intent.',
            }, null, 2),
          },
        ],
      };
    }

    const template = getTemplateById(laneId);
    if (!template) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: `Template with ID ${laneId} not found` }),
          },
        ],
      };
    }

    if (template.templateType !== 'lane') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: `Template ${laneId} is not a lane template (type: ${template.templateType})`,
            }),
          },
        ],
      };
    }

    const templateMap = getTemplateMap();
    const validationResult = validateLane(template as LaneTemplate, templateMap);

    // Extract variables from "unsatisfied-produce" errors
    const unsatisfiedProduceErrors = validationResult.errors.filter(
      (e) => e.type === 'unsatisfied-produce',
    );

    if (unsatisfiedProduceErrors.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: 'No unsatisfied produce errors found in this lane',
              validationResult: {
                isValid: validationResult.isValid,
                errorCount: validationResult.errors.length,
                errorTypes: validationResult.errors.map((e) => e.type),
              },
            }, null, 2),
          },
        ],
      };
    }

    // Build the passthrough ledger from errors
    const passthroughLedger: StateLedger = {};
    const resolvedErrors: string[] = [];

    for (const error of unsatisfiedProduceErrors) {
      if (error.type === 'unsatisfied-produce') {
        const quantity = error.producedQuantity - error.consumedQuantity;
        if (quantity > 0) {
          passthroughLedger[error.variableName] = quantity;
          resolvedErrors.push(error.variableName);
        }
      }
    }

    // Create the passthrough busy template
    const passthroughTemplate: BusyTemplate = {
      templateType: 'busy',
      id: randomUUID(),
      intent,
      authorId: 'agent',
      version: '0.0.0',
      estimatedDuration,
      references: [],
      willConsume: { ...passthroughLedger },
      willProduce: { ...passthroughLedger },
    };

    try {
      addTemplate(passthroughTemplate);

      // Optionally add to the lane
      if (addToLane) {
        const templateMap = getTemplateMap();
        const relationshipId = randomUUID();
        addSegmentToEnd(laneId, passthroughTemplate.id, relationshipId, templateMap);

        // Add back-reference to child template (bidirectional linking)
        const childTemplate = templateMap[passthroughTemplate.id];
        if (childTemplate) {
          childTemplate.references.push({
            parentId: laneId,
            relationshipId: relationshipId,
          });
        }

        fitLaneDurationToLast(laneId, templateMap);
        saveTemplateMap(templateMap);
      }

      // Re-validate to show updated state
      const updatedTemplateMap = getTemplateMap();
      const updatedValidation = validateLane(
        getTemplateById(laneId) as LaneTemplate,
        updatedTemplateMap,
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Created passthrough template: ${intent}`,
              template: passthroughTemplate,
              resolvedErrors,
              addedToLane: addToLane ?? false,
              updatedValidation: {
                isValid: updatedValidation.isValid,
                errorCount: updatedValidation.errors.length,
                remainingErrors: updatedValidation.errors.map((e) => ({
                  type: e.type,
                  message: e.message,
                })),
              },
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

// Tool: Add nutrition metadata to template
server.tool(
  'add_nutrition_to_template',
  'Add nutrition metadata to an existing busy template. This allows tracking nutritional information (calories, macros, micronutrients) for recipes. Note: This adds metadata but does NOT create output variables - use create_nutrition_summary_template for that.',
  {
    templateId: z.string().describe('ID of the busy template to add nutrition to'),
    servings: z.number().optional().describe('Number of servings this nutrition data represents'),
    nutritionPerServing: z.object({
      calories_kcal: z.number().optional().describe('Calories per serving in kcal'),
      protein_g: z.number().optional().describe('Protein per serving in grams'),
      carbs_g: z.number().optional().describe('Carbohydrates per serving in grams'),
      fat_g: z.number().optional().describe('Fat per serving in grams'),
      fiber_g: z.number().optional().describe('Fiber per serving in grams'),
      sugar_g: z.number().optional().describe('Sugar per serving in grams'),
      sodium_mg: z.number().optional().describe('Sodium per serving in milligrams'),
      potassium_mg: z.number().optional().describe('Potassium per serving in milligrams'),
      calcium_mg: z.number().optional().describe('Calcium per serving in milligrams'),
      iron_mg: z.number().optional().describe('Iron per serving in milligrams'),
      vitamin_c_mg: z.number().optional().describe('Vitamin C per serving in milligrams'),
      vitamin_a_mcg: z.number().optional().describe('Vitamin A per serving in micrograms'),
      vitamin_d_mcg: z.number().optional().describe('Vitamin D per serving in micrograms'),
    }).describe('Nutritional information per serving'),
  },
  async ({ templateId, servings, nutritionPerServing }) => {
    try {
      const template = getTemplateById(templateId);
      if (!template) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: `Template with ID ${templateId} not found`,
              }, null, 2),
            },
          ],
        };
      }

      if (template.templateType !== 'busy') {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Can only add nutrition to busy templates, not lanes',
                hint: 'Use add_recipe_metadata_to_lane for lane-level metadata',
              }, null, 2),
            },
          ],
        };
      }

      // Add nutrition metadata to the template
      const updatedTemplate = {
        ...template,
        nutrition: {
          servings,
          perServing: nutritionPerServing,
        },
      };

      // Save updated template
      saveTemplateMap(getTemplateMap());
      const templates = getTemplates();
      const index = templates.findIndex((t) => t.id === templateId);
      if (index !== -1) {
        templates[index] = updatedTemplate;
        saveLibrary({ version: '1.0.0', templates });
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Added nutrition metadata to template: ${template.intent}`,
              template: updatedTemplate,
              reminder: 'Nutrition metadata is now stored, but to create nutrition OUTPUT variables in willProduce, use create_nutrition_summary_template',
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

// Tool: Create nutrition summary template
server.tool(
  'create_nutrition_summary_template',
  'Create a passthrough busy template that consumes a finished dish and produces nutrition output variables (calories_kcal, protein_g, etc.). This allows nutrition facts to flow through the lane state system as outputs.',
  {
    intent: z.string().describe('Human-readable description (e.g., "Miso ramen ready to serve with nutrition info")'),
    estimatedDuration: z.number().describe('Duration in milliseconds (usually short, like 5000ms)'),
    consumeVariable: z.string().describe('Variable name of the finished dish to consume (e.g., "miso_ramen_bowls")'),
    consumeQuantity: z.number().describe('Quantity of the variable to consume (e.g., 2)'),
    produceVariable: z.string().describe('Variable name of the finished dish to produce (usually same as consume)'),
    produceQuantity: z.number().describe('Quantity of the variable to produce (usually same as consume)'),
    totalNutrition: z.object({
      calories_kcal: z.number().optional().describe('Total calories in kcal'),
      protein_g: z.number().optional().describe('Total protein in grams'),
      carbs_g: z.number().optional().describe('Total carbohydrates in grams'),
      fat_g: z.number().optional().describe('Total fat in grams'),
      fiber_g: z.number().optional().describe('Total fiber in grams'),
      sugar_g: z.number().optional().describe('Total sugar in grams'),
      sodium_mg: z.number().optional().describe('Total sodium in milligrams'),
      potassium_mg: z.number().optional().describe('Total potassium in milligrams'),
      calcium_mg: z.number().optional().describe('Total calcium in milligrams'),
      iron_mg: z.number().optional().describe('Total iron in milligrams'),
      vitamin_c_mg: z.number().optional().describe('Total vitamin C in milligrams'),
      vitamin_a_mcg: z.number().optional().describe('Total vitamin A in micrograms'),
      vitamin_d_mcg: z.number().optional().describe('Total vitamin D in micrograms'),
    }).describe('Total nutritional values to produce as output variables'),
    authorId: z.string().optional().describe('Author ID (defaults to "agent")'),
    version: z.string().optional().describe('SemVer version (defaults to "0.0.0")'),
  },
  async ({ intent, estimatedDuration, consumeVariable, consumeQuantity, produceVariable, produceQuantity, totalNutrition, authorId, version }) => {
    try {
      // Build willConsume and willProduce StateLedgers
      const willConsume: StateLedger = {
        [consumeVariable]: consumeQuantity,
      };

      const willProduce: StateLedger = {
        [produceVariable]: produceQuantity,
        ...totalNutrition, // Add all nutrition values as produce variables
      };

      // Validate nutrition variable names
      // Note: These should pass validation since they follow substance_unit pattern
      const produceResult = validateVariableNames(willProduce);

      if (produceResult.errors.length > 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Variable naming validation failed for nutrition variables',
                details: produceResult.errors,
                hint: 'Nutrition variables should follow the pattern: calories_kcal, protein_g, carbs_g, fat_g, sodium_mg, etc.',
                workaround: 'If validation fails, the @tannerbroberts/about-time-core package may need updating to recognize nutrition variables',
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
        references: [],
        willConsume,
        willProduce,
      };

      addTemplate(template);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Created nutrition summary template: ${intent}`,
              template,
              nutritionOutputs: Object.keys(totalNutrition).filter((k) => totalNutrition[k as keyof typeof totalNutrition] !== undefined),
              usage: 'Add this template as the final segment in your recipe lane to produce nutrition outputs',
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

// Tool: Add recipe metadata to lane
server.tool(
  'add_recipe_metadata_to_lane',
  'Add recipe metadata (source URL, servings, tags, etc.) to a lane template. This helps document and categorize recipe lanes.',
  {
    laneId: z.string().describe('ID of the lane template to add metadata to'),
    sourceUrl: z.string().optional().describe('URL of the recipe source'),
    servings: z.number().optional().describe('Number of servings the recipe makes'),
    prepTime: z.number().optional().describe('Preparation time in milliseconds'),
    cookTime: z.number().optional().describe('Cooking time in milliseconds'),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('Recipe difficulty level'),
    cuisine: z.string().optional().describe('Cuisine type (e.g., "Japanese", "Italian")'),
    tags: z.array(z.string()).optional().describe('Tags for categorization (e.g., ["soup", "vegetarian", "quick"])'),
  },
  async ({ laneId, sourceUrl, servings, prepTime, cookTime, difficulty, cuisine, tags }) => {
    try {
      const template = getTemplateById(laneId);
      if (!template) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: `Template with ID ${laneId} not found`,
              }, null, 2),
            },
          ],
        };
      }

      if (template.templateType !== 'lane') {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Can only add recipe metadata to lane templates, not busy templates',
                hint: 'Use add_nutrition_to_template for busy template nutrition data',
              }, null, 2),
            },
          ],
        };
      }

      // Add recipe metadata to the template
      const updatedTemplate = {
        ...template,
        recipeMetadata: {
          sourceUrl,
          servings,
          prepTime,
          cookTime,
          difficulty,
          cuisine,
          tags,
        },
      };

      // Save updated template
      const templates = getTemplates();
      const index = templates.findIndex((t) => t.id === laneId);
      if (index !== -1) {
        templates[index] = updatedTemplate;
        saveLibrary({ version: '1.0.0', templates });
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Added recipe metadata to lane: ${template.intent}`,
              template: updatedTemplate,
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

// Tool: Validate all lane templates
server.tool(
  'validate_all_lanes',
  'Validate all lane templates in the library and report any validation errors. Useful for checking the health of all recipe lanes at once.',
  {},
  async () => {
    try {
      const templates = getTemplates();
      const laneTemplates = templates.filter(t => t.templateType === 'lane');
      const templateMap = getTemplateMap();

      if (laneTemplates.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'No lane templates found in library',
                totalLanes: 0,
              }, null, 2),
            },
          ],
        };
      }

      const results = laneTemplates.map(lane => {
        const validation = validateLane(lane as LaneTemplate, templateMap);
        return {
          id: lane.id,
          intent: lane.intent,
          isValid: validation.isValid,
          contractInputs: validation.contractInputs,
          contractOutputs: validation.contractOutputs,
          errorCount: validation.errors.length,
          errors: validation.errors.map((err: any) => ({
            type: err.type,
            message: err.message,
            ...(err.busyTemplate ? {
              busyTemplate: {
                id: err.busyTemplate.id,
                intent: err.busyTemplate.intent,
              }
            } : {}),
          })),
          firstBusy: validation.firstBusy ? {
            id: validation.firstBusy.id,
            intent: validation.firstBusy.intent,
          } : null,
          lastBusy: validation.lastBusy ? {
            id: validation.lastBusy.id,
            intent: validation.lastBusy.intent,
          } : null,
        };
      });

      const validLanes = results.filter(r => r.isValid);
      const invalidLanes = results.filter(r => !r.isValid);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              summary: {
                totalLanes: laneTemplates.length,
                validLanes: validLanes.length,
                invalidLanes: invalidLanes.length,
                totalErrors: results.reduce((sum, r) => sum + r.errorCount, 0),
              },
              lanes: results,
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
