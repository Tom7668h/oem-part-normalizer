<?php

declare(strict_types=1);

namespace CrazyPartSnatcher\OemNormalizer;

/**
 * Class OemNormalizer
 *
 * High-performance, zero-dependency PHP utility for normalizing, formatting,
 * detecting, and generating search variants of automotive & commercial vehicle
 * OEM / OES / aftermarket part numbers (MAN, Mercedes-Benz, DAF, Scania, Volvo,
 * Bosch, Hella, Knorr-Bremse, Febi Bilstein, etc.).
 *
 * Powers search index normalizations for CrazyPartSnatcher (https://www.crazypartsnatcher.com).
 *
 * @author CrazyPartSnatcher Engineering
 * @license MIT
 * @see https://www.crazypartsnatcher.com
 * @see https://www.crazypartsnatcher.com/shop
 */
final class OemNormalizer
{
    /**
     * Normalizes an OEM, OES, or aftermarket part number for database indexing,
     * cross-referencing, and SQL / Elasticsearch querying.
     *
     * Strips all whitespace, dots, hyphens, slashes, brackets, and punctuation,
     * returning a clean uppercase alphanumeric string ([A-Z0-9]).
     *
     * @param string|null $input Raw part number string or null
     * @return string Clean, uppercase alphanumeric string
     */
    public static function normalizeOem(?string $input): string
    {
        if ($input === null || $input === '') {
            return '';
        }

        $upper = strtoupper($input);
        $clean = preg_replace('/[^A-Z0-9]/', '', $upper);

        return $clean !== null ? trim($clean) : '';
    }

    /**
     * Validates whether an input string has the syntactic characteristics of an
     * automotive or commercial vehicle part number.
     *
     * Filters out non-part tokens, URLs, long descriptions, or empty values.
     *
     * @param string|null $input String to validate
     * @return bool True if input matches OEM/aftermarket format heuristics
     */
    public static function isLikelyOem(?string $input): bool
    {
        $normalized = self::normalizeOem($input);
        $len = strlen($normalized);

        if ($len < 3 || $len > 25) {
            return false;
        }

        // Must contain at least one digit or be a valid uppercase abbreviation code (3 to 8 chars)
        return (preg_match('/[0-9]/', $normalized) === 1) || (preg_match('/^[A-Z]{3,8}$/', $normalized) === 1);
    }

