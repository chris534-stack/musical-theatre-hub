'use client';

// This is a workaround for a known issue with react-beautiful-dnd and React 18 Strict Mode.
// See: https://github.com/atlassian/react-beautiful-dnd/issues/2396
import { useEffect, useState } from 'react';
import { Droppable, type DroppableProps } from 'react-beautiful-dnd';

export const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) {
    return null;
  }
  return <Droppable {...props}>{children}</Droppable>;
};
