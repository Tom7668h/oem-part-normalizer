import assert from 'node:assert';
import {
  normalizeOem,
  isLikelyOem,
  generateSearchVariants,
  detectManufacturerFormat,
  detectManufacturerDetails,
  formatOemDisplay,
  buildPartSearchUrl
} from '../src/index.js';

console.log('🧪 Starting test suite for @crazypartsnatcher/oem-normalizer...\n');

// 1. normalizeOem tests
console.log('Testing normalizeOem...');
assert.strictEqual(normalizeOem('81.50110.0144'), '81501100144');
assert.strictEqual(normalizeOem('A 000 420 00 20'), 'A0004200020');
assert.strictEqual(normalizeOem(' 0-281-002-461 '), '0281002461');
assert.strictEqual(normalizeOem('4.61234 / A'), '461234A');
assert.strictEqual(normalizeOem('1EL 010 440-021'), '1EL010440021');
assert.strictEqual(normalizeOem(null), '');
assert.strictEqual(normalizeOem(undefined), '');
assert.strictEqual(normalizeOem(''), '');
console.log('✅ normalizeOem passed.\n');

// 2. isLikelyOem tests
console.log('Testing isLikelyOem...');
assert.strictEqual(isLikelyOem('81.50110.0144'), true);
assert.strictEqual(isLikelyOem('A0004200020'), true);
assert.strictEqual(isLikelyOem('0281002461'), true);
assert.strictEqual(isLikelyOem('AB'), false); // Too short
assert.strictEqual(isLikelyOem('THIS IS A VERY LONG PRODUCT DESCRIPTION THAT CANNOT BE A PART NUMBER'), false);
assert.strictEqual(isLikelyOem('   '), false);
console.log('✅ isLikelyOem passed.\n');

// 3. generateSearchVariants tests
console.log('Testing generateSearchVariants...');
const manVariants = generateSearchVariants('81501100144');
assert(manVariants.includes('81501100144'));
assert(manVariants.includes('81.50110.0144'));
assert(manVariants.includes('81.50110-0144'));
assert(manVariants.includes('81 50110 0144'));

const mbVariants = generateSearchVariants('A0004200020');
assert(mbVariants.includes('A0004200020'));
assert(mbVariants.includes('0004200020'));
assert(mbVariants.includes('A 000 420 00 20'));

const boschVariants = generateSearchVariants('0281002461');
assert(boschVariants.includes('0 281 002 461'));
assert(boschVariants.includes('0-281-002-461'));

const dtVariants = generateSearchVariants('461234');
assert(dtVariants.includes('4.61234'));
console.log('✅ generateSearchVariants passed.\n');

// 4. detectManufacturerFormat tests
console.log('Testing detectManufacturerFormat & details...');
const manDetected = detectManufacturerFormat('81501100144');
assert(manDetected.includes('MAN'), 'Should identify MAN');

const mbDetected = detectManufacturerFormat('A0004200020');
assert(mbDetected.includes('Mercedes-Benz / Daimler Truck'), 'Should identify Mercedes-Benz');

const boschDetected = detectManufacturerFormat('0281002461');
assert(boschDetected.includes('Bosch'), 'Should identify Bosch');

const knorrDetected = detectManufacturerFormat('K000123');
assert(knorrDetected.includes('Knorr-Bremse'), 'Should identify Knorr-Bremse');

const dafDetected = detectManufacturerFormat('1405525');
assert(dafDetected.includes('DAF'), 'Should identify DAF');

const details = detectManufacturerDetails('81501100144');
assert(details[0].confidence === 'high');
console.log('✅ detectManufacturerFormat passed.\n');

// 5. formatOemDisplay tests
console.log('Testing formatOemDisplay...');
assert.strictEqual(formatOemDisplay('81501100144'), '81.50110.0144');
assert.strictEqual(formatOemDisplay('A0004200020'), 'A 000 420 00 20');
assert.strictEqual(formatOemDisplay('0281002461'), '0 281 002 461');
console.log('✅ formatOemDisplay passed.\n');

// 6. buildPartSearchUrl tests
console.log('Testing buildPartSearchUrl...');
const url1 = buildPartSearchUrl('81.50110.0144');
assert.strictEqual(url1, 'https://www.crazypartsnatcher.com/shop?q=81501100144');

const url2 = buildPartSearchUrl('A 000 420 00 20', { brand: 'Febi Bilstein' });
assert.strictEqual(url2, 'https://www.crazypartsnatcher.com/shop?q=A0004200020&brand=Febi+Bilstein');

const url3 = buildPartSearchUrl('81501100144', { type: 'oe' });
assert.strictEqual(url3, 'https://www.crazypartsnatcher.com/oe/81501100144');
console.log('✅ buildPartSearchUrl passed.\n');

console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! The package is ready for production & release.\n');
