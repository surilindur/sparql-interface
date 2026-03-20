import { axisBottom, axisLeft } from 'd3-axis';
import { scaleBand, scaleLinear } from 'd3-scale';
import { create } from 'd3-selection';

type Datum = {
  mz: number;
  intensity: number;
};

type Dimensions = {
  width: number;
  height: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
};

function calculateDataDimensions(data: Datum[]): Dimensions {
  let x0 = Number.POSITIVE_INFINITY;
  let x1 = Number.NEGATIVE_INFINITY;
  let y0 = Number.POSITIVE_INFINITY;
  let y1 = Number.NEGATIVE_INFINITY;

  for (const datum of data) {
    if (datum.intensity > y1) {
      y1 = datum.intensity;
    }
    if (datum.intensity < y0) {
      y0 = datum.intensity;
    }
    if (datum.mz < x0) {
      x0 = datum.mz;
    }
    if (datum.mz > x1) {
      x1 = datum.mz;
    }
  }

  return { width: x1 - x0, height: y1 - y0, x0, x1, y0, y1 };
}

function renderSpectrum(data: { peaks: Datum[] }, width: number): SVGSVGElement {
  const dimesions = calculateDataDimensions(data.peaks);

  const svgWidth = width;
  const svgHeight = Math.min(0.25, (dimesions.height / dimesions.width)) * svgWidth;

  const marginX = svgWidth / 10;
  const marginY = svgHeight / 10;

  const x = scaleBand()
    .domain(data.peaks.map(d => d.mz.toFixed(2))) // descending frequency
    .range([marginX, svgWidth - marginX]);

  const y = scaleLinear()
    .domain([0, dimesions.height])
    .range([svgHeight - marginY, marginY]);

  const svg = create('svg')
    .attr('width', svgWidth)
    .attr('height', svgHeight)
    .attr('viewBox', [0, 0, svgWidth, svgHeight]);

  svg.append('g')
    .selectAll()
    .data(data.peaks)
    .join('rect')
    .attr('fill', 'var(--color-secondary)')
    .attr('x', d => x(d.mz.toFixed(2)))
    .attr('y', d => y(d.intensity))
    .attr('height', d => y(0) - y(d.intensity))
    .attr('width', x.bandwidth())
    .append('title')
    .text(d => `${d.intensity} @ ${d.mz} m/z`);

  svg.append('g')
    .attr('transform', `translate(0,${svgHeight - marginY / 1.5})`)
    .call(axisBottom(x).tickValues(x.domain().filter((_, index) => (index === 0 || index === data.peaks.length - 1))).tickSizeOuter(0))
    .call(g => g.select('.domain').remove())
    .call(g => g.attr('font-size', null).attr('font-family', null))
    .call(g => g.append('text')
      .attr('x', svgWidth / 2)
      .attr('y', marginY / 2)
      .attr('fill', 'currentColor')
      .attr('text-anchor', 'start')
      .text('m/z'));

  svg.append('g')
    .attr('transform', `translate(${marginX / 1.1},0)`)
    .call(axisLeft(y).tickValues([dimesions.y0, dimesions.y1]))
    .call(g => g.select('.domain').remove())
    .call(g => g.attr('font-size', null).attr('font-family', null))
    .call(g => g.append('text')
      .attr('x', -marginX / 2)
      .attr('y', svgHeight / 2)
      .attr('fill', 'currentColor')
      .attr('text-anchor', 'start')
      .text('Intensity'));

  return <SVGSVGElement> svg.node();
}

async function renderSpectrumPlots(root: Element): Promise<void> {
  for (const element of root.getElementsByClassName('spectrum')) {
    try {
      // Example: 'https://idsm.elixir-czech.cz/chemweb/isdb/compound/spectrum?id=WBNWCFFNNHMAIO-P'
      const url = new URL((<HTMLElement>element).dataset.source);
      const response = await fetch(url, { headers: { accept: 'application/json' } });
      const data = await response.json();
      const style = getComputedStyle(element);
      const width = element.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight);
      const chart = renderSpectrum(data, width);
      element.appendChild(chart);
    }
    catch (error: unknown) {
      element.innerHTML = `<pre class="error">${error}</pre>`;
    }
  }
}

export { renderSpectrumPlots };
