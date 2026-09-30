import { describe, expect, it } from 'vitest';
import type { TokenType } from './tokens.ts';
import { formatValue, typographyMemberType } from './values.ts';

function typography(members: object = {}) {
    return {
        fontFamily: ['JetBrains Mono', 'monospace'],
        fontSize: { value: 1, unit: 'rem' },
        fontWeight: 600,
        lineHeight: { value: 1.5, unit: 'rem' },
        letterSpacing: { value: 0, unit: 'px' },
        ...members,
    };
}

describe('formatValue', () => {
    it.each<[TokenType, unknown, string]>([
        ['color', { colorSpace: 'srgb', components: [1, 0.5, 0] }, 'oklch(0.7311 0.18611 52.78)'],
        ['color', { colorSpace: 'srgb', components: [1, 1, 1], hex: '#FFFFFF' }, 'oklch(1 0 0)'],
        ['color', { colorSpace: 'srgb', components: [0.5, 0.5, 0.5] }, 'oklch(0.5982 0 0)'],
        ['color', { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.5 }, 'oklch(0 0 0 / 0.5)'],
        ['color', { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.30000001192092896 }, 'oklch(0 0 0 / 0.3)'],
        ['color', { colorSpace: 'srgb', components: [0, 0, 0], alpha: 1 }, 'oklch(0 0 0)'],
        ['dimension', { value: 1.5, unit: 'rem' }, '1.5rem'],
        ['dimension', { value: 9999, unit: 'px' }, '9999px'],
        ['dimension', { value: 0, unit: 'rem' }, '0'],
        ['fontFamily', 'Inter', 'Inter'],
        ['fontFamily', ['Inter', 'system-ui', 'sans-serif'], 'Inter, system-ui, sans-serif'],
        ['fontFamily', ['JetBrains Mono', 'ui-monospace'], '"JetBrains Mono", ui-monospace'],
        ['fontWeight', 600, '600'],
        ['number', 1.25, '1.25'],
        ['typography', typography(), '600 1rem/1.5rem "JetBrains Mono", monospace'],
        ['typography', typography({ lineHeight: 1.5 }), '600 1rem/1.5 "JetBrains Mono", monospace'],
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
        ['typography', 'bold', 'exactly the members fontFamily, fontSize, fontWeight, lineHeight, letterSpacing'],
        ['typography', { ...typography(), color: '#ffffff' }, 'exactly the members'],
        [
            'typography',
            { ...Object.fromEntries(Object.entries(typography()).slice(0, -1)), color: '#ffffff' },
            'exactly the members',
        ],
        ['typography', typography({ fontWeight: 'bold' }), 'its fontWeight is invalid, a font weight must'],
        ['typography', typography({ letterSpacing: 0 }), 'its letterSpacing is invalid, a dimension must'],
    ])('should reject the %s %j', (type, value, message) => {
        expect(() => formatValue(type, value)).toThrow(message);
    });
});

describe('typographyMemberType', () => {
    it.each<[Parameters<typeof typographyMemberType>[0], unknown, TokenType]>([
        ['lineHeight', 1.5, 'number'],
        ['lineHeight', { value: 1.5, unit: 'rem' }, 'dimension'],
        ['fontWeight', 600, 'fontWeight'],
        ['fontFamily', 'Inter', 'fontFamily'],
    ])('should give the %s %j the type %s', (member, value, type) => {
        expect(typographyMemberType(member, value)).toBe(type);
    });
});
