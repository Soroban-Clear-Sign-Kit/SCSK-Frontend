import { describe, it, expect } from "vitest";

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function getLuminance(hex: string): number {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}

function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("WCAG AA Theme Contrast Verification", () => {
  // WCAG 2.1 AA requires minimum 4.5:1 for normal body text
  const WCAG_AA_NORMAL_TEXT_MIN = 4.5;

  describe("Dark Mode Text & UI Contrast", () => {
    const darkBg = "#121212";
    const darkSurface = "#1e1e1e";
    const darkText = "#f5f5f5";
    const darkMutedText = "#a0a6ad";
    const darkPrimary = "#8ab4f8";
    const darkPrimaryText = "#121212";

    it("ensures normal dark mode body text exceeds WCAG AA against background", () => {
      const ratio = getContrastRatio(darkText, darkBg);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT_MIN);
    });

    it("ensures dark mode muted text meets WCAG AA against background and surface", () => {
      const ratioAgainstBg = getContrastRatio(darkMutedText, darkBg);
      const ratioAgainstSurface = getContrastRatio(darkMutedText, darkSurface);
      expect(ratioAgainstBg).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT_MIN);
      expect(ratioAgainstSurface).toBeGreaterThanOrEqual(
        WCAG_AA_NORMAL_TEXT_MIN,
      );
    });

    it("ensures primary action button text meets WCAG AA in dark mode", () => {
      const ratio = getContrastRatio(darkPrimaryText, darkPrimary);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT_MIN);
    });
  });

  describe("Dark Mode Warning & Risk Banners Contrast", () => {
    it("ensures 'ok' risk banner meets WCAG AA contrast in dark mode", () => {
      const okBg = "#0f381e";
      const okText = "#81c995";
      const ratio = getContrastRatio(okText, okBg);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT_MIN);
    });

    it("ensures 'review' warning/risk banner meets WCAG AA contrast in dark mode", () => {
      const reviewBg = "#3c2a04";
      const reviewText = "#fdd663";
      const ratio = getContrastRatio(reviewText, reviewBg);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT_MIN);
    });

    it("ensures 'blocked' risk banner meets WCAG AA contrast in dark mode", () => {
      const blockedBg = "#441616";
      const blockedText = "#f28b82";
      const ratio = getContrastRatio(blockedText, blockedBg);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT_MIN);
    });

    it("ensures 'info' warning banner meets WCAG AA contrast in dark mode", () => {
      const infoBg = "#102a45";
      const infoText = "#8ab4f8";
      const ratio = getContrastRatio(infoText, infoBg);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT_MIN);
    });

    it("ensures positive and negative balance indicators meet WCAG AA against dark surface", () => {
      const darkSurface = "#1e1e1e";
      const positive = "#81c995";
      const negative = "#f28b82";

      expect(getContrastRatio(positive, darkSurface)).toBeGreaterThanOrEqual(
        WCAG_AA_NORMAL_TEXT_MIN,
      );
      expect(getContrastRatio(negative, darkSurface)).toBeGreaterThanOrEqual(
        WCAG_AA_NORMAL_TEXT_MIN,
      );
    });
  });

  describe("Light Mode Reference Contrast", () => {
    it("ensures default light mode colors also meet WCAG AA contrast", () => {
      const lightBg = "#ffffff";
      const lightText = "#1a1a1a";
      const lightMuted = "#5f6368";
      expect(getContrastRatio(lightText, lightBg)).toBeGreaterThanOrEqual(
        WCAG_AA_NORMAL_TEXT_MIN,
      );
      expect(getContrastRatio(lightMuted, lightBg)).toBeGreaterThanOrEqual(
        WCAG_AA_NORMAL_TEXT_MIN,
      );

      // Warning banners in light mode
      expect(getContrastRatio("#137333", "#e6f4ea")).toBeGreaterThanOrEqual(
        WCAG_AA_NORMAL_TEXT_MIN,
      );
      expect(getContrastRatio("#854400", "#fef7e0")).toBeGreaterThanOrEqual(
        WCAG_AA_NORMAL_TEXT_MIN,
      );
      expect(getContrastRatio("#c5221f", "#fce8e6")).toBeGreaterThanOrEqual(
        WCAG_AA_NORMAL_TEXT_MIN,
      );
    });
  });
});
