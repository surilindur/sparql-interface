import { ITemplate } from '@idsm-src/types';

interface ITemplateDeclaration {
  detailed?: string;
  inline?: string;
  pattern: RegExp;
}

/**
 * Helper function to split template declarations into individual templates.
 */
const splitTemplateDeclarations = (declarations: ITemplateDeclaration[]): ITemplate[] => {
  const templates: ITemplate[] = [];
  for (const declaration of declarations) {
    if (declaration.detailed) {
      templates.push({
        content: declaration.detailed,
        pattern: declaration.pattern,
        type: 'detailed'
      });
    }
    if (declaration.inline) {
      templates.push({
        content: declaration.inline,
        pattern: declaration.pattern,
        type: 'inline'
      });
    }
  }
  return templates;
};

export { type ITemplateDeclaration, splitTemplateDeclarations };
