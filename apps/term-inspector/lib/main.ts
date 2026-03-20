import { TermInspector } from './TermInspector';

const onContentLoaded = (): void => {
  const inspector = new TermInspector({
    root: document.getElementsByTagName('main').item(0)
  });
  inspector.updateVisualisation();
};

document.addEventListener('DOMContentLoaded', onContentLoaded);
