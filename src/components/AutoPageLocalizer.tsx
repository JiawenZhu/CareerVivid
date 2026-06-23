import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const ATTRIBUTES_TO_LOCALIZE = ['aria-label', 'title', 'placeholder', 'alt'] as const;

const SKIP_SELECTOR = [
  'code',
  'pre',
  'script',
  'style',
  'textarea',
  'input',
  'select',
  'option',
  'svg',
  'canvas',
  '[contenteditable="true"]',
  '[data-no-auto-translate]',
  '[data-resume-preview-root="true"]',
  '[data-resume-export-root="true"]',
  '.pdf-preview-viewport',
  '.pdf-export-page',
  '.pdf-measurement-sheet',
].join(',');

type LocalizedTextState = {
  source: string;
  translated: string;
};

const textNodeState = new WeakMap<Text, LocalizedTextState>();

const normalizeAutoText = (value: string): string =>
  value
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();

const hashAutoText = (value: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `k_${(hash >>> 0).toString(36)}`;
};

const shouldSkipElement = (element: Element | null): boolean =>
  !element || !!element.closest(SKIP_SELECTOR);

const translateValue = (value: string, t: TFunction, language: string): string => {
  if (!value || language.startsWith('en')) return value;

  const source = normalizeAutoText(value);
  if (!source || !/[A-Za-z]/.test(source)) return value;

  const translated = t(`auto_text.${hashAutoText(source)}`, { defaultValue: source });
  if (!translated || translated === source) return value;

  const leadingWhitespace = value.match(/^\s*/)?.[0] ?? '';
  const trailingWhitespace = value.match(/\s*$/)?.[0] ?? '';
  return `${leadingWhitespace}${translated}${trailingWhitespace}`;
};

const localizeTextNode = (node: Text, t: TFunction, language: string): void => {
  const parent = node.parentElement;
  if (shouldSkipElement(parent)) return;

  const current = node.nodeValue ?? '';
  const previous = textNodeState.get(node);
  const source = previous && (current === previous.translated || current === previous.source)
    ? previous.source
    : current;

  const translated = translateValue(source, t, language);
  textNodeState.set(node, { source, translated });

  if (current !== translated) {
    node.nodeValue = translated;
  }
};

const originalAttributeName = (attribute: string): string =>
  `data-cv-i18n-source-${attribute.replace(/[^a-z0-9-]/gi, '-')}`;

const translatedAttributeName = (attribute: string): string =>
  `data-cv-i18n-translated-${attribute.replace(/[^a-z0-9-]/gi, '-')}`;

const localizeElementAttributes = (element: Element, t: TFunction, language: string): void => {
  if (shouldSkipElement(element)) return;

  ATTRIBUTES_TO_LOCALIZE.forEach((attribute) => {
    const current = element.getAttribute(attribute);
    if (!current) return;

    const originalName = originalAttributeName(attribute);
    const translatedName = translatedAttributeName(attribute);
    const previousSource = element.getAttribute(originalName);
    const previousTranslated = element.getAttribute(translatedName);
    const source = previousSource && (current === previousSource || current === previousTranslated)
      ? previousSource
      : current;

    const translated = translateValue(source, t, language);
    element.setAttribute(originalName, source);
    element.setAttribute(translatedName, translated);

    if (current !== translated) {
      element.setAttribute(attribute, translated);
    }
  });
};

const walkTextNodes = (root: ParentNode, t: TFunction, language: string): void => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    localizeTextNode(node as Text, t, language);
    node = walker.nextNode();
  }
};

const localizeTree = (root: ParentNode, t: TFunction, language: string): void => {
  walkTextNodes(root, t, language);

  if (root instanceof Element) {
    localizeElementAttributes(root, t, language);
  }

  root.querySelectorAll?.('*').forEach((element) => {
    localizeElementAttributes(element, t, language);
  });
};

const AutoPageLocalizer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || 'en';

  const runLocalizer = useCallback(() => {
    if (typeof document === 'undefined' || !document.body) return;
    localizeTree(document.body, t, language);
  }, [language, t]);

  useEffect(() => {
    runLocalizer();

    if (typeof MutationObserver === 'undefined' || !document.body) return undefined;

    let frameId = 0;
    const scheduleLocalizer = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        runLocalizer();
      });
    };

    const observer = new MutationObserver(scheduleLocalizer);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRIBUTES_TO_LOCALIZE],
    });

    return () => {
      observer.disconnect();
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [runLocalizer]);

  return null;
};

export default AutoPageLocalizer;
