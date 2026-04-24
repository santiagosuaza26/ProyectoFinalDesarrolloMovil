const detox = require('detox');
const config = require('../package.json').detox;
const adapter = require('detox/runners/jest/adapter');
const specReporter = require('detox/runners/jest/specReporter');

jest.setTimeout(120000);

jasmine.getEnv().addReporter(adapter);
jasmine.getEnv().addReporter(specReporter);

beforeAll(async () => {
  await detox.init(config);
}, 120000);

beforeEach(async () => {
  await adapter.beforeEach();
}, 120000);

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
}, 120000);
