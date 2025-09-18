// Module declarations for packages that don't have proper types
declare module 'framer-motion' {
  import * as React from 'react';

  export interface MotionProps {
    children?: React.ReactNode;
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    whileHover?: any;
    whileTap?: any;
    whileInView?: any;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }

  export const motion: {
    div: React.ComponentType<MotionProps>;
    button: React.ComponentType<MotionProps>;
    span: React.ComponentType<MotionProps>;
    p: React.ComponentType<MotionProps>;
    h1: React.ComponentType<MotionProps>;
    h2: React.ComponentType<MotionProps>;
    h3: React.ComponentType<MotionProps>;
    img: React.ComponentType<MotionProps>;
    [key: string]: React.ComponentType<MotionProps>;
  };

  export const AnimatePresence: React.ComponentType<{
    children: React.ReactNode;
    mode?: string;
    [key: string]: any;
  }>;
}

declare module 'react-router-dom' {
  import * as React from 'react';

  export interface Location {
    pathname: string;
    search: string;
    hash: string;
    state: any;
    key: string;
  }

  export function useLocation(): Location;
  export function useNavigate(): (path: string, options?: any) => void;
  export function useParams(): Record<string, string>;
  export function useSearchParams(): [URLSearchParams, (params: URLSearchParams) => void];

  export const BrowserRouter: React.ComponentType<{children: React.ReactNode;}>;
  export const Routes: React.ComponentType<{children: React.ReactNode;}>;
  export const Route: React.ComponentType<{
    path: string;
    element: React.ReactNode;
    index?: boolean;
  }>;
  export const Link: React.ComponentType<{
    to: string;
    children: React.ReactNode;
    className?: string;
    [key: string]: any;
  }>;
  export const Navigate: React.ComponentType<{
    to: string;
    replace?: boolean;
  }>;
  export const Outlet: React.ComponentType;
}