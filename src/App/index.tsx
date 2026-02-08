import React from 'react';

import { Header } from './Header';
import { SidePanel } from './SidePanel';

export function App(): React.ReactElement {
  return (
    <>
      <SidePanel />
      <Header />
    </>
  );
}