    /**
     * Generates all realistic search variations and supplier catalog notations
     * for a given part number to intercept inconsistent user queries, CSV supplier imports,
     * and legacy catalog formats (MAN, Mercedes-Benz, Bosch, DAF, Scania, Volvo, etc.).
     *
     * @param string $input Raw or normalized OEM part number
     * @return list<string> Deduplicated search variants with the canonical form first
     */
    public static function generateSearchVariants(string $input): array
    {
        $normalized = self::normalizeOem($input);
        if ($normalized === '') {
            return [];
        }

        $rawTrimmed = trim($input);
        $variants = [];

        // Always include canonical normalized form first
        $variants[] = $normalized;

        // Include trimmed original input if distinct
        if ($rawTrimmed !== '' && $rawTrimmed !== $normalized) {
            $variants[] = $rawTrimmed;
        }

        // 1. MAN Truck & Bus: 11-digit numeric pattern (e.g. 81.50110.0144)
        if (preg_match('/^\d{11}$/', $normalized) === 1) {
            $p1 = substr($normalized, 0, 2);
            $p2 = substr($normalized, 2, 5);
            $p3 = substr($normalized, 7);
            $variants[] = "{$p1}.{$p2}.{$p3}";
            $variants[] = "{$p1}.{$p2}-{$p3}";
            $variants[] = "{$p1} {$p2} {$p3}";
            $variants[] = "{$p1}-{$p2}-{$p3}";
        }

        // 2. Mercedes-Benz / Daimler Truck
        // Pattern A: Leading 'A' followed by 10 digits (e.g. A 000 420 00 20)
        if (preg_match('/^A\d{10}$/', $normalized) === 1) {
            $digits = substr($normalized, 1);
            $g1 = substr($digits, 0, 3);
            $g2 = substr($digits, 3, 3);
            $g3 = substr($digits, 6, 2);
            $g4 = substr($digits, 8, 2);

            $variants[] = $digits; // Without 'A' prefix
            $variants[] = "A {$g1} {$g2} {$g3} {$g4}";
            $variants[] = "A {$g1} {$g2} " . substr($digits, 6);
            $variants[] = "{$g1} {$g2} {$g3} {$g4}";
            $variants[] = "{$g1} {$g2} " . substr($digits, 6);
            $variants[] = "A-{$g1}-{$g2}-{$g3}-{$g4}";
        }
        // Pattern B: 10 digits without leading 'A' (e.g. 0004200020 or 9604200120)
        elseif (preg_match('/^\d{10}$/', $normalized) === 1) {
            $g1 = substr($normalized, 0, 3);
            $g2 = substr($normalized, 3, 3);
            $g3 = substr($normalized, 6, 2);
            $g4 = substr($normalized, 8, 2);

            $variants[] = "A{$normalized}";
            $variants[] = "A {$g1} {$g2} {$g3} {$g4}";
            $variants[] = "{$g1} {$g2} {$g3} {$g4}";
            $variants[] = "{$g1} {$g2} " . substr($normalized, 6);
        }

        // 3. Bosch: 10-character code starting with digit or 'F' (e.g. 0 281 002 461)
        if (preg_match('/^[0-9F]\d{9}$/', $normalized) === 1) {
            $c1 = substr($normalized, 0, 1);
            $c2 = substr($normalized, 1, 3);
            $c3 = substr($normalized, 4, 3);
            $c4 = substr($normalized, 7);
            $variants[] = "{$c1} {$c2} {$c3} {$c4}";
            $variants[] = "{$c1}-{$c2}-{$c3}-{$c4}";
            $variants[] = substr($normalized, 0, 4) . " {$c3} {$c4}";
        }

        // 4. DAF & Scania: 7-digit numeric pattern (e.g. 140 5525, 1 440 304)
        if (preg_match('/^\d{7}$/', $normalized) === 1) {
            $variants[] = substr($normalized, 0, 3) . ' ' . substr($normalized, 3);
            $variants[] = substr($normalized, 0, 1) . ' ' . substr($normalized, 1, 3) . ' ' . substr($normalized, 4);
        }

        // 5. Volvo Trucks & Renault Trucks: 8 digits or Renault 10 digits (74...)
        if (preg_match('/^\d{8}$/', $normalized) === 1) {
            $v1 = substr($normalized, 0, 2);
            $v2 = substr($normalized, 2, 3);
            $v3 = substr($normalized, 5);
            $variants[] = "{$v1} {$v2} {$v3}";
            $variants[] = "74{$normalized}";
            $variants[] = "74 {$v1} {$v2} {$v3}";
        } elseif (preg_match('/^74\d{8}$/', $normalized) === 1) {
            $inner = substr($normalized, 2);
            $variants[] = $inner; // Volvo 8-digit base
            $variants[] = '74 ' . substr($inner, 0, 2) . ' ' . substr($inner, 2, 3) . ' ' . substr($inner, 5);
        }

        // 6. DT Spare Parts: 6 or 7 digits (e.g. 4.61234, 2.12345)
        if (preg_match('/^\d{6}$/', $normalized) === 1) {
            $variants[] = substr($normalized, 0, 1) . '.' . substr($normalized, 1);
        } elseif (preg_match('/^\d{7}$/', $normalized) === 1) {
            $variants[] = substr($normalized, 0, 2) . '.' . substr($normalized, 2);
        }

        // 7. Knorr-Bremse: 'K' prefix + 6 digits (e.g. K000123)
        if (preg_match('/^K\d{6}$/', $normalized) === 1) {
            $variants[] = substr($normalized, 1);
            $variants[] = 'K ' . substr($normalized, 1);
            $variants[] = 'K.' . substr($normalized, 1);
        } elseif (preg_match('/^\d{6}$/', $normalized) === 1) {
            $variants[] = "K{$normalized}";
        }

        // 8. Hella: Typically 3 alphanumeric + 6 digits + 3 digits (e.g. 1EL 010 440-021)
        if (preg_match('/^[A-Z0-9]{3}\d{6}\d{3}$/', $normalized) === 1) {
            $h1 = substr($normalized, 0, 3);
            $h2 = substr($normalized, 3, 3);
            $h3 = substr($normalized, 6, 3);
            $h4 = substr($normalized, 9);
            $variants[] = "{$h1} {$h2} {$h3}-{$h4}";
            $variants[] = "{$h1} {$h2} {$h3} {$h4}";
            $variants[] = "{$h1}-{$h2}-{$h3}-{$h4}";
        }

        // 9. VAG (Volkswagen / Audi / SEAT / Skoda): 9 to 11 characters
        if (preg_match('/^[0-9A-Z]{3}\d{3}\d{3}[A-Z]{0,2}$/', $normalized) === 1) {
            $v1 = substr($normalized, 0, 3);
            $v2 = substr($normalized, 3, 3);
            $v3 = substr($normalized, 6, 3);
            $suffix = substr($normalized, 9);
            $suffixSpaced = ($suffix !== false && $suffix !== '') ? ' ' . $suffix : '';
            $suffixHyphen = ($suffix !== false && $suffix !== '') ? '-' . $suffix : '';
            $variants[] = "{$v1} {$v2} {$v3}{$suffixSpaced}";
            $variants[] = "{$v1}-{$v2}-{$v3}{$suffixHyphen}";
        }

        // 10. Leading Zero Variations
        if (str_starts_with($normalized, '0') && strlen($normalized) > 4) {
            $trimmedZeroes = ltrim($normalized, '0');
            if (strlen($trimmedZeroes) >= 4) {
                $variants[] = $trimmedZeroes;
            }
        } elseif (preg_match('/^\d{5,9}$/', $normalized) === 1) {
            $variants[] = "0{$normalized}";
        }

        return array_values(array_unique($variants));
    }

