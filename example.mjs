import {
  normalizeOem,
  generateSearchVariants,
  detectManufacturerFormat,
  detectManufacturerDetails,
  formatOemDisplay,
  buildPartSearchUrl
} from './dist/esm/index.js';

console.log('=== CrazyPartSnatcher OEM Normalizer Demo ===\n');

const testCases = [
  '81.50110.0144',   // MAN brake drum / disc reference
  'A 000 420 00 20', // Mercedes-Benz brake pad set
  '0 281 002 461',   // Bosch fuel pressure sensor
  '4.61234',         // DT Spare Parts reference
  '140 5525',        // DAF filter element
  'K000123',         // Knorr-Bremse air brake compressor
  '74 20 512 891'    // Renault / Volvo Trucks engine component
];

for (const raw of testCases) {
  const normalized = normalizeOem(raw);
  const variants = generateSearchVariants(raw);
  const detected = detectManufacturerFormat(raw);
  const formatted = formatOemDisplay(normalized);
  const searchUrl = buildPartSearchUrl(normalized);

  console.log(`Original Input:   "${raw}"`);
  console.log(`Normalized:       "${normalized}"`);
  console.log(`Detected Brands:  ${detected.join(', ') || 'Unknown'}`);
  console.log(`Display Format:   "${formatted}"`);
  console.log(`Search Variants:  [${variants.slice(0, 4).join(', ')}${variants.length > 4 ? ', ...' : ''}]`);
  console.log(`Comparison Link:  ${searchUrl}`);
  console.log('-'.repeat(60));
}
