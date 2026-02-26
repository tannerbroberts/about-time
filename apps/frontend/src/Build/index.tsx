import React, { useEffect } from 'react';

import { Library } from './Library';
import { NotificationManager } from './NotificationManager';
import { useBuildStore } from './store';
import { TemplateEditor } from './TemplateEditor';
import { TemplateForm } from './TemplateForm';

export function Build(): React.ReactElement {
  const isTemplateEditorOpen = useBuildStore((state) => state.isTemplateEditorOpen);
  const loadTemplatesFromAPI = useBuildStore((state) => state.loadTemplatesFromAPI);

  // Load templates from API on mount
  useEffect(() => {
    loadTemplatesFromAPI();
  }, [loadTemplatesFromAPI]);

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