    /**
     * Detects possible vehicle manufacturers or aftermarket brand catalog schemas
     * based on structural syntax patterns, prefixes, and length heuristics.
     *
     * @param string $input Raw or normalized OEM part number
     * @return list<string> Array of detected manufacturer names
     */
    public static function detectManufacturerFormat(string $input): array
    {
        $details = self::detectManufacturerDetails($input);
        return array_values(array_map(static fn(array $item): string => $item['manufacturer'], $details));
    }

    /**
     * Provides comprehensive manufacturer format analysis, including match confidence,
     * typical formatted representations, and schema explanations.
     *
     * @param string $input Raw or normalized OEM part number
     * @return list<array{manufacturer: string, confidence: 'high'|'medium'|'low', sampleFormatted?: string, description: string}>
     */
    public static function detectManufacturerDetails(string $input): array
    {
        $normalized = self::normalizeOem($input);
        if ($normalized === '') {
            return [];
        }

        $results = [];

        // MAN Truck & Bus: 11-digit numeric
        if (preg_match('/^\d{11}$/', $normalized) === 1) {
            $isManPrefix = preg_match('/^(81|51|82|83|85|36|64)/', $normalized) === 1;
            $results[] = [
                'manufacturer' => 'MAN',
                'confidence' => $isManPrefix ? 'high' : 'medium',
                'sampleFormatted' => substr($normalized, 0, 2) . '.' . substr($normalized, 2, 5) . '.' . substr($normalized, 7),
                'description' => $isManPrefix
                    ? 'Matches MAN Truck & Bus 11-digit schema (main assembly group prefix)'
                    : 'Matches generic MAN 11-digit numeric part structure'
            ];
        }

        // Mercedes-Benz / Daimler Truck
        if (preg_match('/^A\d{10}$/', $normalized) === 1) {
            $digits = substr($normalized, 1);
            $results[] = [
                'manufacturer' => 'Mercedes-Benz / Daimler Truck',
                'confidence' => 'high',
                'sampleFormatted' => 'A ' . substr($digits, 0, 3) . ' ' . substr($digits, 3, 3) . ' ' . substr($digits, 6, 2) . ' ' . substr($digits, 8, 2),
                'description' => "Standard Daimler 'A' prefix followed by 10-digit part hierarchy"
            ];
        } elseif (preg_match('/^\d{10}$/', $normalized) === 1 && preg_match('/^(000|960|940|970|651|642|541|457)/', $normalized) === 1) {
            $results[] = [
                'manufacturer' => 'Mercedes-Benz / Daimler Truck',
                'confidence' => 'medium',
                'sampleFormatted' => 'A ' . substr($normalized, 0, 3) . ' ' . substr($normalized, 3, 3) . ' ' . substr($normalized, 6, 2) . ' ' . substr($normalized, 8, 2),
                'description' => 'Matches 10-digit Daimler commercial vehicle schema (omitted leading A)'
            ];
        }

        // Bosch: 10 chars starting with 0, 1, 2, or F
        if (preg_match('/^[0-9F]\d{9}$/', $normalized) === 1) {
            $isBoschTypical = preg_match('/^(028|098|044|045|198|F00)/', $normalized) === 1;
            $results[] = [
                'manufacturer' => 'Bosch',
                'confidence' => $isBoschTypical ? 'high' : 'medium',
                'sampleFormatted' => substr($normalized, 0, 1) . ' ' . substr($normalized, 1, 3) . ' ' . substr($normalized, 4, 3) . ' ' . substr($normalized, 7),
                'description' => 'Matches Bosch 10-character automotive product catalog schema'
            ];
        }

        // WABCO: 10-digit numeric typically starting with 4
        if (preg_match('/^4\d{9}$/', $normalized) === 1) {
            $results[] = [
                'manufacturer' => 'WABCO',
                'confidence' => 'medium',
                'sampleFormatted' => substr($normalized, 0, 3) . ' ' . substr($normalized, 3, 3) . ' ' . substr($normalized, 6, 3) . ' ' . substr($normalized, 9),
                'description' => 'Matches WABCO commercial braking & pneumatic 10-digit schema'
            ];
        }

        // Knorr-Bremse: 'K' + 6 digits or 'II' + 5 digits
        if (preg_match('/^K\d{6}$/', $normalized) === 1) {
            $results[] = [
                'manufacturer' => 'Knorr-Bremse',
                'confidence' => 'high',
                'sampleFormatted' => 'K' . substr($normalized, 1),
                'description' => "Standard Knorr-Bremse commercial vehicle 'K' reference schema"
            ];
        } elseif (preg_match('/^II\d{5}$/', $normalized) === 1) {
            $results[] = [
                'manufacturer' => 'Knorr-Bremse',
                'confidence' => 'high',
                'sampleFormatted' => $normalized,
                'description' => 'Legacy Knorr-Bremse pneumatic valve & brake assembly schema'
            ];
        }

        // DAF & Scania: 7 digits
        if (preg_match('/^\d{7}$/', $normalized) === 1) {
            $isScaniaRange = preg_match('/^(13|14|15|17|18|19|20|21|22|23|24)\d{5}$/', $normalized) === 1;
            $isDafRange = preg_match('/^(0|14|16|17|18|19)\d{5}$/', $normalized) === 1;

            if ($isScaniaRange) {
                $results[] = [
                    'manufacturer' => 'Scania',
                    'confidence' => 'medium',
                    'sampleFormatted' => substr($normalized, 0, 1) . ' ' . substr($normalized, 1, 3) . ' ' . substr($normalized, 4),
                    'description' => 'Matches Scania 7-digit truck & bus part numbering'
                ];
            }

            if ($isDafRange) {
                $results[] = [
                    'manufacturer' => 'DAF',
                    'confidence' => 'medium',
                    'sampleFormatted' => substr($normalized, 0, 3) . ' ' . substr($normalized, 3),
                    'description' => 'Matches DAF 7-digit commercial vehicle numbering'
                ];
            }

            if (!$isScaniaRange && !$isDafRange) {
                $results[] = [
                    'manufacturer' => 'DAF / Scania',
                    'confidence' => 'low',
                    'sampleFormatted' => substr($normalized, 0, 3) . ' ' . substr($normalized, 3),
                    'description' => 'Matches 7-digit commercial vehicle reference schema'
                ];
            }
        }

        // Volvo Trucks / Renault Trucks: 8 digits or 10 digits (74...)
        if (preg_match('/^\d{8}$/', $normalized) === 1) {
            $results[] = [
                'manufacturer' => 'Volvo Trucks',
                'confidence' => 'medium',
                'sampleFormatted' => substr($normalized, 0, 2) . ' ' . substr($normalized, 2, 3) . ' ' . substr($normalized, 5),
                'description' => 'Matches Volvo Trucks 8-digit group reference format'
            ];
        } elseif (preg_match('/^74\d{8}$/', $normalized) === 1) {
            $results[] = [
                'manufacturer' => 'Renault Trucks',
                'confidence' => 'high',
                'sampleFormatted' => '74 ' . substr($normalized, 2, 2) . ' ' . substr($normalized, 4, 3) . ' ' . substr($normalized, 7),
                'description' => 'Matches Renault Trucks 10-digit group schema (Volvo Group 74-prefix)'
            ];
        }

        // Iveco: 8 to 10 digits
        if (preg_match('/^(50|58|42|99)\d{6,8}$/', $normalized) === 1) {
            $results[] = [
                'manufacturer' => 'Iveco',
                'confidence' => 'medium',
                'sampleFormatted' => $normalized,
                'description' => 'Matches Iveco commercial vehicle part numbering series'
            ];
        }

        // DT Spare Parts: 6 or 7 digits (e.g. 4.61234)
        if (preg_match('/^[1-9]\d{5,6}$/', $normalized) === 1) {
            $cut = strlen($normalized) - 5;
            $results[] = [
                'manufacturer' => 'DT Spare Parts',
                'confidence' => 'low',
                'sampleFormatted' => substr($normalized, 0, $cut) . '.' . substr($normalized, $cut),
                'description' => 'Matches DT Spare Parts catalog numbering (X.XXXXX)'
            ];
        }

        // Hella: 3 alpha prefix + 6 digits + 3 digits (e.g. 1EL 010 440-021)
        if (preg_match('/^[A-Z0-9]{3}\d{9}$/', $normalized) === 1) {
            $isHellaPrefix = preg_match('/^(1EL|8JA|6PA|2VP|9EL|1LL|1EE|2BA|8JS)/', $normalized) === 1;
            if ($isHellaPrefix) {
                $results[] = [
                    'manufacturer' => 'Hella',
                    'confidence' => 'high',
                    'sampleFormatted' => substr($normalized, 0, 3) . ' ' . substr($normalized, 3, 3) . ' ' . substr($normalized, 6, 3) . '-' . substr($normalized, 9),
                    'description' => 'Matches Hella lighting, electrical & sensor part schema'
                ];
            }
        }

        // Febi Bilstein: 5 or 6 digits numeric
        if (preg_match('/^\d{5,6}$/', $normalized) === 1) {
            $results[] = [
                'manufacturer' => 'Febi Bilstein',
                'confidence' => 'low',
                'sampleFormatted' => $normalized,
                'description' => 'Matches Febi Bilstein aftermarket article numbering'
            ];
        }

        // VAG (Volkswagen / Audi / SEAT / Skoda)
        if (preg_match('/^[0-9A-Z]{3}\d{3}\d{3}[A-Z]{0,2}$/', $normalized) === 1) {
            $tail = strlen($normalized) > 9 ? ' ' . substr($normalized, 9) : '';
            $results[] = [
                'manufacturer' => 'VAG (Volkswagen / Audi / SEAT / Skoda)',
                'confidence' => 'medium',
                'sampleFormatted' => substr($normalized, 0, 3) . ' ' . substr($normalized, 3, 3) . ' ' . substr($normalized, 6, 3) . $tail,
                'description' => 'Matches VAG 3-3-3 component and subgroup structure'
            ];
        }

        return $results;
    }

