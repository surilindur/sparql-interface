import type * as RDF from '@rdfjs/types';
import { stratify, cluster } from 'd3-hierarchy';
import { create } from 'd3-selection';
import { curveBumpX, link, line } from 'd3-shape';
import type { HierarchyNode } from 'd3-hierarchy';
import type { ITemplateContext } from '@idsm-src/types';

interface Datum {
  id: string;
  parentId?: string;
  label: string;
  relation: string;
};

interface Bounds {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
};

function calculateBounds(collection: HierarchyNode<Datum>): Bounds {
  let x0 = Number.POSITIVE_INFINITY;
  let x1 = Number.NEGATIVE_INFINITY;
  let y0 = Number.POSITIVE_INFINITY;
  let y1 = Number.NEGATIVE_INFINITY;
  collection.each((d) => {
    if (d.x !== undefined && d.x < x0) {
      x0 = d.x;
    }
    if (d.x !== undefined && d.x > x1) {
      x1 = d.x;
    }
    if (d.y !== undefined && d.y < y0) {
      y0 = d.y;
    }
    if (d.y !== undefined && d.y > y1) {
      y1 = d.y;
    }
  });
  return { x0, y0, x1, y1 };
}

/**
 * Helper function to create a d3 tree hierarchy and return the resulting SVG image element.
 * @param element The element to render the hierarchy into, replacing the innerHTML.
 */
function renderTypeHierarchy(data: { parents: Datum[]; children: Datum[] }, width: number): SVGSVGElement {
  const svgWidth = width;
  const parents = stratify<Datum>().id(d => d.id).parentId(d => d.parentId)(data.parents);
  const children = stratify<Datum>().id(d => d.id).parentId(d => d.parentId)(data.children);

  parents.sort((a, b) => (b.children?.length ?? 0) - (a.children?.length ?? 0));
  children.sort((a, b) => (a.children?.length ?? 0) - (b.children?.length ?? 0));

  // Determine the node sizes used for automatic layout, where the collection height
  // is the height of the tree, rendered horisontally, and is therefore the width
  const nodeHeight = 30;
  const nodeWidth = svgWidth / (children.height + parents.height + 3);

  // Create the tree layouts
  const parentTree = cluster<Datum>().nodeSize([nodeHeight, nodeWidth])(parents);
  const childTree = cluster<Datum>().nodeSize([nodeHeight, nodeWidth])(children);

  parentTree.y = svgWidth / 2;

  // Shift the parent tree to the right half of the SVG
  parentTree.each((d) => {
    d.y = parentTree.y + d.depth * nodeWidth;
  });

  childTree.x = parentTree.x;
  childTree.y = parentTree.y;

  childTree.each((d) => {
    if (d.parent) {
      d.y = childTree.y - d.depth * nodeWidth;
    }
  });

  // Determine the bounds of the x coordinated of nodes
  const parentBounds = calculateBounds(parentTree);
  const childBounds = calculateBounds(childTree);

  const svgBounds: Bounds = {
    x0: Math.min(parentBounds.y0, childBounds.y0) - 2 * nodeWidth,
    x1: Math.max(parentBounds.y1, childBounds.y1) + 2 * nodeWidth,
    y0: Math.min(parentBounds.x0, childBounds.x0) - 2 * nodeHeight,
    y1: Math.max(parentBounds.x1, childBounds.x1) + 2 * nodeHeight
  };

  // The image itself may be wider than the to-be-rendered elements,
  // so the remaining space can be added as padding
  const svgPadding = Math.round((svgWidth - svgBounds.x1 + svgBounds.x0) / 2);

  // The height should be based on real dimensions
  const svgHeight = svgBounds.y1 - svgBounds.y0;

  // Arrows at the end of the lines
  const arrowSize = 10;

  const svg = create('svg')
    .attr('viewBox', [svgBounds.x0 - svgPadding, svgBounds.y0, svgWidth, svgHeight])
    .attr('width', svgWidth)
    .attr('height', svgHeight);

  const defs = svg.append('defs');

  defs.append('marker')
    .attr('id', 'subclass-arrow')
    .attr('viewBox', [-1, -1, arrowSize + 2, arrowSize + 2])
    .attr('refX', arrowSize)
    .attr('refY', arrowSize / 2)
    .attr('markerWidth', arrowSize)
    .attr('markerHeight', arrowSize)
    .attr('orient', 'auto-start-reverse')
    .attr('fill', 'none')
    .attr('stroke', 'currentColor')
    .attr('stroke-width', 1)
    .append('path')
    .attr('d', line()([
      [0, arrowSize / 2],
      [0, 0],
      [arrowSize, arrowSize / 2],
      [0, arrowSize],
      [0, arrowSize / 2]
    ]));

  const trees = [
    { tree: parentTree, mirrored: false },
    { tree: childTree, mirrored: true }
  ];

  for (const { tree, mirrored } of trees) {
    // Links between nodes
    const path = svg.append('g')
      .selectAll('g')
      .data(tree.links())
      .join('g');

    path.append('path')
      .attr('fill', 'none')
      .attr('stroke', 'currentColor')
      .attr('opacity', 0.2)
      .attr('stroke-width', 1)
      .attr(`marker-${mirrored ? 'start' : 'end'}`, 'url(#subclass-arrow)')
      .attr('d', link<unknown, HierarchyNode<Datum>>(curveBumpX).x(d => (<number>d.y) - (arrowSize / 2) * (d.children ? 1 : 0)).y(d => <number>d.x));

    path.filter(p => p.target.parent !== undefined).append('text')
      .attr('dy', '0.32em')
      .attr('font-size', '0.8rem')
      .attr('opacity', 0) // hide the text as requested
      .attr('fill', 'currentColor')
      .attr('text-anchor', 'middle')
      .text(d => d.target.data.relation)
      .attr('x', d => d.source.y + (d.target.y - d.source.y) / 2)
      .attr('y', d => d.source.x + (d.target.x - d.source.x) / 2);

    // The actual nodes
    const node = svg.append('g')
      .selectAll('a')
      .data(tree.descendants())
      .join('a')
      .attr('fill', 'currentColor')
      .attr('transform', d => `translate(${d.y},${d.x})`)
    // .attr('opacity', mirrored ? .5 : 1)
      .attr('href', d => d.data.id);

    node.append('circle')
      .attr('fill', 'currentColor')
      .attr('r', d => d.parent ? 2 : 4);

    node.append('title')
      .text(d => d.data.id);

    node.filter(n => !mirrored || n.parent != null).append('text')
      .attr('dy', '0.32em')
      .attr('x', (d) => {
        if (d.parent) {
          if (d.children) {
            return mirrored ? 6 : -6 - arrowSize - 2;
          }
          else {
            return mirrored ? -6 : 6;
          }
        }
        return 0;
      })
      .attr('y', d => d.parent ? 0 : nodeHeight / 2)
      .attr('text-anchor', (d) => {
        if (!d.parent) {
          return 'middle';
        }
        else if (d.children) {
          return mirrored ? 'start' : 'end';
        }
        else {
          return mirrored ? 'end' : 'start';
        }
      })
      .attr('font-weight', d => d.parent ? 'normal' : 'bold')
      .attr('paint-order', 'stroke')
      .attr('fill', 'currentColor')
      .text(d => d.data.label);
  }

  return <SVGSVGElement> svg.node();
}

