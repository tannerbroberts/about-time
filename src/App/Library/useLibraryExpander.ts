import { useCallback, useState } from 'react';

interface LibraryExpanderState {
  isExpanded: boolean;
  toggle: () => void;
}

export function useLibraryExpander(): LibraryExpanderState {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const toggle = useCallback((): void => {
    setIsExpanded((prev) => !prev);
  }, []);

  return {
    isExpanded,
    toggle,
  };
}
