# contrast-ratio

A zero-dependency TypeScript/ESM library for computing WCAG 2.x colour contrast ratios and checking them against the AA and AAA conformance thresholds.

## Usage

```js
import { contrastRatio, checkContrast, relativeLuminance, minRatio } from 'contrast-ratio';

const text = [17, 17, 17];
const bg = [255, 255, 255];

console.log(contrastRatio(text, bg));              // ~15.0
console.log(checkContrast(text, bg, 'AA', 'normal'));
// { ratio: 15.0..., required: 4.5, passes: true }

console.log(minRatio('AAA', 'normal'));            // 7
console.log(relativeLuminance([255, 255, 255]));   // 1
```

Colours are passed as `[r, g, b]` tuples of integers in `[0, 255]`. The library does not parse hex strings or CSS colours; callers convert before calling. Exported names: `contrastRatio`, `checkContrast`, `relativeLuminance`, `minRatio`.

## Why this exists

The core WCAG formula is a dozen lines of arithmetic, and the spec's reference calculators disagree in the third decimal place because of rounding in the sRGB companding step. This library matches the WCAG 2.x reference behaviour exactly — including the `0.03928` companding threshold, which differs from the IEC 61966-2-1 standard's `0.04045` but is what WCAG auditors use. The trade-off is correctness against the spec auditors cite, rather than against the underlying colour standard.

`checkContrast` returns both the measured `ratio` and the `required` threshold, plus a boolean `passes`. The boolean is computed with `>=` (inclusive), so a pair whose ratio is exactly 4.5 passes AA for normal text — this matches how WCAG conformance is actually evaluated.

## Edge you will hit

The library takes RGB tuples only. If you have hex strings (`#1a1a1a`), split them into `[0x1a, 0x1a, 0x1a]` yourself; bundling a parser would mean either a regex that handles `#rgb`, `#rrggbb`, and `rgb()` forms, or a dependency, neither of which belongs in a focused contrast calculator.

## Running the tests

```sh
node --test
```
