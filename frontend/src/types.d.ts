/// <reference types="react" />

declare namespace React {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      className?: string;
      [key: string]: any;
    }
  }