declare module 'cytoscape-cola' {
  import cytoscape from 'cytoscape'
  const extension: (cy: typeof cytoscape) => void

  // eslint-disable-next-line import/no-default-export
  export default extension
}

declare module 'cytoscape-layout-utilities' {
  import cytoscape from 'cytoscape'
  const extension: (cy: typeof cytoscape) => void

  // eslint-disable-next-line import/no-default-export
  export default extension
}
