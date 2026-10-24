import assert from 'node:assert';
import { createRequire } from 'node:module';

// Test 1: ESM build import
import * as esmModule from '../dist/esm/index.js';
console.log('Testing ESM dist import...');
assert.strictEqual(typeof esmModule.normalizeOem, 'function');
assert.strictEqual(esmModule.normalizeOem('81.50110.0144'), '81501100144');
assert.strictEqual(esmModule.normalizeOem('A 000 420 00 20'), 'A0004200020');
assert.strictEqual(esmModule.normalizeOem(' 0-281-002-461 '), '0281002461');
assert.strictEqual(esmModule.formatOemDisplay('81501100144'), '81.50110.0144');
assert.strictEqual(esmModule.formatOemDisplay('A0004200020'), 'A 000 420 00 20');
assert.strictEqual(
  esmModule.buildPartSearchUrl('81.50110.0144'),
  'https://www.crazypartsnatcher.com/shop?q=81501100144'
);
assert.strictEqual(
  esmModule.buildPartSearchUrl('A0004200020', { brand: 'Febi Bilstein' }),
  'https://www.crazypartsnatcher.com/shop?q=A0004200020&brand=Febi+Bilstein'
);
assert.strictEqual(
  esmModule.buildPartSearchUrl('81501100144', { type: 'oe' }),
  'https://www.crazypartsnatcher.com/oe/81501100144'
);
console.log('✅ ESM dist tests passed!\n');

// Test 2: CommonJS build require
console.log('Testing CommonJS dist require...');
const require = createRequire(import.meta.url);
const cjsModule = require('../dist/cjs/index.js');
assert.strictEqual(typeof cjsModule.normalizeOem, 'function');
assert.strictEqual(cjsModule.normalizeOem('81.50110.0144'), '81501100144');
assert.strictEqual(cjsModule.normalizeOem('A 000 420 00 20'), 'A0004200020');
assert.strictEqual(cjsModule.normalizeOem(' 0-281-002-461 '), '0281002461');
assert.strictEqual(cjsModule.formatOemDisplay('81501100144'), '81.50110.0144');
assert.strictEqual(cjsModule.formatOemDisplay('A0004200020'), 'A 000 420 00 20');
assert.strictEqual(
  cjsModule.buildPartSearchUrl('81.50110.0144'),
  'https://www.crazypartsnatcher.com/shop?q=81501100144'
);

// Test 3: Manufacturer detection & variants
console.log('Testing Manufacturer Detection & Variants...');
const manVariants = cjsModule.generateSearchVariants('81501100144');
assert(manVariants.includes('81.50110.0144'));
assert(manVariants.includes('81.50110-0144'));
assert(manVariants.includes('81 50110 0144'));

const mbVariants = cjsModule.generateSearchVariants('A0004200020');
assert(mbVariants.includes('A 000 420 00 20'));
assert(mbVariants.includes('0004200020'));

const detection = cjsModule.detectManufacturerFormat('81501100144');
assert(detection.includes('MAN'));

const mbDetection = cjsModule.detectManufacturerFormat('A0004200020');
assert(mbDetection.includes('Mercedes-Benz / Daimler Truck'));

console.log('✅ CommonJS dist tests passed!\n');
console.log('🚀 ALL TEST SUITES PASSED! Dual ESM & CJS build is 100% verified.');
