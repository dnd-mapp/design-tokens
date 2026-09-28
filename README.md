# @dnd-mapp/design-tokens

[![push main](https://github.com/dnd-mapp/design-tokens/actions/workflows/push-main.yaml/badge.svg?branch=main)](https://github.com/dnd-mapp/design-tokens/actions/workflows/push-main.yaml)
[![npm version](https://img.shields.io/npm/v/@dnd-mapp/design-tokens)](https://www.npmjs.com/package/@dnd-mapp/design-tokens)
[![license](https://img.shields.io/npm/l/@dnd-mapp/design-tokens)](LICENSE)

The design tokens of the D&D Mapp Figma library, as CSS custom properties and typed constants.

The tokens come from the variables in the `Design system` Figma file. Every token has the name of its WEB code syntax in Figma, so Dev Mode and code use the same names. For example, `color/text/default` becomes `--dma-color-text-default`.

## Installation

```bash
pnpm add @dnd-mapp/design-tokens
```

## Usage

### CSS

Load the stylesheet once, for example from the global styles of your app.

```css
@import "@dnd-mapp/design-tokens/tokens.css";

.card {
    padding: var(--dma-spacing-16);
    border-radius: var(--dma-radius-8);
    color: var(--dma-color-text-default);
    background: var(--dma-color-background-default);
}
```

The stylesheet declares every token on `:root`. Spacing, radius, and font sizes are in rem, so they scale with the font size of the user.

### Light and dark mode

A color token that differs between the modes gets a [`light-dark()`](https://developer.mozilla.org/docs/Web/CSS/color_value/light-dark) value. The browser picks the value from the `color-scheme` of the element that uses the token.

The stylesheet sets `color-scheme: light dark` on `:root`, so the colors follow the system setting. Set `color-scheme` to force a mode, for the whole page or for part of it.

```css
:root[data-theme="dark"] {
    color-scheme: dark;
}

.always-light {
    color-scheme: light;
}
```

### TypeScript and JavaScript

The package exports a `tokens` object with a `var()` reference for every token. Its structure follows the variable names in Figma. Use it where you set styles from code.

```ts
import { tokens } from '@dnd-mapp/design-tokens';

element.style.gap = tokens.spacing[16]; // "var(--dma-spacing-16)"
element.style.color = tokens.color.text.default; // "var(--dma-color-text-default)"
```

Every reference has a literal type, so a typo in a token name fails to compile. Editors show the description and the CSS value of a token on hover. The references need the stylesheet, so load it as well.

### Values

The package also exports a `values` object, with the CSS value of every token in the same structure. Use it where a `var()` reference doesn't work, for example when you draw on a `<canvas>` or set `<meta name="theme-color">`.

```ts
import { values } from '@dnd-mapp/design-tokens';

const mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

context.fillStyle = values.color.background.accent[mode]; // "#971318" or "#feaa98"
context.font = `${values['font-weight'][600]} 16px ${values['font-family'].sans}`;
```

A color has a value for each mode, `light` and `dark`, even when the modes share it. Every other token has a single value. The values don't follow `color-scheme`, so pick the mode yourself. Spacing, radius, and font sizes are in rem, like in the stylesheet.

## Tokens

The package publishes the semantic colors, spacing, typography, and radius tokens. It leaves out the primitive color scales, such as `neutral/50`, because designs and code bind to semantic tokens only.

| Group         | Example                    | Value                                    |
|:--------------|:---------------------------|:-----------------------------------------|
| `color`       | `--dma-color-text-default` | A hex color, or `light-dark()` of two    |
| `spacing`     | `--dma-spacing-16`         | `1rem`                                   |
| `font-family` | `--dma-font-family-sans`   | A font stack, such as `Inter, system-ui` |
| `font-size`   | `--dma-font-size-16`       | `1rem`                                   |
| `line-height` | `--dma-line-height-24`     | `1.5rem`                                 |
| `font-weight` | `--dma-font-weight-600`    | `600`                                    |
| `radius`      | `--dma-radius-8`           | `0.5rem`, or `9999px` for `radius-full`  |

The package does not load any fonts. Load Inter and JetBrains Mono in your app.

## Changelog

Notable changes for consumers of this package are listed in the [changelog](CHANGELOG.md).

## Contributing

Contributions are welcome. See the [contributing guide](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE) © D&D Mapp
