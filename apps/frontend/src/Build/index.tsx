import React, { useEffect } from 'react';

import { Library } from './Library';
import { LibraryBrowser } from './LibraryBrowser';
import { NotificationManager } from './NotificationManager';
import { PublicLibrary } from './PublicLibrary';
import { useBuildStore } from './store';
import { TemplateEditor } from './TemplateEditor';
import { TemplateForm } from './TemplateForm';
import { CreateCompositeDialog } from './VariableEditor/CreateCompositeDialog';

export function Build(): React.ReactElement {
  const isTemplateEditorOpen = useBuildStore((state) => state.isTemplateEditorOpen);
  const isCompositeDialogOpen = useBuildStore((state) => state.isCompositeDialogOpen);
  const loadTemplatesFromAPI = useBuildStore((state) => state.loadTemplatesFromAPI);
  const closeCompositeDialog = useBuildStore((state) => state.closeCompositeDialog);
  const createComposite = useBuildStore((state) => state.createComposite);

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
      <LibraryBrowser />
      <PublicLibrary />
      <CreateCompositeDialog
        open={isCompositeDialogOpen}
        onClose={closeCompositeDialog}
        onSave={createComposite}
      />
      <NotificationManager />
    </>
  );
}
