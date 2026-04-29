import { stratify, cluster } from 'd3-hierarchy'
import { create } from 'd3-selection'
import { curveBumpX, link } from 'd3-shape'
import type { HierarchyNode } from 'd3-hierarchy'

type Datum = {
  id: string,
  parentId?: string,
  label: string,
  relation: string,
}

type Bounds = {
  x0: number,
  x1: number,
  y0: number,
  y1: number,
}

function calculateBounds(collection: HierarchyNode<Datum>): Bounds {
  let x0 = Number.POSITIVE_INFINITY
  let x1 = Number.NEGATIVE_INFINITY
  let y0 = Number.POSITIVE_INFINITY
  let y1 = Number.NEGATIVE_INFINITY
  collection.each(d => {
    if (d.x! < x0) {
      x0 = d.x!
    }
    if (d.x! > x1) {
      x1 = d.x!
    }
    if (d.y! < y0) {
      y0 = d.y!
    }
    if (d.y! > y1) {
      y1 = d.y!
    }
  })
  return { x0, y0, x1, y1 }
}

/**
 * Helper function to create a d3 tree hierarchy and return the resulting SVG image element.
 * @param element The element to render the hierarchy into, replacing the innerHTML.
 */
function renderHierarchy(data: { parents: Datum[], children: Datum[] }, width: number): SVGSVGElement {

  const svgWidth = width
  const parents = stratify<Datum>().id(d => d.id).parentId(d => d.parentId)(data.parents)
  const children = stratify<Datum>().id(d => d.id).parentId(d => d.parentId)(data.children)

  parents.sort((a, b) => (b.children?.length ?? 0) - (a.children?.length ?? 0))
  children.sort((a, b) => (a.children?.length ?? 0) - (b.children?.length ?? 0))

  // Determine the node sizes used for automatic layout, where the collection height
  // is the height of the tree, rendered horisontally, and is therefore the width
  const nodeHeight = 25
  const nodeWidth = svgWidth / (children.height + parents.height + 3)

  // Create the tree layouts
  const parentTree = cluster<Datum>().nodeSize([ nodeHeight, nodeWidth ])(parents)
  const childTree = cluster<Datum>().nodeSize([ nodeHeight, nodeWidth ])(children)

  parentTree.y = svgWidth / 2

  // Shift the parent tree to the right half of the SVG
  parentTree.each(d => {
    d.y = parentTree.y + d.depth * nodeWidth
  })

  childTree.x = parentTree.x
  childTree.y = parentTree.y

  childTree.each(d => {
    if (d.parent) {
      d.y = childTree.y - d.depth * nodeWidth
    }
  })

  // Determine the bounds of the x coordinated of nodes
  const parentBounds = calculateBounds(parentTree)
  const childBounds = calculateBounds(childTree)

  const svgBounds: Bounds = {
    x0: Math.min(parentBounds.y0, childBounds.y0) - 2 * nodeWidth,
    x1: Math.max(parentBounds.y1, childBounds.y1) + 2 * nodeWidth,
    y0: Math.min(parentBounds.x0, childBounds.x0) - 2 * nodeHeight,
    y1: Math.max(parentBounds.x1, childBounds.x1) + 2 * nodeHeight
  }

  // The image itself may be wider than the to-be-rendered elements,
  // so the remaining space can be added as padding
  const svgPadding = Math.round((svgWidth - svgBounds.x1 + svgBounds.x0) / 2)

  // The height should be based on real dimensions
  const svgHeight = svgBounds.y1 - svgBounds.y0

  const svg = create('svg')
      .attr('viewBox', [ svgBounds.x0 - svgPadding, svgBounds.y0, svgWidth, svgHeight ])
      .attr('width', svgWidth)
      .attr('height', svgHeight)

  const trees = [
    { label: 'Supertypes', color: 'var(--color-supertype)', tree: parentTree, mirrored: false },
    { label: 'Subtypes', color: 'var(--color-subtype)', tree: childTree, mirrored: true }
  ]

  for (const { tree, mirrored } of trees) {

    // Links between nodes
    const path = svg.append('g')
      .selectAll('g')
      .data(tree.links())
      .join('g')

    path.append('path')
      .attr('fill', 'none')
      .attr('stroke', 'currentColor')
      .attr('stroke-opacity', .2)
      .attr('stroke-width', 1)
      .attr('d', link<unknown, HierarchyNode<Datum>>(curveBumpX).x(d => d.y!).y(d => d.x!))

    path.filter(p => p.target.parent !== undefined).append('text')
      .attr('dy', '0.32em')
      .attr('font-size', '0.8rem')
      .attr('opacity', .6)
      .attr('fill', 'currentColor')
      .attr('text-anchor', 'middle')
      .text(d => d.target.data.relation)
      .attr('x', d => d.source.y + (d.target.y - d.source.y) / 2)
      .attr('y', d => d.source.x + (d.target.x - d.source.x) / 2)

    // The actual nodes
    const node = svg.append('g')
      .selectAll('a')
      .data(tree.descendants())
      .join('a')
        .attr('fill', 'currentColor')
        .attr('target', '_blank')
        .attr('transform', d => `translate(${d.y},${d.x})`)
        //.attr('opacity', mirrored ? .5 : 1)
        .attr('xlink:href', d => d.data.id)

    node.append('circle')
      .attr('fill', 'currentColor')
      .attr('r', d => d.parent ? 2 : 4)

    node.append('title')
      .text(d => d.data.id)

    node.filter(n => !mirrored || n.parent != null).append('text')
      .attr('dy', '0.32em')
      .attr('x', d => {
        if (d.parent) {
          if (d.children) {
            return mirrored ? 6 : -6
          } else {
            return mirrored ? -6 : 6
          }
        }
        return 0
      })
      .attr('y', d => d.parent ? 0 : nodeHeight)
      .attr('text-anchor', d => {
        if (!d.parent) {
          return 'middle'
        } else if (d.children) {
          return mirrored ? 'start' : 'end'
        } else {
          return mirrored ? 'end' : 'start'
        }
      })
      .attr('font-weight', d => d.parent ? 'var(--font-weight-normal)' : 'var(--font-weight-bold)')
      .attr('paint-order', 'stroke')
      .attr('fill', 'currentColor')
      .text(d => d.data.label)
  }

  return svg.node()!
}

export { renderHierarchy }
