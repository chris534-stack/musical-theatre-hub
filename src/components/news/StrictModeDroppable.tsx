'use client';

// This is a workaround for a known issue with react-beautiful-dnd and React 18 Strict Mode.
// See: https://github.com/atlassian/react-beautiful-dnd/issues/2396
import { useEffect, useState } from 'react';
import { Droppable, type DroppableProps } from 'react-beautiful-dnd';

export const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }
  
  return <Droppable {...props}>{children}</Droppable>;
};
