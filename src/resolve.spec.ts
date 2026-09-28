import { describe, expect, it } from 'vitest';
import { aliasTarget, resolveTokens } from './resolve.ts';
import type { Token, TokenType } from './tokens.ts';

function token(path: string, value: unknown, type: TokenType = 'color', source = 'file'): Token {
    return {
        path: path.split('.'),
        type,
        value,
        description: undefined,
        codeSyntax: undefined,
        extensions: undefined,
        source,
    };
}

describe('aliasTarget', () => {
    it('should return the path of an alias', () => {
        expect(aliasTarget('{neutral.900}')).toBe('neutral.900');
    });

    it.each([['#ffffff'], ['{a} {b}'], [{ value: 1 }], [1]])('should return undefined for %j', (value) => {
        expect(aliasTarget(value)).toBeUndefined();
    });
});

describe('resolveTokens', () => {
    it('should follow chains of aliases', () => {
        const white = { colorSpace: 'srgb', components: [1, 1, 1] };
        const resolved = resolveTokens([
            token('color.inverse', '{color.default}'),
            token('color.default', '{neutral.0}'),
            token('neutral.0', white),
        ]);

        expect(Object.fromEntries(resolved)).toEqual({
            'color.inverse': white,
            'color.default': white,
            'neutral.0': white,
        });
    });

    it('should reject two tokens with the same path', () => {
        expect(() => resolveTokens([token('a', 1, 'number', 'one'), token('a', 2, 'number', 'two')])).toThrow(
            '"a" is defined in both one and two',
        );
    });

    it('should reject an alias to a missing token', () => {
        expect(() => resolveTokens([token('a', '{b}')])).toThrow('file: "a" refers to "b", which does not exist');
    });

    it('should reject an alias to a token of another type', () => {
        expect(() => resolveTokens([token('a', '{b}'), token('b', 1, 'number')])).toThrow(
            'file: "a" is a color token, but "b" is a number token',
        );
    });

    it('should reject a circular alias', () => {
        expect(() => resolveTokens([token('a', '{b}'), token('b', '{a}')])).toThrow('file: circular alias a -> b -> a');
    });

    describe('with a typography token', () => {
        const size = { value: 1, unit: 'rem' };
        const typography = (members: object) =>
            token('text.body', { fontSize: '{font-size.16}', lineHeight: 1.5, ...members }, 'typography');

        it('should resolve the aliases of its members, and keep the other members', () => {
            const resolved = resolveTokens([typography({}), token('font-size.16', size, 'dimension')]);

            expect(resolved.get('text.body')).toEqual({ fontSize: size, lineHeight: 1.5 });
        });

        it('should accept every type that a member allows', () => {
            const resolved = resolveTokens([
                typography({ lineHeight: '{line-height.24}' }),
                token('font-size.16', size, 'dimension'),
                token('line-height.24', { value: 1.5, unit: 'rem' }, 'dimension'),
            ]);

            expect(resolved.get('text.body')).toMatchObject({ lineHeight: { value: 1.5, unit: 'rem' } });
        });

        it('should keep an alias in a member that typography does not have', () => {
            const resolved = resolveTokens([typography({ color: '{a}' }), token('font-size.16', size, 'dimension')]);

            expect(resolved.get('text.body')).toMatchObject({ color: '{a}' });
        });

        it('should reject a member that refers to a missing token', () => {
            expect(() => resolveTokens([typography({})])).toThrow(
                'file: the fontSize of "text.body" refers to "font-size.16", which does not exist',
            );
        });

        it('should reject a member that refers to a token of another type', () => {
            expect(() => resolveTokens([typography({}), token('font-size.16', 16, 'number')])).toThrow(
                'file: the fontSize of "text.body" must refer to a dimension token, but "font-size.16" is a number token',
            );
        });
    });
});
