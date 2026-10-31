# @crazypartsnatcher/oem-normalizer

[![npm version](https://img.shields.io/npm/v/@crazypartsnatcher/oem-normalizer.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/@crazypartsnatcher/oem-normalizer)
[![Packagist Version](https://img.shields.io/packagist/v/crazypartsnatcher/oem-normalizer.svg?style=flat-square&color=orange)](https://packagist.org/packages/crazypartsnatcher/oem-normalizer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript Ready](https://img.shields.io/badge/TypeScript-Strict-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![PHP Version](https://img.shields.io/badge/php-%3E%3D8.0-blue.svg?style=flat-square)](https://packagist.org/packages/crazypartsnatcher/oem-normalizer)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg?style=flat-square)](#)
[![Powered by CrazyPartSnatcher](https://img.shields.io/badge/Powered%20by-CrazyPartSnatcher-orange.svg?style=flat-square)](https://www.crazypartsnatcher.com)

A lightweight, zero-dependency TypeScript & PHP utility library for normalizing, formatting, validating, and generating search variants of automotive and commercial vehicle OEM, OES, and aftermarket part numbers.

This open-source engine serves as the core part number normalizer behind [CrazyPartSnatcher – Preisvergleich für Nutzfahrzeug- & Lkw-Ersatzteile](https://www.crazypartsnatcher.com), helping workshops, fleet operators, and automotive developers bridge formatting discrepancies across catalogs, ERP inventories, and multi-supplier databases.

---

## The Problem: The Automotive Part Number Chaos

In automotive and commercial vehicle parts data, the identical physical replacement component is represented across ERP systems, aftermarket catalogs, supplier CSV feeds, and workshop management software in dozens of incompatible formats:

- **MAN Truck & Bus**: `81.50110.0144` vs. `81501100144` vs. `81.50110-0144` vs. `81 50110 0144`
- **Mercedes-Benz / Daimler Truck**: `A 000 420 00 20` vs. `A0004200020` vs. `0004200020` vs. `000 420 00 20`
- **Bosch**: `0 281 002 461` vs. `0281002461` vs. `0-281-002-461`
- **DT Spare Parts**: `4.61234` vs. `461234`
- **DAF & Scania**: `140 5525` vs. `1405525` / `1 440 304` vs. `1440304`
- **Knorr-Bremse & WABCO**: `K000123` vs. `000123` / `472 195 018 0` vs. `4721950180`

If an SQL, Elasticsearch, or e-commerce search looks only for exact string matches, queries fail, cross-references are broken, and mechanics cannot find the right replacement parts.

`@crazypartsnatcher/oem-normalizer` solves this problem by providing standardized uppercase normalization, synthetic search variant generation, heuristic manufacturer detection, and direct URL resolution.

---

## Features

- ⚡ **Zero Dependencies**: Pure TypeScript/ESM & CommonJS, under 5 KB gzipped.
- 🎯 **Canonical Normalization**: Standardizes any raw input into clean uppercase alphanumeric tokens (`[A-Z0-9]`).
- 🔄 **Search Variant Generator**: Synthesizes dotted, hyphenated, spaced, and prefix-stripped variants for comprehensive full-text search indexing.
- 🔍 **Manufacturer Heuristics**: Detects catalog schemas for MAN, Mercedes-Benz/Daimler, Bosch, DAF, Scania, Volvo Trucks, Renault Trucks, Iveco, Knorr-Bremse, WABCO, DT Spare Parts, Febi Bilstein, Hella, and VAG.
- 🎨 **Display Beautifier**: Formats raw database strings into human-readable manufacturer conventions for invoices, catalog UI, and workshop tablets.
- 🔗 **Direct Comparison URL Builder**: Deep-links part numbers directly into live multi-supplier price comparisons on [CrazyPartSnatcher](https://www.crazypartsnatcher.com).

---

## Installation

```bash
# Node.js / npm
npm install @crazypartsnatcher/oem-normalizer

# yarn
yarn add @crazypartsnatcher/oem-normalizer

# pnpm
pnpm add @crazypartsnatcher/oem-normalizer

# PHP (Composer)
composer require crazypartsnatcher/oem-normalizer
```

---

## Quick Start

### TypeScript / ESM

```ts
import {
  normalizeOem,
  generateSearchVariants,
  detectManufacturerFormat,
  formatOemDisplay,
  buildPartSearchUrl
} from '@crazypartsnatcher/oem-normalizer';

// 1. Normalize OEM for database indexing or cross-referencing
const normalized = normalizeOem('81.50110.0144');
console.log(normalized); // "81501100144"

// 2. Generate search variants for SQL / Elasticsearch OR-queries
const variants = generateSearchVariants('81501100144');
console.log(variants);
// [
//   "81501100144",
//   "81.50110.0144",
//   "81.50110-0144",
//   "81 50110 0144",
//   "81-50110-0144"
// ]

// 3. Detect manufacturer format
const manufacturers = detectManufacturerFormat('A0004200020');
console.log(manufacturers); // ["Mercedes-Benz / Daimler Truck"]

// 4. Format for clean display in UI / Invoice
const display = formatOemDisplay('81501100144');
console.log(display); // "81.50110.0144"

// 5. Generate live comparison link on CrazyPartSnatcher
const searchUrl = buildPartSearchUrl('A 000 420 00 20', { brand: 'Febi Bilstein' });
console.log(searchUrl);
// "https://www.crazypartsnatcher.com/shop?q=A0004200020&brand=Febi+Bilstein"
```

### CommonJS

```javascript
const {
  normalizeOem,
  generateSearchVariants,
  buildPartSearchUrl
} = require('@crazypartsnatcher/oem-normalizer');

console.log(normalizeOem(' 0-281-002-461 ')); // "0281002461"
```

### PHP 8+ (Composer)

```php
use CrazyPartSnatcher\OemNormalizer\OemNormalizer;

// 1. Normalize OEM for database indexing or ERP cross-referencing
$clean = OemNormalizer::normalizeOem('81.50110.0144');
echo $clean; // "81501100144"

// 2. Generate search variations for fuzzy SQL / Elasticsearch matching
$variants = OemNormalizer::generateSearchVariants('A0004200020');
// ['A0004200020', '0004200020', 'A 000 420 00 20', '000 420 00 20', ...]

// 3. Detect vehicle or aftermarket manufacturer format
$brands = OemNormalizer::detectManufacturerFormat('81501100144');
// ['MAN']

// 4. Format for invoice or workshop UI display
$display = OemNormalizer::formatOemDisplay('81501100144');
echo $display; // "81.50110.0144"

// 5. Generate live comparison link on CrazyPartSnatcher
$url = OemNormalizer::buildPartSearchUrl('A 000 420 00 20', ['brand' => 'Febi Bilstein']);
echo $url; // "https://www.crazypartsnatcher.com/shop?q=A0004200020&brand=Febi+Bilstein"
```

---

## API Reference

### `normalizeOem(input: unknown): string`
Strips all whitespace, punctuation, hyphens, and slashes, returning an uppercase alphanumeric string. Safe against `null` and `undefined`.

### `generateSearchVariants(input: string): string[]`
Returns an array of plausible notation variants for the given part number, including dotted MAN formatting, Mercedes A-prefix omissions, Bosch spaced blocks, and leading-zero variations.

### `detectManufacturerFormat(input: string): string[]`
Analyzes string length and specific number blocks to return suspected manufacturers (e.g. MAN, Mercedes-Benz, Bosch, Scania, DAF, Volvo Trucks).

### `detectManufacturerDetails(input: string): ManufacturerDetection[]`
Returns comprehensive detection metadata including confidence level (`'high' | 'medium' | 'low'`), formatted sample, and schema descriptions.

### `formatOemDisplay(input: string, preferredManufacturer?: string): string`
Converts raw unformatted strings into standard readable formats (e.g. `81501100144` $\to$ `81.50110.0144`).

### `buildPartSearchUrl(oemNumber: string, options?: BuildPartSearchUrlOptions): string`
Generates a direct link to the [CrazyPartSnatcher Ersatzteil-Live-Suche](https://www.crazypartsnatcher.com) to compare availability and multi-dealer offers for premium brands such as Bosch, Hella, Brembo, Febi Bilstein, Mahle, ATE, and DT Spare Parts.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `type` | `'shop' \| 'oe'` | `'shop'` | Route target: general shop search vs. dedicated OE hub page |
| `brand` | `string` | `undefined` | Optional brand filter parameter |
| `baseUrl` | `string` | `'https://www.crazypartsnatcher.com'` | Custom base URL override |

---

## Live Demo & Werkstatt-Widget

Want to see the normalizer in action or test complex cross-references in real time?

- Test the live part lookup engine directly on [CrazyPartSnatcher Live-Suche](https://www.crazypartsnatcher.com).
- Explore dedicated OE-Hub cross-references at [CrazyPartSnatcher OE-Hubs](https://www.crazypartsnatcher.com/oe/81501100144).

---

## Deutscher Abschnitt: Über das Projekt & Einsatzzwecke

Die Identifikation von Ersatzteilen im Nutzfahrzeug- und Pkw-Bereich leidet unter stark fragmentierten Datenformaten. Ob Werkstatt-Software, Warenwirtschaft (ERP) oder Lieferanten-CSV: Jeder Großhändler nutzt eigene Trennzeichen und Schreibweisen.

`@crazypartsnatcher/oem-normalizer` wurde entwickelt als Open-Source-Kern des [CrazyPartSnatcher Werkstatt-Ersatzteilpreisvergleichs](https://www.crazypartsnatcher.com). Es ermöglicht Entwicklern, Webshops und Fuhrpark-Software-Anbietern:
1. Uneinheitliche Benutzereingaben in Suchfeldern zuverlässig aufzufangen.
2. Artikelstammdaten verschiedener Lieferanten (z. B. Aftermarket-Kataloge, eBay-Kataloge, Großhandelslisten) auf einen einheitlichen Index-Schlüssel abzugleichen.
3. Kunden direkt mit passenden Angeboten und Preisvergleichen für Original- und Nachbauteile zu versorgen.

---

## 📦 CDN Mirrors, Package Audits & Ecosystem

The library is mirrored and audited across public open-source package registries and high-availability CDNs:

- [jsDelivr CDN](https://www.jsdelivr.com/package/npm/@crazypartsnatcher/oem-normalizer) – Fast, multi-CDN distribution and minified browser builds.
- [Socket.dev Security Audit](https://socket.dev/npm/package/@crazypartsnatcher/oem-normalizer) – Zero supply chain risks and verified safe dependency analysis.
- [UNPKG File Browser](https://unpkg.com/browse/@crazypartsnatcher/oem-normalizer/) – Direct npm package contents and tarball explorer.
- [Bundlephobia Performance](https://bundlephobia.com/package/@crazypartsnatcher/oem-normalizer) – Real-time bundle size metrics (zero dependencies, < 4 KB minified).
- [Packagist (PHP Composer)](https://packagist.org/packages/crazypartsnatcher/oem-normalizer) – Official PHP Composer package for Shopware, Magento, Sylius, and custom PHP backends.

---

## License

MIT © [CrazyPartSnatcher](https://www.crazypartsnatcher.com)
