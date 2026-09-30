# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-09-30

### Added

- The 59 semantic tokens of the `Design system` Figma library: 22 colors, 10 spacing steps, 20 typography tokens, and 7 radius steps.
- `tokens.css`, available as `@dnd-mapp/design-tokens/tokens.css`. It declares every token as a custom property on `:root`, with a `--dma-` prefix.
- `oklch()` values for the color tokens, converted from the sRGB colors of the Figma variables.
- `light-dark()` values for the color tokens that differ between Light and Dark mode, with `color-scheme: light dark` on `:root`.
- The `tokens` object from the package root, with a `var()` reference for every token, and its type declarations.
- The `values` object from the package root, with the CSS value of every token. A color has a `light` and a `dark` value.
- A Sass module, found through the `sass` export condition, or as `@dnd-mapp/design-tokens/index.scss`. It has a variable with the `var()` reference of every token, and the `$tokens` and `$values` maps.
- The DTCG token files `light.tokens.json` and `dark.tokens.json`, with the aliases resolved, and the colors in the `oklch` color space with an sRGB `hex` fallback.
- A group of tokens for each of the 11 text styles of the `Design system` Figma library, such as `Body/Medium`. The `font-family`, `font-size`, `font-weight`, `line-height`, and `letter-spacing` tokens of a style refer to the typography tokens.
- A `font` token for each text style, such as `--dma-text-body-medium-font`, with a CSS `font` shorthand composed from the tokens of the style. The DTCG token files hold it as a `typography` token.
- `fonts.css`, available as `@dnd-mapp/design-tokens/fonts.css`. It declares the variable Inter and JetBrains Mono fonts, upright and italic, with a `@font-face` rule for each subset and style. The package includes the font files and their SIL Open Font License 1.1.

[Unreleased]: https://github.com/dnd-mapp/design-tokens/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/dnd-mapp/design-tokens/releases/tag/v1.0.0
