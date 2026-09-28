# @dnd-mapp/design-tokens

[![push main](https://github.com/dnd-mapp/design-tokens/actions/workflows/push-main.yaml/badge.svg?branch=main)](https://github.com/dnd-mapp/design-tokens/actions/workflows/push-main.yaml)
[![npm version](https://img.shields.io/npm/v/@dnd-mapp/design-tokens)](https://www.npmjs.com/package/@dnd-mapp/design-tokens)
[![license](https://img.shields.io/npm/l/@dnd-mapp/design-tokens)](LICENSE)

The design tokens of the D&D Mapp Figma library, as CSS custom properties, typed constants, a Sass module, and DTCG token files.

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

### Text styles

Every text style in Figma has a group of tokens, so `Heading/Large` becomes `--dma-text-heading-large-*`. Set a whole style with its `font` token, which holds a CSS `font` shorthand.

```css
h1 {
    font: var(--dma-text-heading-large-font);
}

.badge {
    font-size: var(--dma-text-label-small-font-size);
}
```

The other tokens of a style hold its parts, and refer to the typography tokens. The `font` token composes the parts, so a style follows every change to the typography tokens.

For example, the stylesheet declares these tokens for `Body/Medium`:

```css
:root {
    --dma-text-body-medium-font-family: var(--dma-font-family-sans);
    --dma-text-body-medium-font-size: var(--dma-font-size-16);
    --dma-text-body-medium-font-weight: var(--dma-font-weight-400);
    --dma-text-body-medium-line-height: var(--dma-line-height-24);
    --dma-text-body-medium-letter-spacing: 0;
    --dma-text-body-medium-font: var(--dma-text-body-medium-font-weight) var(--dma-text-body-medium-font-size)/var(--dma-text-body-medium-line-height) var(--dma-text-body-medium-font-family);
}
```

The `font` shorthand can't set the letter spacing, so that part has a token of its own. The shorthand also resets the other font properties, such as `font-style`, so set those after it.

| Figma text style | Tokens                        | Use for                                              |
|:-----------------|:------------------------------|:-----------------------------------------------------|
| `Display`        | `--dma-text-display-*`        | Page titles on documentation pages                   |
| `Heading/Large`  | `--dma-text-heading-large-*`  | Top-level headings in the app, such as a view title  |
| `Heading/Medium` | `--dma-text-heading-medium-*` | Section headings                                     |
| `Heading/Small`  | `--dma-text-heading-small-*`  | Subsection headings, and titles of cards and dialogs |
| `Body/Medium`    | `--dma-text-body-medium-*`    | The default text style                               |
| `Body/Small`     | `--dma-text-body-small-*`     | Body text where space is tight, such as tool panels  |
| `Label/Large`    | `--dma-text-label-large-*`    | Labels on large controls, and names in lists         |
| `Label/Medium`   | `--dma-text-label-medium-*`   | Labels on buttons, fields, and other controls        |
| `Label/Small`    | `--dma-text-label-small-*`    | Labels on small controls, such as badges             |
| `Caption`        | `--dma-text-caption-*`        | Helper text, metadata, and footnotes                 |
| `Code`           | `--dma-text-code-*`           | Code, token names, and other literal values          |

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
context.font = values.text.body.medium.font; // '400 1rem/1.5rem Inter, system-ui, sans-serif'
```

A color has a value for each mode, `light` and `dark`, even when the modes share it. Every other token has a single value. The values don't follow `color-scheme`, so pick the mode yourself. Spacing, radius, and font sizes are in rem, like in the stylesheet. The parts of a text style have the values of the typography tokens that they refer to.

### Sass

The package has a Sass module that emits no CSS, so you can load it with `@use` from any stylesheet. Its `sass` export condition lets the [Node.js package importer](https://sass-lang.com/documentation/js-api/classes/nodepackageimporter/) find it through a `pkg:` URL.

```scss
@use 'sass:map';
@use 'pkg:@dnd-mapp/design-tokens' as dma;

.card {
    padding: dma.$spacing-16;
    color: dma.$color-text-default;
}
```

Without the importer, add `node_modules` to the load paths of Sass, and use `@use '@dnd-mapp/design-tokens' as dma`.

Every token has a variable with its `var()` reference, named after its path without the prefix. The variables need the stylesheet, so load it as well. The module also has two maps, grouped like the `tokens` object:

- `$tokens` holds the `var()` references. Loop over it to generate classes, for example.
- `$values` holds the values as Sass values, so Sass math and color functions work on them. A color holds a map with a `'light'` and a `'dark'` value. A `font` shorthand is a list that you can set as a `font` value.

```scss
@each $step, $reference in map.get(dma.$tokens, 'spacing') {
    .gap-#{$step} {
        gap: $reference;
    }
}

.icon {
    width: map.get(dma.$values, 'spacing', 16) * 1.5;
}
```

A step that is a whole number, such as `16`, is a number key in the maps. Every other name, such as `'full'`, is a string key.

### DTCG token files

The package includes the tokens as [DTCG](https://www.designtokens.org/tr/2025.10/format/) token files, one for each mode: `light.tokens.json` and `dark.tokens.json`. Use them in tools that read DTCG, such as token viewers and documentation sites.

```ts
import light from '@dnd-mapp/design-tokens/light.tokens.json' with { type: 'json' };
```

The aliases are resolved, and every token has its own `$type`, so each file stands on its own. The tokens keep their description, and the metadata of their Figma variable in `$extensions`.

The `font` token of a text style is a DTCG `typography` token. DTCG defines its line height as a multiple of the font size, so a line height of `1.5rem` at a font size of `1rem` becomes `1.5`.

## Tokens

The package publishes the semantic colors, spacing, typography, and radius tokens, and a group of tokens for each text style. It leaves out the primitive color scales, such as `neutral/50`, because designs and code bind to semantic tokens only.

| Group         | Example                       | Value                                         |
|:--------------|:------------------------------|:----------------------------------------------|
| `color`       | `--dma-color-text-default`    | A hex color, or `light-dark()` of two         |
| `spacing`     | `--dma-spacing-16`            | `1rem`                                        |
| `font-family` | `--dma-font-family-sans`      | A font stack, such as `Inter, system-ui`      |
| `font-size`   | `--dma-font-size-16`          | `1rem`                                        |
| `line-height` | `--dma-line-height-24`        | `1.5rem`                                      |
| `font-weight` | `--dma-font-weight-600`       | `600`                                         |
| `radius`      | `--dma-radius-8`              | `0.5rem`, or `9999px` for `radius-full`       |
| `text`        | `--dma-text-body-medium-font` | A `font` shorthand, or a part of a text style |

The package does not load any fonts. Load Inter and JetBrains Mono in your app.

## Changelog

Notable changes for consumers of this package are listed in the [changelog](CHANGELOG.md).

## Contributing

Contributions are welcome. See the [contributing guide](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE) © D&D Mapp
