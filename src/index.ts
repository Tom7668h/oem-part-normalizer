/**
 * @crazypartsnatcher/oem-normalizer (oem-part-normalizer)
 *
 * High-performance, zero-dependency TypeScript utility for normalizing, formatting,
 * detecting, and generating search variants of automotive & commercial vehicle OEM / OES / aftermarket part numbers.
 *
 * Powers search index normalizations for commercial vehicles (MAN, Mercedes-Benz, DAF, Scania, Volvo, Iveco, Renault)
 * and aftermarket suppliers (Bosch, Hella, Knorr-Bremse, WABCO, DT Spare Parts, Febi Bilstein, ATE, Mahle).
 *
 * @author CrazyPartSnatcher Team
 * @license MIT
 * @see https://www.crazypartsnatcher.com
 * @see https://www.crazypartsnatcher.com/shop
 */

/**
 * Result object for detailed manufacturer format detection.
 */
export interface ManufacturerDetection {
  /** Canonical manufacturer or supplier brand name */
  manufacturer: string;
  /** Match confidence based on length, prefix and specific structural heuristics */
  confidence: 'high' | 'medium' | 'low';
  /** Example formatted representation (e.g., '81.50110.0144' or 'A 000 420 00 20') */
  sampleFormatted?: string;
  /** Technical description of the matched catalog schema */
  description: string;
}

/**
 * Configuration options for generating CrazyPartSnatcher search and comparison URLs.
 */
export interface BuildPartSearchUrlOptions {
  /**
   * Destination route type:
   * - 'shop': General catalog, price comparison & multi-supplier search (`/shop?q=...`)
   * - 'oe': Dedicated OE-Hub comparison page (`/oe/[slug]`)
   * @default 'shop'
   */
  type?: 'shop' | 'oe';
  /**
   * Optional manufacturer / aftermarket brand filter (e.g., 'MAN', 'Bosch', 'Febi Bilstein')
   */
  brand?: string;
  /**
   * Base URL of the comparison platform.
   * @default 'https://www.crazypartsnatcher.com'
   */
  baseUrl?: string;
}

/**
 * Normalizes an OEM, OES or aftermarket part number for strict database indexing,
 * cross-referencing, and SQL / Elasticsearch indexing.
 *
 * Strips all whitespace, dots, hyphens, slashes, brackets, and punctuation,
 * converting all characters to standardized uppercase alphanumeric string (`[A-Z0-9]`).
 *
 * @example
 * ```ts
 * normalizeOem('81.50110.0144'); // returns '81501100144'
 * normalizeOem('A 000 420 00 20'); // returns 'A0004200020'
 * normalizeOem('0-281-002-461'); // returns '0281002461'
 * normalizeOem(' 4.61234 / B '); // returns '461234B'
 * ```
 *
 * @param input Raw part number string or unknown value
 * @returns Clean, uppercase alphanumeric string (empty string if input is null/undefined/empty)
 * @see https://www.crazypartsnatcher.com
 */
export function normalizeOem(input: unknown): string {
  if (typeof input !== 'string') {
    if (input === null || input === undefined) return '';
    input = String(input);
  }
  return (input as string)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
}

/**
 * Checks whether an input string has the syntactic characteristics of an automotive part number.
 * Filters out obvious non-part strings, URLs, long descriptions, or empty tokens.
 *
 * @param input String to validate
 * @returns `true` if input looks like a valid OEM or aftermarket reference (length 4 to 25 alphanumeric chars)
 */
export function isLikelyOem(input: unknown): boolean {
  const normalized = normalizeOem(input);
  if (normalized.length < 3 || normalized.length > 25) return false;
  // Must contain at least one digit or be a valid alphanumeric code (not pure symbols)
  return /[0-9]/.test(normalized) || /^[A-Z]{3,8}$/.test(normalized);
}

