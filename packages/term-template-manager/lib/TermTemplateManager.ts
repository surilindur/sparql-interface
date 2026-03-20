import type * as RDF from '@rdfjs/types';
import type { IDataset, ITemplateContext, TemplateType } from '@idsm-src/types';
import { datasets as defaultDatasets } from '@idsm-src/term-template-data';
import ejs from 'ejs';
import { version } from '../package.json';

class TermTemplateManager {
  private readonly storage: Storage;
  private readonly datasetCache: Set<IDataset>;

  private static readonly storageVersionKey = 'storageversion';
  private static readonly domParser = new DOMParser();

  public constructor(args: ITermTemplateManagerArgs) {
    this.storage = args.storage;
    this.datasetCache = new Set();
  }

  public static regExpReplacer(key: string, value: unknown): unknown {
    if (key === 'pattern' && value instanceof RegExp) {
      return value.source;
    }
    return value;
  }

  public static regExpReviver(key: string, value: unknown): unknown {
    if (typeof value === 'string' && key === 'pattern') {
      return new RegExp(value, 'u');
    }
    return value;
  }

  /**
   * Save the specified dataset, either as a new one, of by overriding an existing one.
   */
  public saveDataset(dataset: IDataset): void {
    this.datasetCache.clear();
    this.storage.setItem(dataset.description, JSON.stringify(dataset, TermTemplateManager.regExpReplacer));
  }

  /**
   * Load the dataset specified by the key.
   */
  public loadDataset(key: string): IDataset {
    const stringValue = this.storage.getItem(key);
    const dataset: IDataset = JSON.parse(stringValue, TermTemplateManager.regExpReviver);
    return dataset;
  }

  /**
   * Reset the set of saved datasets to defaults.
   */
  public resetDatasets(): void {
    this.storage.clear();
    for (const dataset of defaultDatasets) {
      this.saveDataset(dataset);
    }
    this.storage.setItem(TermTemplateManager.storageVersionKey, '-1');
  }

  /**
   * List all datasets saved in storage.
   */
  public listDatasets(): Set<IDataset> {
    if (!this.datasetCache.size) {
      if (this.storage.getItem(TermTemplateManager.storageVersionKey) !== version) {
        this.resetDatasets();
      }
      for (let index = 0; index < this.storage.length; index++) {
        const key = this.storage.key(index);
        if (key && key !== TermTemplateManager.storageVersionKey) {
          try {
            this.datasetCache.add(this.loadDataset(key));
          }
          catch {
            this.storage.removeItem(key);
          }
        }
      }
    }
    return this.datasetCache;
  }

  /**
   * Find templates applicable to the specified RDF Term,
   * and order them by relevance (shorter match = more relevant).
   */
  public findTemplates(term: RDF.Term, type: TemplateType, limit: number): { endpoint: string; template: string }[] {
    const termTemplates: { endpoint: string; template: string; relevance: number }[] = [];
    for (const dataset of this.listDatasets()) {
      if (dataset.pattern.test(term.value)) {
        for (const template of dataset.templates) {
          const match = template.pattern.exec(term.value);
          if (template.type === type && match) {
            termTemplates.push({
              endpoint: dataset.endpoint,
              relevance: match[0].length,
              template: template.content
            });
          }
        }
      }
    }
    termTemplates.sort((match1, match2) => match2.relevance - match1.relevance);
    return termTemplates.slice(0, limit);
  }

  /**
   * Helper function to render a template, without having to import ejs elsewhere.
   */
  public static render(template: string, context: ITemplateContext): Promise<string> {
    return ejs.render(template, context, { async: true });
  }
}

interface ITermTemplateManagerArgs {
  /**
   * The storage to use for the templates.
   */
  storage: Storage;
}

export { TermTemplateManager };
