# Contributing to dnd-mapp/design-tokens

This page adds the details of `dnd-mapp/design-tokens` to the [shared contributing guide](https://github.com/dnd-mapp/.github/blob/main/CONTRIBUTING.md). Read that guide first, including the section on [frontend repositories](https://github.com/dnd-mapp/.github/blob/main/CONTRIBUTING.md#frontend-repositories).

This package publishes the design tokens of the D&D Mapp Figma library for all D&D Mapp apps. The variables in the `Design system` Figma file are the source of truth, and this repository turns them into CSS, JavaScript, Sass, and DTCG files. Change a token in Figma first, and bring it here as described under [Updating the tokens](#updating-the-tokens).

## Project layout

The token files live in `tokens`. The build script lives in `src`, and most modules have a `.spec.ts` file next to them.

| File               | Purpose                                                                             |
|:-------------------|:------------------------------------------------------------------------------------|
| `tokens`           | The DTCG token files, one for each Figma collection and mode                        |
| `fonts`            | The font files, their licenses, and `fonts.css`, published as they are              |
| `src/build.ts`     | The script behind the `build` script. It runs on import                             |
| `src/constants.ts` | The directories, the CSS prefix, the modes, and the private collections             |
| `src/tokens.ts`    | Collects the tokens of a token file                                                 |
| `src/resolve.ts`   | Resolves aliases to the values that they refer to                                   |
| `src/values.ts`    | Formats token values as CSS values                                                  |
| `src/assemble.ts`  | Combines the files and modes into the tokens to publish, and checks them            |
| `src/outputs.ts`   | Writes the stylesheet, the module and its declarations, Sass, and DTCG token files  |
| `testing`          | The mocks of the file system and the console, and a small set of sample token files |

Import other files with the `.ts` extension. Node.js runs the build script without a compile step, and `tsc` accepts the extension because `allowImportingTsExtensions` is on.

## Token files

The token files follow the [DTCG format](https://www.designtokens.org/tr/2025.10/format/). Each Figma collection has its own file, named `<collection>.tokens.json`. A collection with modes has a file for each mode, named `<collection>.<mode>.tokens.json`. The text styles have a file of their own.

| File                      | Figma source        | Published |
|:--------------------------|:--------------------|:----------|
| `primitives.tokens.json`  | `Primitives`        | No        |
| `color.light.tokens.json` | `Color`, Light mode | Yes       |
| `color.dark.tokens.json`  | `Color`, Dark mode  | Yes       |
| `spacing.tokens.json`     | `Spacing`           | Yes       |
| `typography.tokens.json`  | `Typography`        | Yes       |
| `radius.tokens.json`      | `Radius`            | Yes       |
| `text.tokens.json`        | The text styles     | Yes       |

Each `/` in a variable name starts a nested group, so `color/text/default` becomes the `default` token in the `text` group of the `color` group. Set `$type` on the top-level group, and every token in it inherits it. Keep the order of the variables in Figma.

| `$type`      | In Figma                                      | `$value` example                                                      |
|:-------------|:----------------------------------------------|:----------------------------------------------------------------------|
| `color`      | Colors                                        | `{ "colorSpace": "srgb", "components": [1, 1, 1], "hex": "#ffffff" }` |
| `dimension`  | Spacing, font sizes, line heights, and radius | `{ "value": 1, "unit": "rem" }`                                       |
| `fontFamily` | Font families                                 | `["Inter", "system-ui", "sans-serif"]`                                |
| `fontWeight` | Font weights                                  | `600`                                                                 |
| `number`     | Other numbers                                 | `1.5`                                                                 |
| `typography` | Text styles                                   | An object with the members that [Text styles](#text-styles) lists     |

Follow these rules when you write a token file:

- Write the value that code uses. Take the rem value and the font stack from the description of the variable, for example "1rem (16px) in code.". `radius/full` stays `9999px`.
- Write a variable that points at another variable as an alias, such as `"{neutral.900}"`. Never copy the value.
- Write color components between 0 and 1. The `hex` is optional, and the build checks that it matches the components.
- Copy the description of the variable into `$description`. Editors show it on hover.
- Copy the WEB code syntax and the scopes of the variable into `$extensions`, under `com.figma`. The build checks the code syntax against the name of the custom property.

```json
{
    "color": {
        "$type": "color",
        "text": {
            "default": {
                "$value": "{neutral.900}",
                "$description": "Body text and icons.",
                "$extensions": {
                    "com.figma": {
                        "codeSyntax": { "WEB": "var(--dma-color-text-default)" },
                        "scopes": ["TEXT_FILL", "SHAPE_FILL"]
                    }
                }
            }
        }
    }
}
```

The build publishes every token except those in `primitives.tokens.json`. It resolves the aliases into plain values, so the primitives never reach the package. The parts of a text style are the one exception, as described under [Text styles](#text-styles). The files of each mode must define the same tokens.

### Text styles

Each text style is a `typography` token in `text.tokens.json`. Lowercase the name of the style and split it at each `/`, so `Heading/Large` becomes the `large` token in the `heading` group of the `text` group. Copy the description of the style into `$description`.

A `typography` value has these members. Write each member that the style binds to a variable as an alias to that variable.

| Member          | Figma field    | `$value` example                              |
|:----------------|:---------------|:----------------------------------------------|
| `fontFamily`    | Font family    | `"{font-family.sans}"`                        |
| `fontSize`      | Font size      | `"{font-size.16}"`                            |
| `fontWeight`    | Font weight    | `"{font-weight.400}"`                         |
| `lineHeight`    | Line height    | `"{line-height.24}"`, a dimension or a number |
| `letterSpacing` | Letter spacing | `{ "value": 0, "unit": "px" }`, a dimension   |

DTCG allows only a number for `lineHeight`, as a multiple of the font size. The token files also allow a dimension, because the text styles bind their line heights to the `line-height` tokens. The DTCG token files that the build writes hold the multiple.

```json
{
    "text": {
        "$type": "typography",
        "body": {
            "medium": {
                "$value": {
                    "fontFamily": "{font-family.sans}",
                    "fontSize": "{font-size.16}",
                    "fontWeight": "{font-weight.400}",
                    "lineHeight": "{line-height.24}",
                    "letterSpacing": { "value": 0, "unit": "px" }
                },
                "$description": "The default text style."
            }
        }
    }
}
```

The build turns each text style into a token for each member, such as `text.body.medium.font-size`, and a `font` token with the CSS `font` shorthand. A member that refers to a published token gets a `var()` reference to it in the stylesheet. The `font` token composes the `var()` references of the other tokens of the style.

### Order of the tokens

JavaScript puts object keys that are whole numbers first, in ascending order. So the steps of a scale, such as `spacing/8` and `spacing/16`, come out in ascending order, whatever their order in the file.

## Updating the tokens

1. Publish the `Design system` library in Figma.
2. Export the variables of every collection and mode, and read the text styles, from the `Design system` file.
3. Convert the export and the text styles into the token files, following the rules under [Token files](#token-files).
4. Run `pnpm run build`, and check `dist/tokens.css` for the changes that you expect.
5. Record the changes in `CHANGELOG.md`, and open a pull request.

## Updating the fonts

The `fonts` directory holds the variable Inter and JetBrains Mono fonts from [Fontsource](https://fontsource.org), both upright and italic. It has a `.woff2` file for each subset and style, and `fonts.css` declares a `@font-face` rule for each file. Update them together:

1. Download the files of the new Fontsource version from jsDelivr, for example `https://cdn.jsdelivr.net/npm/@fontsource-variable/inter@5.3.0/files/inter-latin-wght-normal.woff2`. Each subset has a `normal` and an `italic` file.
2. Download the `LICENSE` file of each package, such as `https://cdn.jsdelivr.net/npm/@fontsource-variable/inter@5.3.0/LICENSE`, into `inter-OFL.txt` or `jetbrains-mono-OFL.txt`.
3. Take the subsets and their `unicode-range` from the Fontsource API, such as `https://api.fontsource.org/v1/fonts/inter`, and update the rules in `fonts.css`.
4. Update the Fontsource version in the comment at the top of `fonts.css`.
5. Run `pnpm exec prepare-dist`, and check that the fonts load from `dist/fonts/fonts.css` in a browser.

A new subset adds a file, which is a minor change. Removing a subset or a font is a major change.

## Building and testing

The `build` script reads the token files and writes the outputs to `dist`: `tokens.css`, `index.js`, `index.d.ts`, `index.scss`, and a DTCG token file for each mode, such as `light.tokens.json`. The `prepublishOnly` script runs the build, and then `prepare-dist` from `@dnd-mapp/package-builder` adds the manifest, the docs, and the `fonts` directory.

The build stops with an error, and writes nothing, when a token file breaks a rule. It checks these things:

- The names of the files, groups, and tokens.
- The type and the shape of every value.
- That every alias refers to an existing token of the same type, without a cycle. An alias in a text style must refer to a type that its member accepts.
- That every mode defines the same tokens, and that only colors differ between the modes.
- That the WEB code syntax matches the name of the custom property.

Tests use Vitest. They replace `node:fs/promises` and the console with the mocks in `testing`, so no test touches the real file system. The tests of the Sass module compile it with Sass, to check that stylesheets can use it. Coverage must stay above the thresholds in `vitest.config.ts`.

The Vitest globals, such as `describe`, `it`, `expect`, and `vi`, are available in the specs and in `testing` without an import. `tsconfig.json` refers to two projects: `tsconfig.tools.json` for the build script and the config files, and `tsconfig.spec.json` for the specs and `testing`. Only the second project has the types of the globals, so the build script cannot use them by mistake.

## Checks

On top of the [shared checks](https://github.com/dnd-mapp/.github/blob/main/CONTRIBUTING.md#checks), CI runs `lint-ts`, `typecheck`, `test-ci`, and `build`. Run them yourself before you open a pull request.

```bash
pnpm run lint-ts
pnpm run typecheck
pnpm run test-ci
pnpm run build
```

The `lint-ts` script lints the code with ESLint. The `typecheck` script checks both TypeScript projects with `tsc -b`. Use `pnpm test` to run the tests in watch mode with the Vitest UI.

## Changelog and versioning

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Record every notable change for consumers under `[Unreleased]` in `CHANGELOG.md`, using the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

The names of the custom properties, the keys of the `tokens` and `values` objects, the names of the Sass variables and map keys, the font families in `fonts.css`, and the exported files are the public API.

| Change                                                         | Version bump |
|:---------------------------------------------------------------|:-------------|
| Remove or rename a token, or remove or rename an exported file | Major        |
| Add a token or an exported file                                | Minor        |
| Change the value of a token                                    | Patch        |

Say so in the changelog entry when a change is breaking, and list the old and new name of every renamed token.

## Releasing

1. Run the [prepare release workflow](../../.github/workflows/prepare-release.yaml) on `main` with the part of the version to bump, for example `gh workflow run prepare-release.yaml -f bump=minor`. It opens the `chore: release X.Y.Z` pull request with auto-merge on.
2. Review and approve the pull request. Once it merges, the `tag` job of the [push workflow](../../.github/workflows/push-main.yaml) creates the annotated tag `vX.Y.Z` on the merge commit.
3. The [release workflow](../../.github/workflows/release.yaml) runs the CI checks, verifies the tag and the changelog, stages the package on npm, and creates the GitHub Release, which opens a discussion in the Announcements category.
4. Find the staged version with `pnpm stage list` and approve it with `pnpm stage approve <id>` and 2FA.

If the staged version is wrong, reject it with `pnpm stage reject <id>`. The same version cannot be staged again until then.