/**
 * Generates all realistic search variations and supplier catalog notations
 * for a given part number to intercept inconsistent user queries, CSV supplier imports,
 * and legacy catalog formats (MAN, Mercedes-Benz, Bosch, DAF, Scania, Volvo, DT Spare Parts, etc.).
 *
 * @example
 * ```ts
 * generateSearchVariants('81501100144');
 * // returns:
 * // [
 * //   '81501100144',
 * //   '81.50110.0144',
 * //   '81.50110-0144',
 * //   '81 50110 0144',
 * //   '81-50110-0144'
 * // ]
 *
 * generateSearchVariants('A0004200020');
 * // returns:
 * // [
 * //   'A0004200020',
 * //   '0004200020',
 * //   'A 000 420 00 20',
 * //   '000 420 00 20',
 * //   'A-000-420-00-20'
 * // ]
 * ```
 *
 * @param input Raw or normalized OEM part number
 * @returns Array of deduplicated search variants, sorted with the canonical clean form first
 * @see https://www.crazypartsnatcher.com
 */
export function generateSearchVariants(input: string): string[] {
  const normalized = normalizeOem(input);
  if (!normalized) return [];

  const rawTrimmed = typeof input === 'string' ? input.trim() : '';
  const variants = new Set<string>();

  // Always include canonical normalized form first
  variants.add(normalized);

  // Include trimmed original input if not identical
  if (rawTrimmed && rawTrimmed !== normalized) {
    variants.add(rawTrimmed);
  }

  // 1. MAN Truck & Bus: 11-digit numeric pattern (e.g. 81.50110.0144)
  if (/^\d{11}$/.test(normalized)) {
    const p1 = normalized.slice(0, 2);
    const p2 = normalized.slice(2, 7);
    const p3 = normalized.slice(7);
    variants.add(`${p1}.${p2}.${p3}`);
    variants.add(`${p1}.${p2}-${p3}`);
    variants.add(`${p1} ${p2} ${p3}`);
    variants.add(`${p1}-${p2}-${p3}`);
  }

  // 2. Mercedes-Benz / Daimler Truck
  // Pattern A: Leading 'A' followed by 10 digits (e.g. A 000 420 00 20 or A 960 420 01 20)
  if (/^A\d{10}$/.test(normalized)) {
    const digits = normalized.slice(1);
    const g1 = digits.slice(0, 3);
    const g2 = digits.slice(3, 6);
    const g3 = digits.slice(6, 8);
    const g4 = digits.slice(8, 10);

    variants.add(digits); // Without 'A' prefix
    variants.add(`A ${g1} ${g2} ${g3} ${g4}`);
    variants.add(`A ${g1} ${g2} ${digits.slice(6)}`);
    variants.add(`${g1} ${g2} ${g3} ${g4}`);
    variants.add(`${g1} ${g2} ${digits.slice(6)}`);
    variants.add(`A-${g1}-${g2}-${g3}-${g4}`);
  }
  // Pattern B: 10 digits without leading 'A' (e.g. 0004200020 or 9604200120)
  else if (/^\d{10}$/.test(normalized)) {
    const g1 = normalized.slice(0, 3);
    const g2 = normalized.slice(3, 6);
    const g3 = normalized.slice(6, 8);
    const g4 = normalized.slice(8, 10);

    variants.add(`A${normalized}`);
    variants.add(`A ${g1} ${g2} ${g3} ${g4}`);
    variants.add(`${g1} ${g2} ${g3} ${g4}`);
    variants.add(`${g1} ${g2} ${normalized.slice(6)}`);
  }

  // 3. Bosch: 10-character code starting with digit or 'F' (e.g. 0 281 002 461, F 00M 144 144)
  if (/^[0-9F]\d{9}$/.test(normalized)) {
    const c1 = normalized.slice(0, 1);
    const c2 = normalized.slice(1, 4);
    const c3 = normalized.slice(4, 7);
    const c4 = normalized.slice(7);
    variants.add(`${c1} ${c2} ${c3} ${c4}`);
    variants.add(`${c1}-${c2}-${c3}-${c4}`);
    variants.add(`${normalized.slice(0, 4)} ${c3} ${c4}`);
  }

  // 4. DAF & Scania: 7-digit numeric pattern (e.g. 140 5525, 1 440 304)
  if (/^\d{7}$/.test(normalized)) {
    variants.add(`${normalized.slice(0, 3)} ${normalized.slice(3)}`);
    variants.add(`${normalized.slice(0, 1)} ${normalized.slice(1, 4)} ${normalized.slice(4)}`);
  }

  // 5. Volvo Trucks & Renault Trucks: 8 digits (e.g. 20 512 891) or Renault 10 digits (74 20 512 891)
  if (/^\d{8}$/.test(normalized)) {
    const v1 = normalized.slice(0, 2);
    const v2 = normalized.slice(2, 5);
    const v3 = normalized.slice(5);
    variants.add(`${v1} ${v2} ${v3}`);
    // Common Renault Trucks grouping prefixed with 74
    variants.add(`74${normalized}`);
    variants.add(`74 ${v1} ${v2} ${v3}`);
  } else if (/^74\d{8}$/.test(normalized)) {
    const inner = normalized.slice(2);
    variants.add(inner); // Volvo 8-digit base
    variants.add(`74 ${inner.slice(0, 2)} ${inner.slice(2, 5)} ${inner.slice(5)}`);
  }

  // 6. DT Spare Parts: 6 or 7 digits (e.g. 4.61234, 2.12345)
  if (/^\d{6}$/.test(normalized)) {
    variants.add(`${normalized.slice(0, 1)}.${normalized.slice(1)}`);
  } else if (/^\d{7}$/.test(normalized)) {
    variants.add(`${normalized.slice(0, 2)}.${normalized.slice(2)}`);
  }

  // 7. Knorr-Bremse: 'K' prefix + 6 digits (e.g. K000123) or 'II' + 5 digits
  if (/^K\d{6}$/.test(normalized)) {
    variants.add(normalized.slice(1)); // digits without 'K'
    variants.add(`K ${normalized.slice(1)}`);
    variants.add(`K.${normalized.slice(1)}`);
  } else if (/^\d{6}$/.test(normalized)) {
    variants.add(`K${normalized}`);
  }

  // 8. Hella: Typically 3 alphanumeric + 6 digits + 3 digits (e.g. 1EL 010 440-021)
  if (/^[A-Z0-9]{3}\d{6}\d{3}$/.test(normalized)) {
    const h1 = normalized.slice(0, 3);
    const h2 = normalized.slice(3, 6);
    const h3 = normalized.slice(6, 9);
    const h4 = normalized.slice(9);
    variants.add(`${h1} ${h2} ${h3}-${h4}`);
    variants.add(`${h1} ${h2} ${h3} ${h4}`);
    variants.add(`${h1}-${h2}-${h3}-${h4}`);
  }

  // 9. VAG (Volkswagen / Audi / SEAT / Skoda): 9 to 11 characters (e.g. 1K0 615 301 M)
  if (/^[0-9A-Z]{3}\d{3}\d{3}[A-Z]{0,2}$/.test(normalized)) {
    const v1 = normalized.slice(0, 3);
    const v2 = normalized.slice(3, 6);
    const v3 = normalized.slice(6, 9);
    const suffix = normalized.slice(9);
    variants.add(`${v1} ${v2} ${v3}${suffix ? ' ' + suffix : ''}`);
    variants.add(`${v1}-${v2}-${v3}${suffix ? '-' + suffix : ''}`);
  }

  // 10. Leading Zero Variations (common in ERP exports and catalog CSVs)
  if (normalized.startsWith('0') && normalized.length > 4) {
    const trimmedZeroes = normalized.replace(/^0+/, '');
    if (trimmedZeroes.length >= 4) {
      variants.add(trimmedZeroes);
    }
  } else if (/^\d{5,9}$/.test(normalized)) {
    variants.add(`0${normalized}`);
  }

  return Array.from(variants);
}

