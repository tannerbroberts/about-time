import React from 'react';

import { Library } from './Library';
import { useBuildStore } from './store';
import { TemplateEditor } from './TemplateEditor';
import { TemplateForm } from './TemplateForm';

export function Build(): React.ReactElement {
  const isTemplateEditorOpen = useBuildStore((state) => state.isTemplateEditorOpen);

  if (isTemplateEditorOpen) {
    return <TemplateEditor />;
  }

  return (
    <>
      <Library />
      <TemplateForm />
    </>
  );
}
