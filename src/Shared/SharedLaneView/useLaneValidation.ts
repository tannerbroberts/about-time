import { useMemo } from 'react';

import type { LaneTemplate, Template } from '../../App';
import { validateLane } from '../../validation/validateLane';
import type { ValidationResult } from '../../validation/validateLane';

export function useLaneValidation(
  lane: LaneTemplate,
  allTemplates: Template[],
): ValidationResult {
  const result = useMemo(
    (): ValidationResult => validateLane(lane, allTemplates),
    [lane, allTemplates],
  );

  return result;
}
