import React from 'react';
import { Terminal } from 'lucide-react';
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';

const Header: React.FC = () => {
  return (
    <div className="flex justify-between items-center mb-4 border-b border-green-500 pb-2">
      <div className="flex items-center">
        <Terminal className="w-6 h-6 mr-2" />
        <span>berathebot</span>
      </div>
      <DynamicWidget/>
    </div>
  );
};

export default Header;