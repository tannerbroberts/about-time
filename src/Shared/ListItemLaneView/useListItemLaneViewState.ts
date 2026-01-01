import { useMemo } from 'react';

import type { LaneTemplate, Template } from '../../App';

import {
  flattenLaneToListItems,
  type ListItem,
} from './flattenLaneToListItems';

interface ListItemLaneViewState {
  items: ListItem[];
}

export function useListItemLaneViewState(
  lane: LaneTemplate,
  allTemplates: Template[],
): ListItemLaneViewState {
  const items = useMemo(
    (): ListItem[] => flattenLaneToListItems(lane, allTemplates).items,
    [lane, allTemplates],
  );

  return { items };
}
