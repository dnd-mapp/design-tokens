import { FIGMA_EXTENSION } from './constants.ts';

/** The DTCG token types that the build supports. */
export const TOKEN_TYPES = ['color', 'dimension', 'fontFamily', 'fontWeight', 'number'] as const;

export type TokenType = (typeof TOKEN_TYPES)[number];

/** A single token from a token file, with the type it inherits from its groups applied. */
export interface Token {
    /** The names of the groups and the token, for example `['color', 'text', 'default']`. */
    path: string[];
    type: TokenType;
    /** The raw `$value`. It is either an alias such as `{neutral.900}` or a value of the token type. */
    value: unknown;
    description: string | undefined;
    /** The WEB code syntax of the Figma variable, for example `var(--dma-color-text-default)`. */
    codeSyntax: string | undefined;
    /** The `$extensions` of the token, such as the metadata of the Figma variable. */
    extensions: Record<string, unknown> | undefined;
    /** The token file that defines the token, relative to the tokens directory. */
    source: string;
}

type TokenNode = Record<string, unknown>;

/** Group and token names become part of a CSS custom property, so they use lowercase letters, digits, and hyphens. */
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Whether a value is a plain object, such as a group, a token, or a composite value. */
export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTokenType(value: unknown): value is TokenType {
    return TOKEN_TYPES.includes(value as TokenType);
}

/** Joins a token path the way DTCG aliases refer to it, for example `color.text.default`. */
export function formatPath(path: string[]): string {
    return path.join('.');
}

function readCodeSyntax(node: TokenNode, where: string): string | undefined {
    const extensions = node['$extensions'];
    const figma = isObject(extensions) ? extensions[FIGMA_EXTENSION] : undefined;
    const codeSyntax = isObject(figma) ? figma['codeSyntax'] : undefined;
    const web = isObject(codeSyntax) ? codeSyntax['WEB'] : undefined;

    if (web !== undefined && typeof web !== 'string') {
        throw new Error(`${where}: the WEB code syntax must be a string`);
    }
    return web;
}

/**
 * Collects the tokens of a parsed token file, in the order that they appear in the file.
 *
 * A node with a `$value` is a token, and any other object is a group. A token inherits its `$type` from the nearest
 * group that sets one.
 *
 * @param content The parsed content of the file.
 * @param source The name of the file, used in error messages.
 * @throws {Error} When the content is not a DTCG token tree, or uses a name or type that the build does not support.
 */
export function collectTokens(content: unknown, source: string): Token[] {
    if (!isObject(content)) {
        throw new Error(`${source}: the file must contain an object`);
    }
    const tokens: Token[] = [];

    const visit = (node: TokenNode, path: string[], inheritedType: unknown): void => {
        const where = `${source}: "${formatPath(path)}"`;
        const type = node['$type'] ?? inheritedType;

        if ('$value' in node) {
            if (!isTokenType(type)) {
                throw new Error(
                    `${where}: unsupported type "${String(type)}", expected one of ${TOKEN_TYPES.join(', ')}`,
                );
            }
            const description = node['$description'];
            const extensions = node['$extensions'];

            if (description !== undefined && typeof description !== 'string') {
                throw new Error(`${where}: the description must be a string`);
            }
            if (extensions !== undefined && !isObject(extensions)) {
                throw new Error(`${where}: the extensions must be an object`);
            }
            tokens.push({
                path,
                type,
                value: node['$value'],
                description,
                codeSyntax: readCodeSyntax(node, where),
                extensions,
                source,
            });
            return;
        }

        for (const [name, child] of Object.entries(node)) {
            if (name.startsWith('$')) {
                continue;
            }
            if (!NAME_PATTERN.test(name)) {
                throw new Error(
                    `${source}: "${formatPath([...path, name])}" has an invalid name, use lowercase letters, digits, and hyphens`,
                );
            }
            if (!isObject(child)) {
                throw new Error(`${source}: "${formatPath([...path, name])}" must be a group or a token`);
            }
            visit(child, [...path, name], type);
        }
    };

    visit(content, [], undefined);
    return tokens;
}
