import {
  isWereadHost,
  isWereadReaderPage,
  WEREAD_CRITICAL_SELECTORS,
  WEREAD_READER_EXTRA_CSS,
  WEREAD_TRANSPARENCY_CSS
} from './sites/weread'

export { isWereadReaderPage }

const STABLE_ALPHA = 'rgba(255, 255, 255, 0.01)'

const GENERIC_CRITICAL_SELECTORS = [
  'html',
  'body',
  '#root',
  '#app',
  '#__next',
  '#__nuxt',
  'main'
]

export function getCriticalSelectors(hostname: string): string[] {
  if (isWereadHost(hostname)) {
    return [...new Set([...GENERIC_CRITICAL_SELECTORS, ...WEREAD_CRITICAL_SELECTORS])]
  }
  return GENERIC_CRITICAL_SELECTORS
}

export function buildTransparencyCss(hostname: string): string {
  const generic = `
    :root,
    :root[dark],
    .force-light,
    .force-dark,
    html,
    body {
      --bg: ${STABLE_ALPHA} !important;
      --bg0: ${STABLE_ALPHA} !important;
      --bg1: ${STABLE_ALPHA} !important;
      --bg2: ${STABLE_ALPHA} !important;
      --background: ${STABLE_ALPHA} !important;
      --background-color: ${STABLE_ALPHA} !important;
      --color-background: ${STABLE_ALPHA} !important;
      --bg-color: ${STABLE_ALPHA} !important;
    }

    html,
    body,
    #root,
    #app,
    #__next,
    #__nuxt,
    main,
    nav,
    header,
    footer,
    section,
    article,
    aside,
    div,
    span,
    p,
    ul,
    ol,
    li,
    table,
    tr,
    td,
    th,
    form,
    button,
    label,
    input,
    textarea,
    select {
      background-color: transparent !important;
      background-image: none !important;
      background: transparent !important;
    }

    img,
    picture,
    video,
    canvas,
    svg,
    image {
      background-color: transparent !important;
    }
  `

  if (isWereadHost(hostname)) {
    const readerExtra = isWereadReaderPage(location.pathname) ? `\n${WEREAD_READER_EXTRA_CSS}` : ''
    return `${generic}\n${WEREAD_TRANSPARENCY_CSS}${readerExtra}`
  }

  return generic
}
