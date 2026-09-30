import type { TokenFile } from '../src/assemble.ts';

/** Creates a DTCG sRGB color. */
export function srgb(hex: string, components: number[]) {
    return { colorSpace: 'srgb', components, hex };
}

/** Creates a DTCG OKLCH color, the way the build writes it. */
export function oklch(hex: string, components: number[]) {
    return { colorSpace: 'oklch', components, hex };
}

/** A small set of token files in the layout of the real ones: primitives, colors in two modes, and shared values. */
export const tokenFiles: TokenFile[] = [
    {
        name: 'color.dark.tokens.json',
        content: {
            color: {
                $type: 'color',
                text: { default: { $value: '{neutral.0}' } },
                border: { focus: { $value: '{amber.500}' } },
            },
        },
    },
    {
        name: 'color.light.tokens.json',
        content: {
            color: {
                $type: 'color',
                text: {
                    default: {
                        $value: '{neutral.1000}',
                        $extensions: { 'com.figma': { codeSyntax: { WEB: 'var(--dma-color-text-default)' } } },
                    },
                },
                border: { focus: { $value: '{amber.500}' } },
            },
        },
    },
    {
        name: 'primitives.tokens.json',
        content: {
            neutral: {
                '$type': 'color',
                '0': { $value: srgb('#ffffff', [1, 1, 1]) },
                '1000': { $value: srgb('#000000', [0, 0, 0]) },
            },
            amber: { '$type': 'color', '500': { $value: srgb('#ff8000', [1, 0.5, 0]) } },
        },
    },
    {
        name: 'spacing.tokens.json',
        content: {
            spacing: {
                '$type': 'dimension',
                '16': { $value: { value: 1, unit: 'rem' }, $description: '1rem (16px) in code.' },
            },
        },
    },
];
