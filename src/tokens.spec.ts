import { describe, expect, it } from 'vitest';
import { collectTokens, formatPath } from './tokens.ts';

describe('collectTokens', () => {
    it('should collect the tokens in file order, with the type of their group', () => {
        const content = {
            spacing: {
                '$type': 'dimension',
                '8': { $value: { value: 0.5, unit: 'rem' } },
                '16': { $value: { value: 1, unit: 'rem' }, $description: '1rem (16px) in code.' },
            },
        };

        expect(collectTokens(content, 'spacing.tokens.json')).toEqual([
            {
                path: ['spacing', '8'],
                type: 'dimension',
                value: { value: 0.5, unit: 'rem' },
                description: undefined,
                codeSyntax: undefined,
                extensions: undefined,
                source: 'spacing.tokens.json',
            },
            {
                path: ['spacing', '16'],
                type: 'dimension',
                value: { value: 1, unit: 'rem' },
                description: '1rem (16px) in code.',
                codeSyntax: undefined,
                extensions: undefined,
                source: 'spacing.tokens.json',
            },
        ]);
    });

    it('should let a token override the type of its group', () => {
        const content = { typography: { $type: 'dimension', weight: { $type: 'fontWeight', $value: 600 } } };

        expect(collectTokens(content, 'file')[0]?.type).toBe('fontWeight');
    });

    it('should read the WEB code syntax of the Figma variable', () => {
        const content = {
            color: {
                $type: 'color',
                text: {
                    $value: '{neutral.900}',
                    $extensions: { 'com.figma': { codeSyntax: { WEB: 'var(--dma-color-text)' } } },
                },
            },
        };

        expect(collectTokens(content, 'file')[0]?.codeSyntax).toBe('var(--dma-color-text)');
    });

    it('should keep the extensions of the token', () => {
        const extensions = { 'com.figma': { scopes: ['GAP'] } };
        const content = { spacing: { $type: 'dimension', $value: { value: 1, unit: 'rem' }, $extensions: extensions } };

        expect(collectTokens(content, 'file')[0]?.extensions).toEqual(extensions);
    });

    it('should ignore the other properties of a group', () => {
        const content = { color: { $type: 'color', $description: 'Colors', $extensions: {}, text: { $value: '{a}' } } };

        expect(collectTokens(content, 'file')).toHaveLength(1);
    });

    it.each([
        ['content that is no object', [], 'file: the file must contain an object'],
        ['a token without a type', { a: { $value: 1 } }, 'file: "a": unsupported type "undefined"'],
        ['an unsupported type', { a: { $type: 'shadow', $value: 1 } }, 'file: "a": unsupported type "shadow"'],
        ['an invalid name', { Color: { $type: 'color' } }, 'file: "Color" has an invalid name'],
        ['a name with a dot', { 'a.b': { $type: 'color' } }, 'file: "a.b" has an invalid name'],
        ['a member that is no object', { a: 1 }, 'file: "a" must be a group or a token'],
        ['a description that is no string', { a: { $type: 'number', $value: 1, $description: 1 } }, 'description'],
        ['extensions that are no object', { a: { $type: 'number', $value: 1, $extensions: [] } }, 'extensions'],
        [
            'a code syntax that is no string',
            { a: { $type: 'number', $value: 1, $extensions: { 'com.figma': { codeSyntax: { WEB: 1 } } } } },
            'the WEB code syntax must be a string',
        ],
    ])('should reject %s', (_, content, message) => {
        expect(() => collectTokens(content, 'file')).toThrow(message);
    });
});

describe('formatPath', () => {
    it('should join the path the way aliases refer to it', () => {
        expect(formatPath(['color', 'text', 'default'])).toBe('color.text.default');
    });
});
