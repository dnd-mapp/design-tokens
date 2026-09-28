import {
    formatPath,
    isObject,
    type Token,
    type TokenType,
    TYPOGRAPHY_MEMBERS,
    type TypographyMember,
} from './tokens.ts';

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
 * The members of a typography value may be aliases as well, and each must refer to a token of a type that the member
 * accepts.
 *
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
        const follow = (target: string, types: readonly TokenType[], member?: string): unknown => {
            const targetToken = byPath.get(target);
            const where = member ? `the ${member} of "${path}"` : `"${path}"`;

            if (!targetToken) {
                throw new Error(`${token.source}: ${where} refers to "${target}", which does not exist`);
            }
            if (!types.includes(targetToken.type)) {
                throw new Error(
                    member
                        ? `${token.source}: ${where} must refer to a ${types.join(' or ')} token, but "${target}" is a ${targetToken.type} token`
                        : `${token.source}: "${path}" is a ${token.type} token, but "${target}" is a ${targetToken.type} token`,
                );
            }
            return resolve(targetToken, [...chain, path]);
        };
        const target = aliasTarget(token.value);
        let value = target === undefined ? token.value : follow(target, [token.type]);

        // The members of a typography value can refer to other tokens too, such as `{font-size.16}`.
        if (token.type === 'typography' && target === undefined && isObject(value)) {
            value = Object.fromEntries(
                Object.entries(value).map(([member, memberValue]) => {
                    const memberTarget = aliasTarget(memberValue);

                    // The formatter rejects an unknown member, so it keeps its value here.
                    if (memberTarget === undefined || !Object.hasOwn(TYPOGRAPHY_MEMBERS, member)) {
                        return [member, memberValue];
                    }
                    return [member, follow(memberTarget, TYPOGRAPHY_MEMBERS[member as TypographyMember], member)];
                }),
            );
        }
        resolved.set(path, value);
        return value;
    };

    for (const token of tokens) {
        resolve(token, []);
    }
    return resolved;
}
