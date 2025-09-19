
import React, { ReactNode } from 'react';

interface SafeContextProviderProps {
  children: ReactNode;
}

const SafeContextProvider: React.FC<SafeContextProviderProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default SafeContextProvider;