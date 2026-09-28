# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The 59 semantic tokens of the `Design system` Figma library: 22 colors, 10 spacing steps, 20 typography tokens, and 7 radius steps.
- `tokens.css`, available as `@dnd-mapp/design-tokens/tokens.css`. It declares every token as a custom property on `:root`, with a `--dma-` prefix.
- `light-dark()` values for the color tokens that differ between Light and Dark mode, with `color-scheme: light dark` on `:root`.
- The `tokens` object from the package root, with a `var()` reference for every token, and its type declarations.
- The `values` object from the package root, with the CSS value of every token. A color has a `light` and a `dark` value.
- A Sass module, found through the `sass` export condition, or as `@dnd-mapp/design-tokens/index.scss`. It has a variable with the `var()` reference of every token, and the `$tokens` and `$values` maps.

[Unreleased]: https://github.com/dnd-mapp/design-tokens/commits/main
