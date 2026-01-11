// Duration validation utilities
// Rule: A segment must be >= 1/10th and < 1x (strictly less than) its parent's duration
// Valid range: [parent * 0.1, parent)
export const MINIMUM_DURATION_RATIO = 0.1; // 1/10th
export const MAXIMUM_DURATION_RATIO = 1.0; // Must be strictly less than parent
/**
 * Validates that a segment's duration is within the valid range:
 * - At least 1/10th of parent's duration (lower bound)
 * - Strictly less than parent's duration (upper bound)
 * Valid range: [parent * 0.1, parent)
 */
export function validateSegmentDuration(segmentDuration, parentDuration, segmentId, segmentIntent, parentId, parentIntent) {
    const requiredMinimum = parentDuration * MINIMUM_DURATION_RATIO;
    const requiredMaximum = parentDuration; // Segment must be strictly less than parent
    const violations = [];
    // Check lower bound: segment must be >= 1/10th of parent
    if (segmentDuration < requiredMinimum) {
        violations.push({
            type: 'too-small',
            segmentId,
            segmentIntent,
            segmentDuration,
            parentId,
            parentIntent,
            parentDuration,
            requiredMinimum,
        });
    }
    // Check upper bound: segment must be < parent (strictly less than)
    if (segmentDuration >= requiredMaximum) {
        violations.push({
            type: 'too-large',
            segmentId,
            segmentIntent,
            segmentDuration,
            parentId,
            parentIntent,
            parentDuration,
            requiredMaximum,
        });
    }
    return {
        isValid: violations.length === 0,
        violations,
    };
}
/**
 * Validates all segments in a lane template against the 1/10th duration rule
 */
export function validateLaneSegmentDurations(lane, templateMap) {
    const violations = [];
    for (const segment of lane.segments) {
        const childTemplate = templateMap.get(segment.templateId);
        if (!childTemplate) {
            // Missing template - this will be caught by other validation
            continue;
        }
        const result = validateSegmentDuration(childTemplate.estimatedDuration, lane.estimatedDuration, childTemplate.id, childTemplate.intent, lane.id, lane.intent);
        if (!result.isValid) {
            violations.push(...result.violations);
        }
    }
    return {
        isValid: violations.length === 0,
        violations,
    };
}
/**
 * Recursively validates that all parent lanes still satisfy the 1/10th rule
 * after a template's duration has changed
 */
export function validateTemplateReferences(template, newDuration, templateMap) {
    const violations = [];
    // Check all lanes that reference this template
    for (const parentRef of template.references) {
        const parentTemplate = templateMap.get(parentRef.parentId);
        if (!parentTemplate || parentTemplate.templateType !== 'lane') {
            continue;
        }
        const requiredMinimum = parentTemplate.estimatedDuration * MINIMUM_DURATION_RATIO;
        const requiredMaximum = parentTemplate.estimatedDuration;
        // Check lower bound
        if (newDuration < requiredMinimum) {
            violations.push({
                type: 'too-small',
                segmentId: template.id,
                segmentIntent: template.intent,
                segmentDuration: newDuration,
                parentId: parentTemplate.id,
                parentIntent: parentTemplate.intent,
                parentDuration: parentTemplate.estimatedDuration,
                requiredMinimum,
            });
        }
        // Check upper bound
        if (newDuration >= requiredMaximum) {
            violations.push({
                type: 'too-large',
                segmentId: template.id,
                segmentIntent: template.intent,
                segmentDuration: newDuration,
                parentId: parentTemplate.id,
                parentIntent: parentTemplate.intent,
                parentDuration: parentTemplate.estimatedDuration,
                requiredMaximum,
            });
        }
        // Recursively check parent's parents
        const parentResult = validateTemplateReferences(parentTemplate, parentTemplate.estimatedDuration, templateMap);
        violations.push(...parentResult.violations);
    }
    return {
        isValid: violations.length === 0,
        violations,
    };
}
/**
 * Validates that a lane's duration change doesn't violate the 1/10th rule
 * for any of its child segments
 */
export function validateLaneDurationChange(lane, newDuration, templateMap) {
    const violations = [];
    const requiredMinimum = newDuration * MINIMUM_DURATION_RATIO;
    const requiredMaximum = newDuration;
    for (const segment of lane.segments) {
        const childTemplate = templateMap.get(segment.templateId);
        if (!childTemplate) {
            continue;
        }
        // Check lower bound
        if (childTemplate.estimatedDuration < requiredMinimum) {
            violations.push({
                type: 'too-small',
                segmentId: childTemplate.id,
                segmentIntent: childTemplate.intent,
                segmentDuration: childTemplate.estimatedDuration,
                parentId: lane.id,
                parentIntent: lane.intent,
                parentDuration: newDuration,
                requiredMinimum,
            });
        }
        // Check upper bound
        if (childTemplate.estimatedDuration >= requiredMaximum) {
            violations.push({
                type: 'too-large',
                segmentId: childTemplate.id,
                segmentIntent: childTemplate.intent,
                segmentDuration: childTemplate.estimatedDuration,
                parentId: lane.id,
                parentIntent: lane.intent,
                parentDuration: newDuration,
                requiredMaximum,
            });
        }
    }
    return {
        isValid: violations.length === 0,
        violations,
    };
}
/**
 * Formats a duration in human-readable form (ms, seconds, minutes, hours)
 */
function formatDuration(ms) {
    if (ms < 1000)
        return `${ms}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000)
        return `${(ms / 60000).toFixed(1)}min`;
    return `${(ms / 3600000).toFixed(1)}hr`;
}
/**
 * Formats validation errors into user-friendly error messages
 */
export function formatDurationViolationErrors(violations) {
    return violations.map(v => {
        if (v.type === 'too-small') {
            return (`Segment "${v.segmentIntent}" (${formatDuration(v.segmentDuration)}) does not meet the minimum ` +
                `duration requirement of 1/10th the duration of parent "${v.parentIntent}" ` +
                `(${formatDuration(v.parentDuration)}). Minimum required: ${formatDuration(v.requiredMinimum)}.`);
        }
        else {
            return (`Segment "${v.segmentIntent}" (${formatDuration(v.segmentDuration)}) is too large for parent ` +
                `"${v.parentIntent}" (${formatDuration(v.parentDuration)}). Segments must be strictly less than ` +
                `their parent's duration (< ${formatDuration(v.requiredMaximum)}).`);
        }
    });
}
