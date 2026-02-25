import React from 'react';

import { Library } from './Library';
import { NotificationManager } from './NotificationManager';
import { useBuildStore } from './store';
import { TemplateEditor } from './TemplateEditor';
import { TemplateForm } from './TemplateForm';

export function Build(): React.ReactElement {
  const isTemplateEditorOpen = useBuildStore((state) => state.isTemplateEditorOpen);

  return (
    <>
      {isTemplateEditorOpen ? <TemplateEditor /> : (
        <>
          <Library />
          <TemplateForm />
        </>
      )}
      <NotificationManager />
    </>
  );
}
