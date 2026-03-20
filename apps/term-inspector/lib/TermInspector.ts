import type * as RDF from '@rdfjs/types';
import { ITemplateContext, TemplateType } from '@idsm-src/types';
import { DataFactory } from 'rdf-data-factory';
import { QueryRunner } from '@idsm-src/query-runner';
import { TermTemplateManager } from '@idsm-src/term-templates';
import { visualiseTypeHierarchy } from '@idsm-src/visualisations';

class TermInspector {
  private readonly root: Element;
  private readonly dataFactory: RDF.DataFactory;
  private readonly queryRunner: QueryRunner;
  private readonly templateManager: TermTemplateManager;

  private static readonly updatingClass = 'updating';

  public constructor(args: ITermInspectorArgs) {
    this.root = args.root;
    this.dataFactory = new DataFactory();
    this.queryRunner = new QueryRunner({
      batchInterval: 200,
      cacheMaxAge: 60 * 5 * 1_000,
      cacheMaxSize: 10_000
    });
    this.templateManager = new TermTemplateManager({
      storage: sessionStorage
    });
    window.navigation.addEventListener('navigate', (event: NavigateEvent) => {
      if (event.canIntercept) {
        const handler = () => this.updateVisualisation(event);
        event.intercept({ handler });
      }
    });
  }

  public adjustHyperlinks(root: Element): void {
    const url = new URL(window.location.href);
    for (const link of root.getElementsByTagName('a')) {
      if (link.rel !== 'external') {
        url.searchParams.set('term', link instanceof SVGAElement ? link.href.baseVal : link.href);
        link.setAttribute('href', url.href);
      }
      else {
        link.setAttribute('target', '_blank');
      }
    }
  }

  public async updateVisualisation(event?: NavigateEvent): Promise<void> {
    this.root.classList.add(TermInspector.updatingClass);
    try {
      for (const child of [...this.root.children]) {
        child.remove();
      }
      const location = new URL(event?.destination?.url ?? window.location.href);
      const termUrl = new URL(location.searchParams.get('term'));
      const term = this.dataFactory.namedNode(termUrl.href);
      const outputString = await this.visualiseTermRecursive(term, 'detailed');
      const outputTree = Document.parseHTMLUnsafe(outputString);
      this.adjustHyperlinks(outputTree.body);
      console.log(outputTree.body);
      for (const node of [...outputTree.body.children]) {
        this.root.appendChild(node);
      }
    }
    catch (error: unknown) {
      const pre = document.createElement('pre');
      pre.classList.add('error');
      pre.textContent = `${error}`;
      this.root.appendChild(pre);
    }
    this.root.classList.remove(TermInspector.updatingClass);
  }

  public async visualiseTermRecursive(term: RDF.Term, type: TemplateType): Promise<string> {
    const limit = type === 'inline' ? 1 : Number.POSITIVE_INFINITY;
    const templates = this.templateManager.findTemplates(term, type, limit);
    const promises: Promise<string>[] = [];
    const rootStyle = getComputedStyle(this.root);
    const rootWidth = this.root.clientWidth - Number.parseFloat(rootStyle.paddingLeft) - Number.parseFloat(rootStyle.paddingRight);

    for (const template of templates) {
      const context: ITemplateContext = {
        entity: term,
        queryAsk: (query, bindings) => this.queryRunner.queryAsk(template.endpoint, query, bindings ?? []),
        querySelectAll: (query, bindings) => this.queryRunner.querySelect(template.endpoint, query, bindings ?? []),
        querySelectFirst: async (query, bindings) => (await this.queryRunner.querySelect(template.endpoint, query, bindings ?? [])).at(0),
        visualise: (entity: RDF.Term) => this.visualiseTermRecursive(entity, 'inline'),
        visualiseTypes: (entity: RDF.Term) => visualiseTypeHierarchy(rootWidth, { entity, ...context })
      };
      promises.push(TermTemplateManager.render(template.template, context));
    }

    return (await Promise.all(promises)).join('');
  }
}

interface ITermInspectorArgs {
  /**
   * The element that the inspector should operate in.
   */
  root: Element;
}

export { TermInspector };
