import { CSS_PREFIX, type Mode, MODES, PRIVATE_COLLECTIONS, TOKEN_FILE_EXTENSION } from './constants.ts';
import { resolveTokens } from './resolve.ts';
import { collectTokens, formatPath, type Token, type TokenType } from './tokens.ts';
import { formatValue } from './values.ts';

/** A token file and its parsed content. */
export interface TokenFile {
    /** The name of the file in the tokens directory, for example `color.light.tokens.json`. */
    name: string;
    content: unknown;
}

/** A published token, ready to be written to the outputs. */
export interface OutputToken {
    path: string[];
    type: TokenType;
    /** The name of the CSS custom property, for example `--dma-color-text-default`. */
    name: string;
    /** The CSS value. A token that differs between the modes gets a `light-dark()` value. */
    value: string;
    /** The CSS value in each mode, for example `#f8f9fb`. */
    modeValues: Record<Mode, string>;
    /** The `$value` in each mode, with the aliases resolved, for example a DTCG color. */
    resolvedValues: Record<Mode, unknown>;
    description: string | undefined;
    extensions: Record<string, unknown> | undefined;
}

function byMode<T>(values: T[]): Record<Mode, T> {
    return Object.fromEntries(MODES.map((mode, index) => [mode, values[index]])) as Record<Mode, T>;
}

/** Splits a file name such as `color.light.tokens.json` into its collection and, when it has one, its mode. */
function parseFileName(name: string): { collection: string; mode: Mode | undefined } {
    const [collection = '', mode, ...rest] = name.slice(0, -TOKEN_FILE_EXTENSION.length).split('.');

    if (collection === '' || rest.length > 0 || (mode !== undefined && !MODES.includes(mode as Mode))) {
        throw new Error(
            `"${name}" is not a valid token file name, use <collection>${TOKEN_FILE_EXTENSION} or <collection>.<${MODES.join('|')}>${TOKEN_FILE_EXTENSION}`,
        );
    }
    return { collection, mode: mode as Mode | undefined };
}

/** Checks that every mode defines the same tokens, so that each token has a value in every mode. */
function checkModes(modeTokens: Record<Mode, Token[]>): void {
    const [first, ...others] = MODES;
    const expected = new Set(modeTokens[first].map((token) => formatPath(token.path)));

    for (const mode of others) {
        const actual = new Set(modeTokens[mode].map((token) => formatPath(token.path)));
        const missing = [...expected].filter((path) => !actual.has(path)).map((path) => `"${path}" in ${mode}`);
        const extra = [...actual].filter((path) => !expected.has(path)).map((path) => `"${path}" in ${first}`);

        if (missing.length > 0 || extra.length > 0) {
            throw new Error(`Every mode must define the same tokens. Missing: ${[...missing, ...extra].join(', ')}`);
        }
    }
}

function checkCodeSyntax(token: Token, name: string): void {
    const expected = `var(${name})`;

    if (token.codeSyntax !== undefined && token.codeSyntax !== expected) {
        throw new Error(
            `${token.source}: "${formatPath(token.path)}" has the WEB code syntax "${token.codeSyntax}", expected "${expected}"`,
        );
    }
}

/**
 * Turns the token files into the tokens to publish.
 *
 * Files without a mode apply to every mode. The build resolves the aliases once per mode, so a token file of one mode
 * can refer to the shared tokens and to the tokens of the same mode. The tokens of the private collections are left
 * out of the result.
 *
 * @param files The token files, in the order to publish their tokens.
 * @throws {Error} When a file name or token is not valid, an alias cannot be resolved, or the modes do not match.
 */
export function assembleTokens(files: TokenFile[]): OutputToken[] {
    const [first] = MODES;
    const shared: Token[] = [];
    const modeTokens = Object.fromEntries(MODES.map((mode) => [mode, [] as Token[]])) as Record<Mode, Token[]>;
    // The tokens to publish, in file order. The first mode stands in for the other modes of a collection.
    const published: Token[] = [];

    for (const file of files) {
        const { collection, mode } = parseFileName(file.name);
        const tokens = collectTokens(file.content, file.name);

        (mode ? modeTokens[mode] : shared).push(...tokens);

        if (!PRIVATE_COLLECTIONS.includes(collection) && (mode === undefined || mode === first)) {
            published.push(...tokens);
        }
    }
    checkModes(modeTokens);

    const resolved = MODES.map((mode) => resolveTokens([...shared, ...modeTokens[mode]]));

    return published.map((token) => {
        const path = formatPath(token.path);
        const name = `${CSS_PREFIX}${token.path.join('-')}`;
        checkCodeSyntax(token, name);

        const resolvedValues = resolved.map((values) => values.get(path));
        const values = resolvedValues.map((value) => {
            try {
                return formatValue(token.type, value);
            } catch (error) {
                throw new Error(`${token.source}: "${path}" has an invalid value, ${(error as Error).message}`, {
                    cause: error,
                });
            }
        });
        const distinct = [...new Set(values)];

        if (distinct.length > 1 && token.type !== 'color') {
            throw new Error(`${token.source}: "${path}" differs between the modes, which only color tokens may do`);
        }
        const value = distinct.length > 1 ? `light-dark(${values.join(', ')})` : distinct[0]!;

        return {
            path: token.path,
            type: token.type,
            name,
            value,
            modeValues: byMode(values),
            resolvedValues: byMode(resolvedValues),
            description: token.description,
            extensions: token.extensions,
        };
    });
}