    /**
     * Formats a raw or normalized OEM number into its conventional, human-readable
     * manufacturer standard display format. Ideal for invoices, workshop tablets,
     * frontend titles, and catalog printing.
     *
     * @param string $input Raw part number
     * @param string|null $preferredManufacturer Optional target manufacturer hint
     * @return string Beautified display string or normalized string if unknown schema
     */
    public static function formatOemDisplay(string $input, ?string $preferredManufacturer = null): string
    {
        $normalized = self::normalizeOem($input);
        if ($normalized === '') {
            return '';
        }

        $details = self::detectManufacturerDetails($normalized);

        if ($preferredManufacturer !== null && $preferredManufacturer !== '') {
            $lowerPref = strtolower($preferredManufacturer);
            foreach ($details as $detail) {
                if (str_contains(strtolower($detail['manufacturer']), $lowerPref) && isset($detail['sampleFormatted'])) {
                    return $detail['sampleFormatted'];
                }
            }
        }

        if (count($details) === 0) {
            return $normalized;
        }

        // Sort by confidence: high (3) > medium (2) > low (1)
        $score = ['high' => 3, 'medium' => 2, 'low' => 1];
        usort($details, static function (array $a, array $b) use ($score): int {
            return ($score[$b['confidence']] ?? 0) <=> ($score[$a['confidence']] ?? 0);
        });

        return $details[0]['sampleFormatted'] ?? $normalized;
    }

    /**
     * Builds a direct search, comparison, or OE-Hub URL on CrazyPartSnatcher
     * for live price comparison, cross-referencing, and multi-supplier availability.
     *
     * @param string $oemNumber Raw or formatted OEM part number
     * @param array{type?: 'shop'|'oe', brand?: string, baseUrl?: string} $options Routing options
     * @return string Fully qualified CrazyPartSnatcher URL
     */
    public static function buildPartSearchUrl(string $oemNumber, array $options = []): string
    {
        $normalized = self::normalizeOem($oemNumber);
        $baseUrl = rtrim($options['baseUrl'] ?? 'https://www.crazypartsnatcher.com', '/');

        if ($normalized === '') {
            return "{$baseUrl}/shop";
        }

        $type = $options['type'] ?? 'shop';
        if ($type === 'oe') {
            return "{$baseUrl}/oe/" . rawurlencode(strtolower($normalized));
        }

        $queryParams = ['q' => $normalized];
        if (!empty($options['brand'])) {
            $queryParams['brand'] = trim($options['brand']);
        }

        return "{$baseUrl}/shop?" . http_build_query($queryParams);
    }
}
