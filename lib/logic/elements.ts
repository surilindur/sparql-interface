import { LRUCache } from 'lru-cache'

const svgCache = new LRUCache<string, Element>({ max: 10_000 })

/**
 * Helper function to add the target and title properties to links.
 */
function updateLinkProperties(element: Element): void {
  for (const link of element.getElementsByTagName('a')) {
    const href = link.getAttribute('href')
    if (href) {
      link.setAttribute('title', href)
      link.setAttribute('target', '_blank')
    }
  }
}

/**
 * Helper function to inline all vector images under the specified element,
 * and perform fixes to stroke styling to ensure the images respect browser colour scheme.
 * The images are expected to have been defined as such:
 * 
 * <svg data-source="url"></svg>
 * 
 * This prevents the loading of images by the browser, as those would be replaced by the code here anyway.
 * This is a workaround for SVG styling, because SVG elements inside <img> cannot be styles.
 */
async function inlineVectorImages(element: Element): Promise<void> {
  for (const placeholder of element.getElementsByTagName('svg')) {
    const source = placeholder.dataset.source
    if (source?.includes('svg')) {
      let result = <Element | undefined> svgCache.get(source)?.cloneNode(true)
      if (!result) {
        try {
          result = await processVectorImage(source)
        } catch (error: unknown) {
          result = document.createElement('pre')
          result.classList.add('error')
          result.innerHTML = `${error}`
        }
        svgCache.set(source, result)
      }
      placeholder.parentElement!.insertBefore(result, placeholder)
      placeholder.remove()
    }
  }
}

async function processVectorImage(source: string): Promise<SVGSVGElement> {
  const response = await fetch(source, { headers: { accept: 'image/svg+xml' } })

  if (!response.ok) {
    throw new Error(`${response.status}: ${source}`)
  }

  const svgText = await response.text()
  const parser = new DOMParser()
  const svg = parser.parseFromString(svgText, 'image/svg+xml')

  for (const desc of svg.getElementsByTagName('desc')) {
    desc.remove()
  }

  for (const rect of svg.getElementsByTagName('rect')) {
    rect.remove()
  }

  for (const g of svg.getElementsByTagName('g')) {
    if (g.hasAttribute('stroke')) {
      g.setAttribute('stroke', 'currentColor')
    }
  }

  for (const path of svg.getElementsByTagName('path')) {
    if (path.hasAttribute('stroke')) {
      if (path.getAttribute('stroke') !== 'none') {
        path.setAttribute('stroke', 'currentColor')
      } else if (!path.hasAttribute('fill') || path.getAttribute('fill') == '#000000') {
        path.setAttribute('fill', 'currentColor')
      }
    }
  }

  return <SVGSVGElement><unknown>svg.documentElement
}

export { inlineVectorImages, updateLinkProperties }
