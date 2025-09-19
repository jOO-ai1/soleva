
import React, { ReactNode } from 'react';

interface AppLoaderProps {
  children: ReactNode;
}

const AppLoader: React.FC<AppLoaderProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default AppLoader;
