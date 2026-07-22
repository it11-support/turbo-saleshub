import * as React from 'react';

declare global {
  namespace JSX {
    export import Element = React.JSX.Element;
    export import ElementClass = React.JSX.ElementClass;
    export import ElementType = React.JSX.ElementType;
    export import IntrinsicAttributes = React.JSX.IntrinsicAttributes;
    export import IntrinsicClassAttributes = React.JSX.IntrinsicClassAttributes;
    export import IntrinsicElements = React.JSX.IntrinsicElements;
    export import LibraryManagedAttributes = React.JSX.LibraryManagedAttributes;
  }
}
