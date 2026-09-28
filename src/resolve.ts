import { formatPath, type Token } from './tokens.ts';

const ALIAS_PATTERN = /^\{([^{}]+)\}$/;

/** Returns the path that an alias such as `{neutral.900}` refers to, or `undefined` when the value is no alias. */
export function aliasTarget(value: unknown): string | undefined {
    return typeof value === 'string' ? ALIAS_PATTERN.exec(value)?.[1] : undefined;
}

/**
 * Replaces every alias with the value of the token that it refers to, following chains of aliases.
 *
 * @param tokens The tokens that aliases can refer to. Every path may appear only once.
 * @returns The value of every token by its path, for example `color.text.default`.
 * @throws {Error} When two tokens share a path, or an alias refers to a missing token, a token of another type, or
 *     back to itself.
 */
export function resolveTokens(tokens: Token[]): Map<string, unknown> {
    const byPath = new Map<string, Token>();

    for (const token of tokens) {
        const path = formatPath(token.path);
        const existing = byPath.get(path);

        if (existing) {
            throw new Error(`"${path}" is defined in both ${existing.source} and ${token.source}`);
        }
        byPath.set(path, token);
    }
    const resolved = new Map<string, unknown>();

    const resolve = (token: Token, chain: string[]): unknown => {
        const path = formatPath(token.path);

        if (resolved.has(path)) {
            return resolved.get(path);
        }
        if (chain.includes(path)) {
            throw new Error(`${token.source}: circular alias ${[...chain, path].join(' -> ')}`);
        }
        const target = aliasTarget(token.value);
        let value = token.value;

        if (target !== undefined) {
            const targetToken = byPath.get(target);

            if (!targetToken) {
                throw new Error(`${token.source}: "${path}" refers to "${target}", which does not exist`);
            }
            if (targetToken.type !== token.type) {
                throw new Error(
                    `${token.source}: "${path}" is a ${token.type} token, but "${target}" is a ${targetToken.type} token`,
                );
            }
            value = resolve(targetToken, [...chain, path]);
        }
        resolved.set(path, value);
        return value;
    };

    for (const token of tokens) {
        resolve(token, []);
    }
    return resolved;
}
