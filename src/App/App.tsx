import React from 'react';

import { LaneViewPanel } from './LaneViewPanel';
import { Library } from './Library';

export function App(): React.ReactElement {
  return (
    <>
      <Library />
      <LaneViewPanel />
    </>
  );
}
