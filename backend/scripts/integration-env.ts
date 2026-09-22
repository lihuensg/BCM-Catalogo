import { readFileSync, existsSync } from 'node:fs';
import { parse } from 'dotenv';
import { assertSeparateTestDatabase } from '../src/config/test-database.js';

const testFile = existsSync('.env.test') ? parse(readFileSync('.env.test')) : {};
const development = process.env.DATABASE_URL ??
  (existsSync('.env') ? parse(readFileSync('.env')).DATABASE_URL : undefined);
const testing = process.env.TEST_DATABASE_URL ?? testFile.TEST_DATABASE_URL;
const testOnly = (process.env.TEST_DATABASE_ONLY ?? testFile.TEST_DATABASE_ONLY) === 'true';

assertSeparateTestDatabase(development, testing, testOnly);
if (development) process.env.DATABASE_URL = development;
process.env.TEST_DATABASE_URL = testing!;
