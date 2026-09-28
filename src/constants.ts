import { join } from 'node:path';

/** The root directory of the repository. The build runs from it through the `build` script. */
export const rootDir = process.cwd();

/** The directory with the DTCG token files. */
export const tokensDir = join(rootDir, 'tokens');

/** The directory that the build writes to, and that gets published. */
export const distDir = join(rootDir, 'dist');

/** The extension of a token file. Other files in the tokens directory are ignored. */
export const TOKEN_FILE_EXTENSION = '.tokens.json';

/** The prefix of every CSS custom property, matching the WEB code syntax of the Figma variables. */
export const CSS_PREFIX = '--dma-';

/** The color modes, in the order that `light-dark()` takes them. */
export const MODES = ['light', 'dark'] as const;

export type Mode = (typeof MODES)[number];

/**
 * The collections whose tokens are not published.
 *
 * Other tokens use them as alias targets, and the build resolves those aliases to plain values. Designs and code bind
 * to semantic tokens only.
 */
export const PRIVATE_COLLECTIONS = ['primitives'];

/** The key in `$extensions` that holds the metadata of the Figma variable. */
export const FIGMA_EXTENSION = 'com.figma';
