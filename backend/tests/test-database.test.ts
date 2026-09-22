import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertSeparateTestDatabase } from '../src/config/test-database.js';

const development = 'postgresql://fixture:fixture@ep-example.region.aws.neon.tech/development';
test('test database guard rejects identical databases despite connection differences', () => {
  for (const testing of [
    development,
    'postgresql://different:different@ep-example.region.aws.neon.tech:5432/development?schema=test',
    'postgresql://fixture:fixture@ep-example-pooler.region.aws.neon.tech/development?sslmode=require',
    'postgresql://fixture:fixture@ep-example.region.aws.neon.tech/%64evelopment'
  ]) assert.throws(() => assertSeparateTestDatabase(development, testing), /Integration aborted/);
});
test('test database guard treats local loopback aliases as the same host', () => {
  assert.throws(() => assertSeparateTestDatabase('postgresql://localhost/db', 'postgresql://127.0.0.1:5432/db'), /Integration aborted/);
});
test('test database guard accepts separate databases or Neon endpoints', () => {
  assert.doesNotThrow(() => assertSeparateTestDatabase(development, 'postgresql://fixture:fixture@ep-example.region.aws.neon.tech/testing'));
  assert.doesNotThrow(() => assertSeparateTestDatabase(development, 'postgresql://fixture:fixture@ep-other.region.aws.neon.tech/development'));
});
test('test database guard requires both configurations and never includes credentials in errors', () => {
  assert.throws(() => assertSeparateTestDatabase(undefined, development), /DATABASE_URL/);
  assert.throws(() => assertSeparateTestDatabase(development, undefined), /TEST_DATABASE_URL/);
  assert.throws(() => assertSeparateTestDatabase(development, development), (error: unknown) =>
    error instanceof Error && !error.message.includes('fixture'));
});

test('explicit test-only mode requires a test URL and never overrides a configured development collision', () => {
  assert.doesNotThrow(() => assertSeparateTestDatabase(undefined, development, true));
  assert.doesNotThrow(() => assertSeparateTestDatabase('', development, true));
  assert.throws(() => assertSeparateTestDatabase(undefined, undefined, true), /TEST_DATABASE_URL/);
  assert.throws(() => assertSeparateTestDatabase(development, development, true), /Integration aborted/);
});
