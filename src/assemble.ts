import { CSS_PREFIX, type Mode, MODES, PRIVATE_COLLECTIONS, TOKEN_FILE_EXTENSION } from './constants.ts';
import { aliasTarget, resolveTokens } from './resolve.ts';
import {
    collectTokens,
    formatPath,
    isObject,
    type Token,
    type TokenType,
    TYPOGRAPHY_MEMBERS,
    type TypographyMember,
} from './tokens.ts';
import { formatValue, toOklchColor, typographyMemberType } from './values.ts';

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
    /** The CSS value in each mode, for example `oklch(0.9819 0.00286 264.04)`. */
    modeValues: Record<Mode, string>;
    /** The DTCG `$value` in each mode, with the aliases resolved. A color is in the OKLCH color space. */
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

function cssName(path: string[]): string {
    return `${CSS_PREFIX}${path.join('-')}`;
}

/**
 * Creates a published token from its value in each mode.
 *
 * @param source The token in the token file, for its description, extensions, and error messages.
 * @param path The path of the published token, which differs from the source for the parts of a typography token.
 */
function createOutputToken(source: Token, path: string[], type: TokenType, resolvedValues: unknown[]): OutputToken {
    const where = `${source.source}: "${formatPath(path)}"`;
    const values = resolvedValues.map((value) => {
        try {
            return formatValue(type, value);
        } catch (error) {
            throw new Error(`${where} has an invalid value, ${(error as Error).message}`, { cause: error });
        }
    });
    const distinct = [...new Set(values)];

    if (distinct.length > 1 && type !== 'color') {
        throw new Error(`${where} differs between the modes, which only color tokens may do`);
    }
    return {
        path,
        type,
        name: cssName(path),
        value: distinct.length > 1 ? `light-dark(${values.join(', ')})` : distinct[0]!,
        modeValues: byMode(values),
        // The values are valid once they are formatted, so a color converts without an error.
        resolvedValues: byMode(type === 'color' ? resolvedValues.map(toOklchColor) : resolvedValues),
        description: source.description,
        extensions: source.extensions,
    };
}

/** Turns a camel case member name such as `fontSize` into a token name such as `font-size`. */
function kebabCase(name: string): string {
    return name.replaceAll(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * DTCG takes the line height of a typography value as a multiple of the font size, so a dimension becomes a ratio.
 *
 * @throws {Error} When the line height is not in the unit of the font size, or the font size is zero.
 */
function toDtcgTypography(source: Token, value: Record<string, unknown>): Record<string, unknown> {
    const fontSize = value['fontSize'] as { value: number; unit: string };
    const lineHeight = value['lineHeight'];

    if (!isObject(lineHeight)) {
        return value;
    }
    if (lineHeight['unit'] !== fontSize.unit || fontSize.value === 0) {
        throw new Error(
            `${source.source}: "${formatPath(source.path)}" needs a font size other than 0, and a line height in the same unit`,
        );
    }
    return { ...value, lineHeight: (lineHeight['value'] as number) / fontSize.value };
}

/**
 * Splits a typography token into a token for each member, such as `text.body.medium.font-size`, and a `font` token
 * with the CSS `font` shorthand.
 *
 * A member that refers to a published token gets a `var()` reference to it in the stylesheet, so a text style keeps
 * pointing at the typography tokens. The `font` token composes the `var()` references of the member tokens. The
 * shorthand cannot set the letter spacing, so that stays a token of its own.
 */
function expandTypography(
    token: Token,
    font: OutputToken,
    resolvedValues: unknown[],
    names: Map<string, string>,
): OutputToken[] {
    const raw = isObject(token.value) ? token.value : {};
    const members = Object.keys(TYPOGRAPHY_MEMBERS) as TypographyMember[];
    const parts = members.map((member) => {
        const memberValues = resolvedValues.map((value) => (value as Record<string, unknown>)[member]);
        const type = typographyMemberType(member, memberValues[0]);
        const part = createOutputToken(token, [...token.path, kebabCase(member)], type, memberValues);
        const target = names.get(aliasTarget(raw[member]) ?? '');

        return {
            ...part,
            value: target ? `var(${target})` : part.value,
            description: undefined,
            extensions: undefined,
        };
    });
    const [family, size, weight, lineHeight] = parts.map((part) => `var(${part.name})`);

    return [
        ...parts,
        {
            ...font,
            path: [...token.path, 'font'],
            name: cssName([...token.path, 'font']),
            value: `${weight} ${size}/${lineHeight} ${family}`,
            resolvedValues: byMode(
                resolvedValues.map((value) => toDtcgTypography(token, value as Record<string, unknown>)),
            ),
        },
    ];
}

/**
 * Turns the token files into the tokens to publish.
 *
 * Files without a mode apply to every mode. The build resolves the aliases once per mode, so a token file of one mode
 * can refer to the shared tokens and to the tokens of the same mode. The tokens of the private collections are left
 * out of the result. A typography token becomes a token for each of its members, and a `font` token.
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
    const names = new Map(published.map((token) => [formatPath(token.path), cssName(token.path)]));

    return published.flatMap((token) => {
        const path = formatPath(token.path);
        checkCodeSyntax(token, cssName(token.path));

        const resolvedValues = resolved.map((values) => values.get(path));
        const output = createOutputToken(token, token.path, token.type, resolvedValues);

        return token.type === 'typography' ? expandTypography(token, output, resolvedValues, names) : [output];
    });
}
