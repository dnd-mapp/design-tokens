# Contributing

Thank you for your interest in contributing to `@dnd-mapp/design-tokens`.

This package publishes the design tokens of the D&D Mapp Figma library for all D&D Mapp apps. The variables in the `Design system` Figma file are the source of truth, and this repository turns them into CSS and JavaScript files.

## Development setup

The required Node and pnpm versions are set in `devEngines` in `package.json`. They are enforced through `engineStrict`, so installing with other versions fails.

Install the dependencies with:

```bash
pnpm install
```

Dependency versions live in the catalogs in `pnpm-workspace.yaml`, which uses `catalogMode: strict`. Add or bump versions there and reference them in `package.json`. Use `catalog:` for the default catalog and a named catalog such as `catalog:vitest` for a group of tools.

Newly published releases are held back for three days through `minimumReleaseAge`. You may need to wait before you can bump to a very recent version.

Install [actionlint](https://github.com/rhysd/actionlint) to lint the workflows locally, for example with `brew install actionlint`. CI runs the version that `.github/actions/ci/action.yaml` pins.

## Git hooks

[Lefthook](https://lefthook.dev/) installs the Git hooks when you run `pnpm install`. The hooks are defined in `lefthook.yaml`. `pnpm-workspace.yaml` turns off the side-effects cache of pnpm, because a cached build of lefthook skips the script that installs the hooks. If the hooks are still missing, install them with `pnpm exec lefthook install`.

| Hook         | Runs                                           | On                        |
|:-------------|:-----------------------------------------------|:--------------------------|
| `pre-commit` | Prettier, markdownlint-cli2, and ESLint checks | The staged files          |
| `commit-msg` | commitlint                                     | The message of the commit |

The pre-commit hooks only check files. Run `pnpm run format` to fix formatting issues, and `pnpm exec eslint --fix` to apply the fixes that ESLint can make. Stage the result.

## Building and testing

Tests use Vitest. They replace `node:fs/promises` and the console with the mocks in `testing`, so no test touches the real file system. Coverage must stay above the thresholds in `vitest.config.ts`.

Check and format the repository with these commands. CI runs `format-check`, `lint-md`, `lint-ts`, `typecheck`, `test-ci`, `build`, and actionlint. Run them yourself before you open a pull request.

```bash
pnpm run format-check
pnpm run format
pnpm run lint-md
pnpm run lint-ts
pnpm run typecheck
pnpm run test-ci
pnpm run build
actionlint
```

The `lint-md` script lints the Markdown files with markdownlint, and the `lint-ts` script lints the code with ESLint. Use `pnpm test` to run the tests in watch mode with the Vitest UI.

## Changelog and versioning

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Record every notable change for consumers under `[Unreleased]` in `CHANGELOG.md`, using the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

| Change                                                         | Version bump |
|:---------------------------------------------------------------|:-------------|
| Remove or rename a token, or remove or rename an exported file | Major        |
| Add a token or an exported file                                | Minor        |
| Change the value of a token                                    | Patch        |

Say so in the changelog entry when a change is breaking, and list the old and new name of every renamed token.

## Releasing

1. Run the [prepare release workflow](.github/workflows/prepare-release.yaml) on `main` with the part of the version to bump, for example `gh workflow run prepare-release.yaml -f bump=minor`. It opens the `chore: release X.Y.Z` pull request with auto-merge on.
2. Review and approve the pull request. Once it merges, the `tag` job of the [push workflow](.github/workflows/push-main.yaml) creates the annotated tag `vX.Y.Z` on the merge commit.
3. The [release workflow](.github/workflows/release.yaml) runs the CI checks, verifies the tag and the changelog, stages the package on npm, and creates the GitHub Release.
4. Find the staged version with `pnpm stage list` and approve it with `pnpm stage approve <id>` and 2FA.

If the staged version is wrong, reject it with `pnpm stage reject <id>`. The same version cannot be staged again until then.

## Code style

Follow the rules in `.editorconfig`.

- Use UTF-8 and LF line endings.
- Indent with 4 spaces, or 2 spaces in `package.json` and `pnpm-*.yaml`.
- End every file with a newline and trim trailing whitespace.

Follow these rules for prose, including Markdown files.

- Never hard wrap prose. Write each paragraph or list item on a single line.
- Use US spelling, for example "color" and "behavior".
- Keep every sentence at or under 40 words.
- Pretty print Markdown tables so the columns line up, with alignment markers on every separator line.

## Branches

Create a branch from `main` for each change. Name it `<type>/<short-description>` in lowercase with hyphens between words, for example `feat/elevation-tokens` or `fix/focus-ring-color`.

Use the same types as for commits.

## Commits

Write commit messages that follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

```text
<type>(<optional scope>): <description>
```

Use one of these types.

| Type       | Use for                                        |
|:-----------|:-----------------------------------------------|
| `feat`     | A new token or exported file                   |
| `fix`      | A correction to a token value or to the build  |
| `docs`     | Changes to documentation only                  |
| `refactor` | Changes that do not alter the build output     |
| `test`     | Changes to tests only                          |
| `build`    | Changes to packaging, dependencies, or tooling |
| `chore`    | Other maintenance that does not fit above      |

Write the description in the imperative mood, such as "add elevation tokens". Mark a breaking change with `!` after the type or scope, and add a `BREAKING CHANGE:` footer that explains what consumers must do.

## Pull requests

- Keep each pull request to one change.
- Link the issue it addresses.
- Update the changelog and README in the same pull request.
- Use a title that follows the commit convention.
- If you have write access, turn on auto-merge once the pull request is open, with `gh pr merge <number> --auto --merge` or the "Enable auto-merge" button. It then merges as soon as it is approved and the checks pass.
- If auto-merge is off, the author merges the pull request once it is approved and the checks pass. A maintainer merges pull requests opened by a contributor without write access.
- Renovate merges its own minor and patch pull requests once the checks pass. A maintainer approves a major update from Renovate and turns on auto-merge for it.
- Update the branch when it falls behind `main`, because auto-merge waits until the branch is up to date. The update dismisses the approval, so the pull request needs a new review.

## License

By contributing, you agree that your contributions are licensed under the [MIT license](LICENSE).
