import { describe, expect, it } from 'vitest';
import type { TokenType } from './tokens.ts';
import { formatValue } from './values.ts';

describe('formatValue', () => {
    it.each<[TokenType, unknown, string]>([
        ['color', { colorSpace: 'srgb', components: [1, 0.5, 0] }, '#ff8000'],
        ['color', { colorSpace: 'srgb', components: [1, 1, 1], hex: '#FFFFFF' }, '#ffffff'],
        ['color', { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.5 }, '#00000080'],
        ['color', { colorSpace: 'srgb', components: [0, 0, 0], alpha: 1 }, '#000000'],
        ['dimension', { value: 1.5, unit: 'rem' }, '1.5rem'],
        ['dimension', { value: 9999, unit: 'px' }, '9999px'],
        ['dimension', { value: 0, unit: 'rem' }, '0'],
        ['fontFamily', 'Inter', 'Inter'],
        ['fontFamily', ['Inter', 'system-ui', 'sans-serif'], 'Inter, system-ui, sans-serif'],
        ['fontFamily', ['JetBrains Mono', 'ui-monospace'], '"JetBrains Mono", ui-monospace'],
        ['fontWeight', 600, '600'],
        ['number', 1.25, '1.25'],
    ])('should format the %s %j as %s', (type, value, expected) => {
        expect(formatValue(type, value)).toBe(expected);
    });

    it.each<[TokenType, unknown, string]>([
        ['color', '#ffffff', 'the "srgb" color space'],
        ['color', { colorSpace: 'display-p3', components: [1, 1, 1] }, 'the "srgb" color space'],
        ['color', { colorSpace: 'srgb', components: [1, 1] }, 'three components between 0 and 1'],
        ['color', { colorSpace: 'srgb', components: [2, 1, 1] }, 'three components between 0 and 1'],
        ['color', { colorSpace: 'srgb', components: [1, 1, 1], alpha: 2 }, 'alpha of a color'],
        ['color', { colorSpace: 'srgb', components: [1, 1, 1], hex: '#000000' }, 'the hex "#000000" does not match'],
        ['dimension', { value: 1, unit: 'em' }, 'a unit of px or rem'],
        ['dimension', '16px', 'a number value'],
        ['fontFamily', [], 'a name or a list of names'],
        ['fontFamily', ['Inter', 1], 'a name or a list of names'],
        ['fontWeight', 'bold', 'a whole number from 1 to 1000'],
        ['fontWeight', 1001, 'a whole number from 1 to 1000'],
        ['number', Number.NaN, 'a finite number value'],
    ])('should reject the %s %j', (type, value, message) => {
        expect(() => formatValue(type, value)).toThrow(message);
    });
});
