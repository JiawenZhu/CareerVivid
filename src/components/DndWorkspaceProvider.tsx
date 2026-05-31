import React, { ReactNode } from 'react';
import { DndProvider } from 'react-dnd';
import { MultiBackend, getBackendOptions } from '@minoru/react-dnd-treeview';

interface DndWorkspaceProviderProps {
  children: ReactNode;
}

const DndWorkspaceProvider: React.FC<DndWorkspaceProviderProps> = ({ children }) => (
  <DndProvider backend={MultiBackend} options={getBackendOptions()}>
    {children}
  </DndProvider>
);

export default DndWorkspaceProvider;
