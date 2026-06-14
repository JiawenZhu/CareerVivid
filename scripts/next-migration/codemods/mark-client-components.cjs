/**
 * jscodeshift codemod for previewing or applying Next.js client boundaries.
 *
 * Usage:
 *   npx jscodeshift --dry --print --extensions=tsx,ts \
 *     --transform scripts/next-migration/codemods/mark-client-components.cjs \
 *     next-app/src/app/product/page.tsx
 *
 * The transform only adds "use client" when a file has obvious React hook or
 * browser API usage and does not already have a directive. Run in --dry mode
 * first and review the diff before applying.
 */

const CLIENT_BOUNDARY_PATTERN = /\b(useState|useEffect|useLayoutEffect|useReducer|useRef)\b|\b(window|document|localStorage|sessionStorage|navigator)\b|chrome\./;

module.exports = function markClientComponents(fileInfo, api) {
  const source = fileInfo.source;
  const trimmed = source.trimStart();

  if (!CLIENT_BOUNDARY_PATTERN.test(source)) {
    return source;
  }

  if (trimmed.startsWith('"use client"') || trimmed.startsWith("'use client'")) {
    return source;
  }

  const j = api.jscodeshift;
  const root = j(source);
  const program = root.find(j.Program).nodes()[0];

  program.body.unshift(j.expressionStatement(j.literal('use client')));

  return root.toSource({ quote: 'single' });
};
