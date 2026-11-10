const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const languages = ['fr', 'en', 'tr'];
const dictionaries = Object.fromEntries(languages.map((language) => {
  const file = path.join(root, 'utils/i18n/locales', language + '.ts');
  const exports = {};
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  runInNewContext(outputText, { exports });
  return [language, exports[language]];
}));

function entries(dictionary, prefix = '') {
  return Object.entries(dictionary).flatMap(([key, value]) => {
    const name = prefix + key;
    if (typeof value === 'string') return [[name, value]];
    return value && typeof value === 'object' && !Array.isArray(value)
      ? entries(value, name + '.')
      : [];
  });
}

test('French, English and Turkish expose the same nonempty translation keys', () => {
  const reference = Object.keys(Object.fromEntries(entries(dictionaries.fr))).sort();
  for (const [language, dictionary] of Object.entries(dictionaries)) {
    const values = Object.fromEntries(entries(dictionary));
    assert.deepEqual(Object.keys(values).sort(), reference, language);
    for (const key of reference) assert.ok(values[key].trim(), `${language}: ${key}`);
  }
});

test('literal translation calls in app screens resolve in all three languages', () => {
  const known = new Set(entries(dictionaries.fr).map(([key]) => key));
  for (const directory of ['app', 'components']) {
    for (const name of readdirSync(path.join(root, directory), { recursive: true })) {
      if (!name.endsWith('.tsx')) continue;
      const file = path.join(root, directory, name);
      const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      function visit(node) {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
            node.expression.text === 't' && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
          const key = node.arguments[0].text;
          assert.ok(known.has(key), `${directory}/${name}: missing ${key}`);
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
});
