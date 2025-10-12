'use client';

import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onRotate: () => void;
  onDelete: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onRotate, onDelete }) => {
  return (
    <div className="absolute bg-white shadow-lg rounded-md p-1 flex items-center space-x-1 z-20" style={{ left: x, top: y }}>
      <button onClick={onRotate} title="回転" className="p-2 rounded-md hover:bg-gray-200">Rot</button>
      <button onClick={onDelete} title="削除" className="p-2 rounded-md hover:bg-gray-200 text-red-600">Del</button>
    </div>
  );
};
export default ContextMenu;