/**
 * Detects possible vehicle manufacturers or aftermarket brand catalog schemas
 * based on structural syntax patterns, prefixes, and length heuristics.
 *
 * @example
 * ```ts
 * detectManufacturerFormat('81501100144');
 * // returns: ['MAN']
 *
 * detectManufacturerFormat('A0004200020');
 * // returns: ['Mercedes-Benz / Daimler Truck']
 *
 * detectManufacturerFormat('0281002461');
 * // returns: ['Bosch', 'Mercedes-Benz / Daimler Truck']
 * ```
 *
 * @param input Raw or normalized OEM part number
 * @returns Array of identified manufacturer / catalog schema names
 * @see https://www.crazypartsnatcher.com
 */
export function detectManufacturerFormat(input: string): string[] {
  const details = detectManufacturerDetails(input);
  return details.map((d) => d.manufacturer);
}

/**
 * Provides comprehensive manufacturer format analysis, including match confidence,
 * typical formatted representations, and schema explanations.
 *
 * @param input Raw or normalized OEM part number
 * @returns Array of structured detection results
 * @see https://www.crazypartsnatcher.com
 */
export function detectManufacturerDetails(input: string): ManufacturerDetection[] {
  const normalized = normalizeOem(input);
  if (!normalized) return [];

  const results: ManufacturerDetection[] = [];

  // MAN Truck & Bus: 11-digit numeric
  if (/^\d{11}$/.test(normalized)) {
    const isManPrefix = /^(81|51|82|83|85|36|64)/.test(normalized);
    results.push({
      manufacturer: 'MAN',
      confidence: isManPrefix ? 'high' : 'medium',
      sampleFormatted: `${normalized.slice(0, 2)}.${normalized.slice(2, 7)}.${normalized.slice(7)}`,
      description: isManPrefix
        ? 'Matches MAN Truck & Bus 11-digit schema (main assembly group prefix)'
        : 'Matches generic MAN 11-digit numeric part structure'
    });
  }

  // Mercedes-Benz / Daimler Truck
  if (/^A\d{10}$/.test(normalized)) {
    const digits = normalized.slice(1);
    results.push({
      manufacturer: 'Mercedes-Benz / Daimler Truck',
      confidence: 'high',
      sampleFormatted: `A ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`,
      description: "Standard Daimler 'A' prefix followed by 10-digit part hierarchy"
    });
  } else if (/^\d{10}$/.test(normalized) && /^(000|960|940|970|651|642|541|457)/.test(normalized)) {
    results.push({
      manufacturer: 'Mercedes-Benz / Daimler Truck',
      confidence: 'medium',
      sampleFormatted: `A ${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 8)} ${normalized.slice(8, 10)}`,
      description: 'Matches 10-digit Daimler commercial vehicle schema (omitted leading A)'
    });
  }

  // Bosch: 10 chars starting with 0, 1, 2, or F
  if (/^[0-9F]\d{9}$/.test(normalized)) {
    const isBoschTypical = /^(028|098|044|045|198|F00)/.test(normalized);
    results.push({
      manufacturer: 'Bosch',
      confidence: isBoschTypical ? 'high' : 'medium',
      sampleFormatted: `${normalized.slice(0, 1)} ${normalized.slice(1, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`,
      description: 'Matches Bosch 10-character automotive product catalog schema'
    });
  }

  // WABCO: 10-digit numeric typically starting with 4
  if (/^4\d{9}$/.test(normalized)) {
    results.push({
      manufacturer: 'WABCO',
      confidence: 'medium',
      sampleFormatted: `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9)}`,
      description: 'Matches WABCO commercial braking & pneumatic 10-digit schema'
    });
  }

  // Knorr-Bremse: 'K' + 6 digits or 'II' + 5 digits
  if (/^K\d{6}$/.test(normalized)) {
    results.push({
      manufacturer: 'Knorr-Bremse',
      confidence: 'high',
      sampleFormatted: `K${normalized.slice(1)}`,
      description: "Standard Knorr-Bremse commercial vehicle 'K' reference schema"
    });
  } else if (/^II\d{5}$/.test(normalized)) {
    results.push({
      manufacturer: 'Knorr-Bremse',
      confidence: 'high',
      sampleFormatted: normalized,
      description: 'Legacy Knorr-Bremse pneumatic valve & brake assembly schema'
    });
  }

  // DAF & Scania: 7 digits
  if (/^\d{7}$/.test(normalized)) {
    const isScaniaRange = /^(13|14|15|17|18|19|20|21|22|23|24)\d{5}$/.test(normalized);
    const isDafRange = /^(0|14|16|17|18|19)\d{5}$/.test(normalized);

    if (isScaniaRange) {
      results.push({
        manufacturer: 'Scania',
        confidence: 'medium',
        sampleFormatted: `${normalized.slice(0, 1)} ${normalized.slice(1, 4)} ${normalized.slice(4)}`,
        description: 'Matches Scania 7-digit truck & bus part numbering'
      });
    }

    if (isDafRange) {
      results.push({
        manufacturer: 'DAF',
        confidence: 'medium',
        sampleFormatted: `${normalized.slice(0, 3)} ${normalized.slice(3)}`,
        description: 'Matches DAF 7-digit commercial vehicle numbering'
      });
    }

    if (!isScaniaRange && !isDafRange) {
      results.push({
        manufacturer: 'DAF / Scania',
        confidence: 'low',
        sampleFormatted: `${normalized.slice(0, 3)} ${normalized.slice(3)}`,
        description: 'Matches 7-digit commercial vehicle reference schema'
      });
    }
  }

  // Volvo Trucks / Renault Trucks: 8 digits or 10 digits (74...)
  if (/^\d{8}$/.test(normalized)) {
    results.push({
      manufacturer: 'Volvo Trucks',
      confidence: 'medium',
      sampleFormatted: `${normalized.slice(0, 2)} ${normalized.slice(2, 5)} ${normalized.slice(5)}`,
      description: 'Matches Volvo Trucks 8-digit group reference format'
    });
  } else if (/^74\d{8}$/.test(normalized)) {
    results.push({
      manufacturer: 'Renault Trucks',
      confidence: 'high',
      sampleFormatted: `74 ${normalized.slice(2, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`,
      description: 'Matches Renault Trucks 10-digit group schema (Volvo Group 74-prefix)'
    });
  }

  // Iveco: 8 to 10 digits
  if (/^(50|58|42|99)\d{6,8}$/.test(normalized)) {
    results.push({
      manufacturer: 'Iveco',
      confidence: 'medium',
      sampleFormatted: normalized,
      description: 'Matches Iveco commercial vehicle part numbering series'
    });
  }

  // DT Spare Parts: 6 or 7 digits (e.g. 4.61234)
  if (/^[1-9]\d{5,6}$/.test(normalized)) {
    results.push({
      manufacturer: 'DT Spare Parts',
      confidence: 'low',
      sampleFormatted: `${normalized.slice(0, normalized.length - 5)}.${normalized.slice(normalized.length - 5)}`,
      description: 'Matches DT Spare Parts catalog numbering (X.XXXXX)'
    });
  }

  // Hella: 3 alpha prefix + 6 digits + 3 digits (e.g. 1EL 010 440-021)
  if (/^[A-Z0-9]{3}\d{9}$/.test(normalized)) {
    const isHellaPrefix = /^(1EL|8JA|6PA|2VP|9EL|1LL|1EE|2BA|8JS)/.test(normalized);
    if (isHellaPrefix) {
      results.push({
        manufacturer: 'Hella',
        confidence: 'high',
        sampleFormatted: `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 9)}-${normalized.slice(9)}`,
        description: 'Matches Hella lighting, electrical & sensor part schema'
      });
    }
  }

  // Febi Bilstein: 5 or 6 digits numeric
  if (/^\d{5,6}$/.test(normalized)) {
    results.push({
      manufacturer: 'Febi Bilstein',
      confidence: 'low',
      sampleFormatted: normalized,
      description: 'Matches Febi Bilstein aftermarket article numbering'
    });
  }

  // VAG (Volkswagen / Audi / SEAT / Skoda)
  if (/^[0-9A-Z]{3}\d{3}\d{3}[A-Z]{0,2}$/.test(normalized)) {
    results.push({
      manufacturer: 'VAG (Volkswagen / Audi / SEAT / Skoda)',
      confidence: 'medium',
      sampleFormatted: `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 9)}${normalized.length > 9 ? ' ' + normalized.slice(9) : ''}`,
      description: 'Matches VAG 3-3-3 component and subgroup structure'
    });
  }

  return results;
}

