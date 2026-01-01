import React from 'react';

import { LaneViewPanel } from './LaneViewPanel';
import { Library } from './Library';
import { ListItemLaneViewPanel } from './ListItemLaneViewPanel';

export function App(): React.ReactElement {
  return (
    <>
      <Library />
      <LaneViewPanel />
      <ListItemLaneViewPanel />
    </>
  );
}
