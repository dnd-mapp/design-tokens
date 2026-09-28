import { isObject, type TokenType, TYPOGRAPHY_MEMBERS, type TypographyMember } from './tokens.ts';

/** Font families that CSS defines as keywords. They must stay unquoted. */
const GENERIC_FAMILIES = new Set([
    'serif',
    'sans-serif',
    'monospace',
    'cursive',
    'fantasy',
    'system-ui',
    'ui-serif',
    'ui-sans-serif',
    'ui-monospace',
    'ui-rounded',
    'math',
    'emoji',
    'fangsong',
]);

const DIMENSION_UNITS = ['px', 'rem'];

function isUnitInterval(value: unknown): value is number {
    return typeof value === 'number' && value >= 0 && value <= 1;
}

function toHexByte(channel: number): string {
    return Math.round(channel * 255)
        .toString(16)
        .padStart(2, '0');
}

/** Formats a DTCG sRGB color as a hex color, with an alpha byte when it is not opaque. */
function formatColor(value: unknown): string {
    if (!isObject(value) || value['colorSpace'] !== 'srgb') {
        throw new Error('a color must be an object with the "srgb" color space');
    }
    const { components, alpha = 1, hex } = value;

    if (!Array.isArray(components) || components.length !== 3 || !components.every(isUnitInterval)) {
        throw new Error('a color needs three components between 0 and 1');
    }
    if (!isUnitInterval(alpha)) {
        throw new Error('the alpha of a color must be between 0 and 1');
    }
    const rgb = `#${components.map(toHexByte).join('')}`;

    // The components are the value, and the hex is a fallback. A mismatch means one of them is wrong.
    if (hex !== undefined && (typeof hex !== 'string' || hex.toLowerCase() !== rgb)) {
        throw new Error(`the hex ${JSON.stringify(hex)} does not match the components, which are ${rgb}`);
    }
    return alpha < 1 ? `${rgb}${toHexByte(alpha)}` : rgb;
}

function formatDimension(value: unknown): string {
    if (!isObject(value) || typeof value['value'] !== 'number' || !DIMENSION_UNITS.includes(value['unit'] as string)) {
        throw new Error(
            `a dimension must be an object with a number value and a unit of ${DIMENSION_UNITS.join(' or ')}`,
        );
    }
    // CSS needs no unit for zero, and the Figma descriptions write it as a bare 0.
    return value['value'] === 0 ? '0' : `${value['value']}${value['unit'] as string}`;
}

function formatFontFamily(value: unknown): string {
    const families = Array.isArray(value) ? value : [value];

    if (families.length === 0 || !families.every((family) => typeof family === 'string' && family !== '')) {
        throw new Error('a font family must be a name or a list of names');
    }
    return (families as string[])
        .map((family) => (GENERIC_FAMILIES.has(family) || /^[A-Za-z-]+$/.test(family) ? family : `"${family}"`))
        .join(', ');
}

function formatFontWeight(value: unknown): string {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 1000) {
        throw new Error('a font weight must be a whole number from 1 to 1000');
    }
    return String(value);
}

function formatNumber(value: unknown): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error('a number token must have a finite number value');
    }
    return String(value);
}

/** Returns the token type of a resolved typography member. A line height can be a number or a dimension. */
export function typographyMemberType(member: TypographyMember, value: unknown): TokenType {
    const types: readonly TokenType[] = TYPOGRAPHY_MEMBERS[member];

    return typeof value === 'number' && types.includes('number') ? 'number' : types[0]!;
}

/** Formats a typography value as a CSS `font` shorthand. The shorthand cannot set the letter spacing. */
function formatTypography(value: unknown): string {
    const members = Object.keys(TYPOGRAPHY_MEMBERS) as TypographyMember[];

    if (!isObject(value) || Object.keys(value).length !== members.length || !members.every((m) => m in value)) {
        throw new Error(`a typography value must have exactly the members ${members.join(', ')}`);
    }
    const [family, size, weight, lineHeight] = members.map((member) => {
        try {
            return formatValue(typographyMemberType(member, value[member]), value[member]);
        } catch (error) {
            throw new Error(`its ${member} is invalid, ${(error as Error).message}`, { cause: error });
        }
    });

    return `${weight} ${size}/${lineHeight} ${family}`;
}

const formatters: Record<TokenType, (value: unknown) => string> = {
    color: formatColor,
    dimension: formatDimension,
    fontFamily: formatFontFamily,
    fontWeight: formatFontWeight,
    number: formatNumber,
    typography: formatTypography,
};

/**
 * Formats a resolved token value as a CSS value.
 *
 * @throws {Error} When the value does not have the shape that DTCG defines for the type.
 */
export function formatValue(type: TokenType, value: unknown): string {
    return formatters[type](value);
}