async function collectTypeHierarchy(context: ITemplateContext): Promise<{ parents: Datum[]; children: Datum[] }> {
  const entitiesWithoutLabels = [context.entity];

  const parents: Record<string, Datum> = {
    [context.entity.value]: {
      id: context.entity.value,
      label: context.entity.value,
      relation: 'entity'
    }
  };

  const hasDirectSuperClass = await context.queryAsk(`
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      ASK WHERE {
        ?entity rdfs:subClassOf ?other .
      }
    `, [{ entity: context.entity }]);

  const hasDirectSubClass = await context.queryAsk(`
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      ASK WHERE {
        ?other rdfs:subClassOf ?entity .
      }
    `, [{ entity: context.entity }]);

  let types: { value: RDF.Term }[] = [{ value: context.entity }];

  // The term is not a class by itself, and thus might have types
  if (!hasDirectSubClass && !hasDirectSuperClass) {
    types = <{ value: RDF.Term }[]> await context.querySelectAll(`
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?value WHERE {
          ?entity rdf:type ?value .
          FILTER(!STRSTARTS(STR(?value), "http://blank/"))
        }
      `, [{ entity: context.entity }]);

    for (const bindings of types) {
      parents[bindings.value.value] = {
        id: bindings.value.value,
        label: bindings.value.value,
        parentId: context.entity.value,
        relation: 'type'
      };
      entitiesWithoutLabels.push(bindings.value);
    }
  }

  const children = { ...parents };

  if (types.length > 0 && types.length < 10) {
    const superTypes = await context.querySelectAll(`
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?type ?value WHERE {
          ?type rdfs:subClassOf ?value .
          FILTER(?type != ?value && !STRSTARTS(STR(?value), "http://blank/"))
        }
      `, types.map(t => ({ type: t.value })));

    for (const bindings of superTypes) {
      parents[bindings.value.value] = {
        id: bindings.value.value,
        label: bindings.value.value,
        parentId: bindings.type.value,
        relation: 'supertype'
      };
      entitiesWithoutLabels.push(bindings.value);
    }

    const subTypes = await context.querySelectAll(`
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?type ?value WHERE {
          ?value rdfs:subClassOf ?type .
          FILTER(?type != ?value && !STRSTARTS(STR(?value), "http://blank/"))
        }
      `, types.map(t => ({ type: t.value })));

    for (const bindings of subTypes) {
      children[bindings.value.value] = {
        id: bindings.value.value,
        label: bindings.value.value,
        parentId: bindings.type.value,
        relation: 'subtype'
      };
      entitiesWithoutLabels.push(bindings.value);
    }

    const labels = await context.querySelectAll(`
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX sio: <http://semanticscience.org/resource/>
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

        SELECT DISTINCT ?entity ?label WHERE {
          ?entity rdfs:label|skos:prefLabel|sio:SIO_000300 ?label .
          
        }
      `, entitiesWithoutLabels.map(e => ({ entity: e })));

    for (const bindings of labels) {
      if (parents[bindings.entity.value]) {
        parents[bindings.entity.value].label = bindings.label.value;
      }
      if (children[bindings.entity.value]) {
        children[bindings.entity.value].label = bindings.label.value;
      }
    }
  }

  return { parents: Object.values(parents), children: Object.values(children) };
}

async function visualiseTypeHierarchy(width: number, context: ITemplateContext): Promise<string | undefined> {
  const data = await collectTypeHierarchy(context);
  const svg = renderTypeHierarchy(data, width);
  return svg.outerHTML;
}

export { visualiseTypeHierarchy };
