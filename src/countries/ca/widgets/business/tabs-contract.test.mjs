// Contract check for StructureTabs.tsx, which restyles the core `Tabs` from outside through
// `[&>[role=tablist]]` and `[&>[role=tablist]>[role=tab]]`. It fails as soon as the core markup stops matching
// those selectors (the phone "Side by side" comparison would silently lose its equal-width, wrapping tabs):
//   node --test src/countries/ca/widgets/business/tabs-contract.test.mjs
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const read = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8');
const source = ts.createSourceFile('Tabs.tsx', read('../../../../components/ui/Tabs.tsx'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

const opening = (node) => (ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null);
const attr = (node, name) => {
  const found = opening(node)?.attributes.properties.find((p) => ts.isJsxAttribute(p) && p.name.getText() === name);
  return found?.initializer && ts.isStringLiteral(found.initializer) ? found.initializer.text : undefined;
};
const hasAttr = (node, name) => Boolean(opening(node)?.attributes.properties.some((p) => ts.isJsxAttribute(p) && p.name.getText() === name));
/** The nearest JSX element around a node (through `{tabs.map(…)}` and friends). */
const jsxParent = (node) => {
  for (let p = node.parent; p; p = p.parent) if (ts.isJsxElement(p)) return p;
  return null;
};
const byRole = (role) => {
  const out = [];
  const walk = (node) => {
    if (opening(node) && attr(node, 'role') === role) out.push(node);
    ts.forEachChild(node, walk);
  };
  walk(source);
  return out;
};

test('core Tabs still renders root > [role=tablist] > [role=tab], with className on the root', () => {
  const [list, ...moreLists] = byRole('tablist');
  assert.ok(list, 'Tabs renders an element with role="tablist"');
  assert.equal(moreLists.length, 0, 'one tablist');
  const root = jsxParent(list);
  assert.ok(root, 'the tablist has a parent element');
  assert.equal(jsxParent(root), null, 'the tablist is a direct child of the Tabs root');
  assert.ok(hasAttr(root, 'className'), 'the root takes the className StructureTabs passes');
  const tabs = byRole('tab');
  assert.ok(tabs.length > 0, 'Tabs renders elements with role="tab"');
  for (const tab of tabs) assert.equal(jsxParent(tab), list, 'each tab is a direct child of the tablist');
});

test('StructureTabs only reaches into Tabs through those two selectors', () => {
  const selectors = new Set(read('./StructureTabs.tsx').match(/\[&>[^\]]*\](?:>?\[role=tab\])?\]/g) ?? []);
  assert.deepEqual([...selectors].sort(), ['[&>[role=tablist]>[role=tab]]', '[&>[role=tablist]]']);
});