/**
 * Formats a raw or normalized OEM number into its conventional, human-readable
 * manufacturer standard display format. Ideal for invoices, workshop tablets,
 * frontend titles, and catalog printing.
 *
 * @example
 * ```ts
 * formatOemDisplay('81501100144'); // returns '81.50110.0144'
 * formatOemDisplay('A0004200020'); // returns 'A 000 420 00 20'
 * formatOemDisplay('0281002461');  // returns '0 281 002 461'
 * ```
 *
 * @param input Raw part number
 * @param preferredManufacturer Optional target manufacturer hint (e.g. 'MAN', 'Mercedes-Benz')
 * @returns Beautified display string or normalized string if unknown schema
 */
export function formatOemDisplay(input: string, preferredManufacturer?: string): string {
  const normalized = normalizeOem(input);
  if (!normalized) return '';

  const details = detectManufacturerDetails(normalized);
  if (preferredManufacturer) {
    const match = details.find(
      (d) => d.manufacturer.toLowerCase().includes(preferredManufacturer.toLowerCase())
    );
    if (match?.sampleFormatted) return match.sampleFormatted;
  }

  // Use highest confidence match
  const best = details.sort((a, b) => {
    const score = { high: 3, medium: 2, low: 1 };
    return score[b.confidence] - score[a.confidence];
  })[0];

  return best?.sampleFormatted || normalized;
}

