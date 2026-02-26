import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';
import React from 'react';

import type { FocusPathItem } from '../../store';
import { useBuildStore } from '../../store';

export interface InstanceCounterBadgeProps {
  templateId: string;
  currentLineage: FocusPathItem[];
}

export function InstanceCounterBadge({ templateId }: InstanceCounterBadgeProps): React.ReactElement {
  const templates = useBuildStore((state) => state.templates);
  const selectedBaseTemplateId = useBuildStore((state) => state.selectedBaseTemplateId);

  // Count visible instances in current hierarchy
  const countVisibleInstances = (): number => {
    if (!selectedBaseTemplateId) {
      return 0;
    }

    let count = 0;

    const traverse = (id: string, visited: Set<string> = new Set()): void => {
      if (visited.has(id)) {
        return;
      }

      visited.add(id);

      if (id === templateId) {
        count++;
      }

      const template = templates[id] as { segments?: Array<{ templateId: string }> } | undefined;
      if (template?.segments) {
        for (const segment of template.segments) {
          traverse(segment.templateId, visited);
        }
      }
    };

    traverse(selectedBaseTemplateId);
    return count;
  };

  const visibleCount = countVisibleInstances();

  // Total references would come from template.references if implemented
  // For now, we'll just show visible count
  const totalCount = visibleCount; // TODO: Implement references tracking

  return (
    <Badge badgeContent={`${visibleCount} of ${totalCount}`} color="primary">
      <Chip label="Instances" size="small" />
    </Badge>
  );
}
