/// <reference types="react" />
/// <reference types="react-dom" />

// Ensure React types are properly available
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Re-export React types to ensure they're available
export * from 'react';
export * from 'react-dom';