/**
 * Builds a direct search, comparison or OE-Hub URL on CrazyPartSnatcher
 * for live price comparison, cross-referencing, and multi-supplier availability.
 *
 * @example
 * ```ts
 * buildPartSearchUrl('81.50110.0144');
 * // returns 'https://www.crazypartsnatcher.com/shop?q=81501100144'
 *
 * buildPartSearchUrl('A 000 420 00 20', { brand: 'Febi Bilstein' });
 * // returns 'https://www.crazypartsnatcher.com/shop?q=A0004200020&brand=Febi+Bilstein'
 *
 * buildPartSearchUrl('81501100144', { type: 'oe' });
 * // returns 'https://www.crazypartsnatcher.com/oe/81501100144'
 * ```
 *
 * @param oemNumber Raw or formatted OEM part number
 * @param options Routing configuration options (shop vs oe hub, brand filter, baseUrl)
 * @returns Fully qualified CrazyPartSnatcher URL
 * @see https://www.crazypartsnatcher.com
 * @see https://www.crazypartsnatcher.com/shop
 */
export function buildPartSearchUrl(
  oemNumber: string,
  options: BuildPartSearchUrlOptions = {}
): string {
  const normalized = normalizeOem(oemNumber);
  const baseUrl = (options.baseUrl || 'https://www.crazypartsnatcher.com').replace(/\/+$/, '');

  if (!normalized) {
    return `${baseUrl}/shop`;
  }

  if (options.type === 'oe') {
    return `${baseUrl}/oe/${encodeURIComponent(normalized.toLowerCase())}`;
  }

  const queryParams = new URLSearchParams();
  queryParams.set('q', normalized);

  if (options.brand) {
    queryParams.set('brand', options.brand.trim());
  }

  return `${baseUrl}/shop?${queryParams.toString()}`;
}

export default {
  normalizeOem,
  isLikelyOem,
  generateSearchVariants,
  detectManufacturerFormat,
  detectManufacturerDetails,
  formatOemDisplay,
  buildPartSearchUrl
};
