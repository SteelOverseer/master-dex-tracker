import 'react'

// <selectedcontent> mirrors the chosen <option> inside a customizable select.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      selectedcontent: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}
