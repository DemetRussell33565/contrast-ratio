/**
 * WCAG contrast ratio calculation.
 *
 * A "relative luminance" is a value between 0 (black) and 1 (white) that approximates
 * how the human eye perceives a colour's brightness. WCAG 2.x derives it from sRGB
 * channel values in two steps: normalise each 0-255 channel to [0,1], linearise via
 * the piecewise sRGB inverse-companding, then form a weighted sum whose weights reflect
 * the eye's red/green/blue sensitivity.
 *
 * The companding threshold at 0.03928 is the value used by the WCAG 2.x specification.
 * It is technically a rounded form of 0.04045 (the figure IEC 61966-2-1 uses for the
 * sRGB transfer function); WCAG keeps the older value for backwards compatibility, and
 * we match WCAG rather than the underlying standard so our results agree with the
 * reference calculators auditors use.
 *
 * All inputs are expected as plain RGB channel integers in [0, 255]. The library does
 * no colour-space parsing on purpose: callers usually already have RGB values, and a
 * parser would mean a dependency or a maintained surface area we do not need. If you
 * have a hex string, split it yourself before calling these functions.
 */

/** @typedef {[number, number, number]} RGB */

/**
 * Linearise a single normalised sRGB channel.
 *
 * @param {number} c Channel value normalised to [0, 1].
 * @returns {number} The linear (companding-inverted) channel value.
 */
function lineariseChannel(c) {
  if (c <= 0.03928) return c / 12.92;
  return Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Compute the WCAG relative luminance of an sRGB colour.
 *
 * @param {RGB} rgb A 3-tuple of integer channels in [0, 255].
 * @returns {number} Relative luminance in [0, 1].
 */
export function relativeLuminance(rgb) {
  const r = lineariseChannel(rgb[0] / 255);
  const g = lineariseChannel(rgb[1] / 255);
  const b = lineariseChannel(rgb[2] / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Compute the WCAG contrast ratio between two colours.
 *
 * The ratio is always >= 1 because the lighter colour's luminance goes in the
 * numerator. The two colours are therefore order-independent, which matches how
 * designers talk about contrast ("text on background" vs "background on text").
 *
 * @param {RGB} a First colour.
 * @param {RGB} b Second colour.
 * @returns {number} Contrast ratio in [1, 21].
 */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = la > lb ? la : lb;
  const darker = la > lb ? lb : la;
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Minimum contrast ratio required to pass a given WCAG conformance level.
 *
 * WCAG distinguishes "normal" text (below 18pt, or below 14pt bold) from "large"
 * text. The thresholds are lower for large text because the larger glyphs remain
 * legible at lower contrast. These are the ratios from WCAG 2.1 Success Criterion
 * 1.4.3 (AA) and 1.4.6 (AAA); "normal" here corresponds to WCAG's <18pt / <14pt-bold
 * case, "large" to >=18pt / >=14pt-bold.
 *
 * @param {'AA' | 'AAA'} level Conformance level.
 * @param {'normal' | 'large'} size Text size class.
 * @returns {number} Minimum acceptable ratio.
 */
export function minRatio(level, size) {
  if (level === 'AA') return size === 'large' ? 3 : 4.5;
  if (level === 'AAA') return size === 'large' ? 4.5 : 7;
  throw new Error(`Unknown WCAG level: ${level}`);
}

/**
 * Full check result. `ratio` is the actual measured contrast; `required` is the
 * threshold the given level/size demands; `passes` is `ratio >= required`. Note we
 * use `>=` rather than `>` because the WCAG criteria are inclusive at the boundary
 * (a ratio of exactly 4.5 satisfies AA for normal text).
 *
 * @typedef {Object} ContrastResult
 * @property {number} ratio The measured contrast ratio.
 * @property {number} required The minimum ratio for the requested level/size.
 * @property {boolean} passes Whether the measured ratio meets the requirement.
 */

/**
 * Evaluate a colour pair against a WCAG level and text size.
 *
 * @param {RGB} a First colour.
 * @param {RGB} b Second colour.
 * @param {'AA' | 'AAA'} level Conformance level.
 * @param {'normal' | 'large'} size Text size class.
 * @returns {ContrastResult}
 */
export function checkContrast(a, b, level, size) {
  const required = minRatio(level, size);
  const ratio = contrastRatio(a, b);
  return { ratio, required, passes: ratio >= required };
}
