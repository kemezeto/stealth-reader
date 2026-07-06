/// <reference types="vite/client" />

interface ElectronWebviewTag extends HTMLElement {
  src: string
  preload: string
  allowpopups: string
  getURL: () => string
  reload: () => void
  setZoomFactor: (factor: number) => void
  send: (channel: string, ...args: unknown[]) => void
  addEventListener: HTMLElement['addEventListener']
  removeEventListener: HTMLElement['removeEventListener']
}

declare namespace Electron {
  type WebviewTag = ElectronWebviewTag
}

declare namespace JSX {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<React.HTMLAttributes<ElectronWebviewTag>, ElectronWebviewTag> & {
      src?: string
      preload?: string
      allowpopups?: string | boolean
      ref?: React.Ref<ElectronWebviewTag>
    }
  }
}
