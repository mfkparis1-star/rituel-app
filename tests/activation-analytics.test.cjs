const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../utils/analytics.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
});

function setup(enabled) {
  const exports = {};
  const captures = [];
  class PostHog {
    capture(...args) { captures.push(args); }
  }
  vm.runInNewContext(outputText, {
    exports,
    process: {
      env: {
        EXPO_PUBLIC_POSTHOG_KEY: 'synthetic',
        EXPO_PUBLIC_ENABLE_ACTIVATION_ANALYTICS: enabled,
      },
    },
    require(name) {
      assert.equal(name, 'posthog-react-native');
      return PostHog;
    },
  });
  exports.initAnalytics();
  return { analytics: exports, captures };
}

test('activation events are off by default even when PostHog is configured', () => {
  const { analytics, captures } = setup(undefined);
  analytics.trackActivation('checkin_saved');
  analytics.trackActivation('guided_ritual_completed');
  assert.deepEqual(captures, []);
});

test('enabled activation capture includes only the event name', () => {
  const { analytics, captures } = setup('true');
  analytics.trackActivation('checkin_saved');
  analytics.trackActivation('guided_ritual_completed');
  assert.deepEqual(captures, [['checkin_saved'], ['guided_ritual_completed']]);
});
