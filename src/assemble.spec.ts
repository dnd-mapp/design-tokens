import { describe, expect, it } from 'vitest';
import { oklch, tokenFiles } from '../testing/token-files.ts';
import { assembleTokens, type OutputToken, type TokenFile } from './assemble.ts';

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
                value: 'light-dark(oklch(0 0 0), oklch(1 0 0))',
                modeValues: { light: 'oklch(0 0 0)', dark: 'oklch(1 0 0)' },
                resolvedValues: { light: oklch('#000000', [0, 0, 0]), dark: oklch('#ffffff', [1, 0, 0]) },
                description: undefined,
                extensions: { 'com.figma': { codeSyntax: { WEB: 'var(--dma-color-text-default)' } } },
            },
            {
                path: ['color', 'border', 'focus'],
                type: 'color',
                name: '--dma-color-border-focus',
                value: 'oklch(0.7311 0.18611 52.78)',
                modeValues: { light: 'oklch(0.7311 0.18611 52.78)', dark: 'oklch(0.7311 0.18611 52.78)' },
                resolvedValues: {
                    light: oklch('#ff8000', [0.7311, 0.18611, 52.78]),
                    dark: oklch('#ff8000', [0.7311, 0.18611, 52.78]),
                },
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
                value: 'oklch(1 0 0)',
                modeValues: { light: 'oklch(1 0 0)', dark: 'oklch(1 0 0)' },
                resolvedValues: { light: oklch('#ffffff', [1, 0, 0]), dark: oklch('#ffffff', [1, 0, 0]) },
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

    describe('with a typography token', () => {
        const scale: TokenFile = {
            name: 'typography.tokens.json',
            content: {
                'font-family': { $type: 'fontFamily', sans: { $value: ['Inter', 'sans-serif'] } },
                'font-size': { '$type': 'dimension', '16': { $value: { value: 1, unit: 'rem' } } },
            },
        };
        const primitives: TokenFile = {
            name: 'primitives.tokens.json',
            content: { size: { '$type': 'dimension', '24': { $value: { value: 1.5, unit: 'rem' } } } },
        };
        const extensions = { 'com.figma': { scopes: [] } };
        const body = {
            fontFamily: '{font-family.sans}',
            fontSize: '{font-size.16}',
            fontWeight: 400,
            lineHeight: '{size.24}',
            letterSpacing: { value: 0, unit: 'px' },
        };

        function assembleText(text: object): OutputToken[] {
            const file = { name: 'text.tokens.json', content: { text: { $type: 'typography', ...text } } };

            return assembleTokens([primitives, file, scale]).filter((token) => token.path[0] === 'text');
        }

        it('should publish a token for each member, and a font shorthand that composes them', () => {
            const tokens = assembleText({
                body: { $value: body, $description: 'Body text.', $extensions: extensions },
            });

            expect(tokens.map((token) => [token.name, token.type, token.value])).toEqual([
                ['--dma-text-body-font-family', 'fontFamily', 'var(--dma-font-family-sans)'],
                ['--dma-text-body-font-size', 'dimension', 'var(--dma-font-size-16)'],
                ['--dma-text-body-font-weight', 'fontWeight', '400'],
                ['--dma-text-body-line-height', 'dimension', '1.5rem'],
                ['--dma-text-body-letter-spacing', 'dimension', '0'],
                [
                    '--dma-text-body-font',
                    'typography',
                    'var(--dma-text-body-font-weight) var(--dma-text-body-font-size)/var(--dma-text-body-line-height) var(--dma-text-body-font-family)',
                ],
            ]);
            expect(tokens[1]).toEqual({
                path: ['text', 'body', 'font-size'],
                type: 'dimension',
                name: '--dma-text-body-font-size',
                value: 'var(--dma-font-size-16)',
                modeValues: { light: '1rem', dark: '1rem' },
                resolvedValues: { light: { value: 1, unit: 'rem' }, dark: { value: 1, unit: 'rem' } },
                description: undefined,
                extensions: undefined,
            });
        });

        it('should give the font shorthand the resolved value, and a DTCG line height as a multiple of the font size', () => {
            const [font] = assembleText({
                body: { $value: body, $description: 'Body text.', $extensions: extensions },
            }).slice(-1);
            const resolved = {
                fontFamily: ['Inter', 'sans-serif'],
                fontSize: { value: 1, unit: 'rem' },
                fontWeight: 400,
                lineHeight: 1.5,
                letterSpacing: { value: 0, unit: 'px' },
            };

            expect(font).toMatchObject({
                path: ['text', 'body', 'font'],
                modeValues: { light: '400 1rem/1.5rem Inter, sans-serif', dark: '400 1rem/1.5rem Inter, sans-serif' },
                resolvedValues: { light: resolved, dark: resolved },
                description: 'Body text.',
                extensions,
            });
        });

        it('should keep a line height that is a number', () => {
            const tokens = assembleText({ body: { $value: { ...body, lineHeight: 1.25 } } });

            expect(tokens[3]).toMatchObject({ type: 'number', value: '1.25' });
            expect(tokens[5]?.resolvedValues.light).toMatchObject({ lineHeight: 1.25 });
        });

        it('should resolve the members of a typography token that refers to another one', () => {
            const tokens = assembleText({ body: { $value: body }, alias: { $value: '{text.body}' } });

            expect(tokens.slice(6).map((token) => [token.name, token.value])).toEqual([
                ['--dma-text-alias-font-family', 'Inter, sans-serif'],
                ['--dma-text-alias-font-size', '1rem'],
                ['--dma-text-alias-font-weight', '400'],
                ['--dma-text-alias-line-height', '1.5rem'],
                ['--dma-text-alias-letter-spacing', '0'],
                [
                    '--dma-text-alias-font',
                    'var(--dma-text-alias-font-weight) var(--dma-text-alias-font-size)/var(--dma-text-alias-line-height) var(--dma-text-alias-font-family)',
                ],
            ]);
        });

        it.each([
            ['another unit', { value: 24, unit: 'px' }, body.fontSize],
            ['a font size of 0', { value: 1.5, unit: 'rem' }, { value: 0, unit: 'rem' }],
        ])('should reject a line height in %s', (_, lineHeight, fontSize) => {
            expect(() => assembleText({ body: { $value: { ...body, fontSize, lineHeight } } })).toThrow(
                'text.tokens.json: "text.body" needs a font size other than 0, and a line height in the same unit',
            );
        });

        it('should reject an invalid member, and name the token', () => {
            expect(() => assembleText({ body: { $value: { ...body, fontWeight: 'bold' } } })).toThrow(
                'text.tokens.json: "text.body" has an invalid value, its fontWeight is invalid',
            );
        });
    });
});
