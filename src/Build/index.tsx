import React from 'react';

import { Library } from './Library';
import { BuildProvider } from './Provider';
import { DefaultBuildState, reducer } from './reducer';
import { TemplateForm } from './TemplateForm';
import { loadTemplates, saveTemplates } from './utils/localStorage';

export function Build(): React.ReactElement {
  const [buildState, buildDispatch] = React.useReducer(reducer, DefaultBuildState);

  // Hydrate templates from localStorage on mount
  React.useEffect(() => {
    const templates = loadTemplates();
    buildDispatch({ type: 'HYDRATE_TEMPLATES', templates });
  }, []);

  // Save templates to localStorage whenever they change
  React.useEffect(() => {
    saveTemplates(buildState.templates);
  }, [buildState.templates]);

  const contextValue = React.useMemo(
    () => ({ state: buildState, dispatch: buildDispatch }),
    [buildState, buildDispatch],
  );

  return (
    <BuildProvider value={contextValue}>
      <Library />
      <TemplateForm />
    </BuildProvider>
  );
}
