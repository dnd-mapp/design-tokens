import { describe, expect, it } from 'vitest';
import { srgb, tokenFiles } from '../testing/token-files.ts';
import { assembleTokens, type TokenFile } from './assemble.ts';

function colorFile(name: string, color: object): TokenFile {
    return { name, content: { color: { $type: 'color', ...color } } };
}

const white = { $value: { colorSpace: 'srgb', components: [1, 1, 1] } };
const black = { $value: { colorSpace: 'srgb', components: [0, 0, 0] } };

describe('assembleTokens', () => {
    it('should publish every token except the primitives, in file order', () => {
        expect(assembleTokens(tokenFiles)).toEqual([
            {
                path: ['color', 'text', 'default'],
                type: 'color',
                name: '--dma-color-text-default',
                value: 'light-dark(#000000, #ffffff)',
                modeValues: { light: '#000000', dark: '#ffffff' },
                resolvedValues: { light: srgb('#000000', [0, 0, 0]), dark: srgb('#ffffff', [1, 1, 1]) },
                description: undefined,
                extensions: { 'com.figma': { codeSyntax: { WEB: 'var(--dma-color-text-default)' } } },
            },
            {
                path: ['color', 'border', 'focus'],
                type: 'color',
                name: '--dma-color-border-focus',
                value: '#ff8000',
                modeValues: { light: '#ff8000', dark: '#ff8000' },
                resolvedValues: { light: srgb('#ff8000', [1, 0.5, 0]), dark: srgb('#ff8000', [1, 0.5, 0]) },
                description: undefined,
                extensions: undefined,
            },
            {
                path: ['spacing', '16'],
                type: 'dimension',
                name: '--dma-spacing-16',
                value: '1rem',
                modeValues: { light: '1rem', dark: '1rem' },
                resolvedValues: { light: { value: 1, unit: 'rem' }, dark: { value: 1, unit: 'rem' } },
                description: '1rem (16px) in code.',
                extensions: undefined,
            },
        ]);
    });

    it('should publish a token of a shared file with the same value in every mode', () => {
        const files = [colorFile('color.tokens.json', { text: white })];

        expect(assembleTokens(files)).toEqual([
            {
                path: ['color', 'text'],
                type: 'color',
                name: '--dma-color-text',
                value: '#ffffff',
                modeValues: { light: '#ffffff', dark: '#ffffff' },
                resolvedValues: { light: white.$value, dark: white.$value },
                description: undefined,
                extensions: undefined,
            },
        ]);
    });

    it.each([
        ['has no collection', '.tokens.json'],
        ['has an unknown mode', 'color.dim.tokens.json'],
        ['has too many parts', 'color.light.extra.tokens.json'],
    ])('should reject a file name that %s', (_, name) => {
        expect(() => assembleTokens([{ name, content: {} }])).toThrow(`"${name}" is not a valid token file name`);
    });

    it('should reject a token that only one mode defines', () => {
        const files = [
            colorFile('color.dark.tokens.json', { text: white }),
            colorFile('color.light.tokens.json', { text: black, border: black }),
        ];

        expect(() => assembleTokens(files)).toThrow(
            'Every mode must define the same tokens. Missing: "color.border" in dark',
        );
    });

    it('should reject a token that only the second mode defines', () => {
        const files = [
            colorFile('color.dark.tokens.json', { text: white, border: white }),
            colorFile('color.light.tokens.json', { text: black }),
        ];

        expect(() => assembleTokens(files)).toThrow('Missing: "color.border" in light');
    });

    it('should reject a code syntax that does not match the name', () => {
        const text = { ...white, $extensions: { 'com.figma': { codeSyntax: { WEB: 'var(--color-text)' } } } };

        expect(() => assembleTokens([colorFile('color.tokens.json', { text })])).toThrow(
            'color.tokens.json: "color.text" has the WEB code syntax "var(--color-text)", expected "var(--dma-color-text)"',
        );
    });

    it('should reject an invalid value, and name the token', () => {
        const files = [colorFile('color.tokens.json', { text: { $value: '#ffffff' } })];

        expect(() => assembleTokens(files)).toThrow(
            'color.tokens.json: "color.text" has an invalid value, a color must',
        );
    });

    it('should reject a token other than a color that differs between the modes', () => {
        const spacing = (value: number): TokenFile['content'] => ({
            spacing: { $type: 'dimension', gap: { $value: { value, unit: 'rem' } } },
        });
        const files = [
            { name: 'spacing.dark.tokens.json', content: spacing(2) },
            { name: 'spacing.light.tokens.json', content: spacing(1) },
        ];

        expect(() => assembleTokens(files)).toThrow(
            'spacing.light.tokens.json: "spacing.gap" differs between the modes, which only color tokens may do',
        );
    });
});
