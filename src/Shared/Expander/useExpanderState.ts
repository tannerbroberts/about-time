import { useCallback, useState } from 'react';

interface ExpanderState {
  isExpanded: boolean;
  toggle: () => void;
}

export function useExpanderState(initialExpanded: boolean = true): ExpanderState {
  const [isExpanded, setIsExpanded] = useState<boolean>(initialExpanded);

  const toggle = useCallback((): void => {
    setIsExpanded((prev) => !prev);
  }, []);

  return {
    isExpanded,
    toggle,
  };
}
