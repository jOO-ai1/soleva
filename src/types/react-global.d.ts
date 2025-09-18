/// <reference types="react" />
/// <reference types="react-dom" />

declare global {
  namespace React {
    interface ChangeEvent<T = Element> {
      target: T & EventTarget;
    }
    
    interface FormEvent<T = Element> {
      target: T & EventTarget;
    }
    
    interface MouseEvent<T = Element> {
      target: T & EventTarget;
    }
  }
}

export {};
