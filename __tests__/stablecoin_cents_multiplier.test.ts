import {
  MAX_SAFE_DIGITS,
  ERROR_CODES,
  validateMultiplier,
  validateStablecoinCents,
  applyStablecoinCentsMultiplier,
} from "../src/utils/stablecoin_cents_multiplier.js";

describe("stablecoin_cents_multiplier overflow validation", () => {
  describe("validateMultiplier", () => {
    it("accepts multipliers within the digit limit", () => {
      const result = validateMultiplier("1000000");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(1000000n);
      }
    });

    it("accepts valid boundary value at exact MAX_SAFE_DIGITS (15 digits)", () => {
      const boundary = "9".repeat(MAX_SAFE_DIGITS);
      const result = validateMultiplier(boundary);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(BigInt(boundary));
      }
    });

    it("rejects excessive digits (>15) with OVERFLOW_EXCESSIVE_DIGITS", () => {
      const tooBig = "1" + "0".repeat(MAX_SAFE_DIGITS);
      const result = validateMultiplier(tooBig);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe(ERROR_CODES.EXCESSIVE_DIGITS);
        expect(result.error).toMatch(/exceeds maximum of 15 digits/i);
      }
    });

    it("rejects non-integer input with OVERFLOW_INVALID_MULTIPLIER", () => {
      const result = validateMultiplier("10.5");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe(ERROR_CODES.INVALID_MULTIPLIER);
        expect(result.error).toMatch(/must be an integer numeric value/i);
      }
    });
  });

  describe("validateStablecoinCents", () => {
    it("accepts valid cents amount within the digit limit", () => {
      const result = validateStablecoinCents("250000");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(250000n);
      }
    });

    it("accepts valid boundary value at exact MAX_SAFE_DIGITS (15 digits)", () => {
      const boundary = "9".repeat(MAX_SAFE_DIGITS);
      const result = validateStablecoinCents(boundary);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(BigInt(boundary));
      }
    });

    it("rejects excessive digits (>15) with OVERFLOW_EXCESSIVE_DIGITS", () => {
      const tooBig = "1" + "0".repeat(MAX_SAFE_DIGITS);
      const result = validateStablecoinCents(tooBig);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe(ERROR_CODES.EXCESSIVE_DIGITS);
        expect(result.error).toMatch(/exceeds maximum of 15 digits/i);
      }
    });

    it("rejects non-integer input with OVERFLOW_INVALID_AMOUNT", () => {
      const result = validateStablecoinCents("100.99");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe(ERROR_CODES.INVALID_AMOUNT);
        expect(result.error).toMatch(/must be an integer numeric value/i);
      }
    });
  });

  describe("applyStablecoinCentsMultiplier", () => {
    it("correctly multiplies small/normal values", () => {
      const result = applyStablecoinCentsMultiplier("1000", "10");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(10000n);
      }
    });

    it("accepts boundary products within MAX_SAFE_DIGITS (15 digits)", () => {
      const amount = "10000000"; // 8 digits
      const multiplier = "10000000"; // 8 digits -> product 15 digits (1e14)
      const result = applyStablecoinCentsMultiplier(amount, multiplier);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(100000000000000n);
      }
    });

    it("blocks excessive digits on amount operand before arithmetic", () => {
      const excessive = "9".repeat(MAX_SAFE_DIGITS + 1);
      const result = applyStablecoinCentsMultiplier(excessive, "2");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe(ERROR_CODES.EXCESSIVE_DIGITS);
      }
    });

    it("blocks excessive digits on multiplier operand before arithmetic", () => {
      const excessive = "9".repeat(MAX_SAFE_DIGITS + 1);
      const result = applyStablecoinCentsMultiplier("100", excessive);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe(ERROR_CODES.EXCESSIVE_DIGITS);
      }
    });

    it("blocks product overflow when product exceeds 15 digits", () => {
      const largeAmount = "9".repeat(MAX_SAFE_DIGITS);
      const result = applyStablecoinCentsMultiplier(largeAmount, "10");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe(ERROR_CODES.PRODUCT_OVERFLOW);
        expect(result.error).toMatch(/multiplied cents value exceeds maximum of 15 digits/i);
      }
    });

    it("regression test: blocks dangerous input before arithmetic overflow can occur", () => {
      const unsafeAmount = "99999999999999999999999999999";
      const unsafeMultiplier = "99999999999999999999999999999";
      const result = applyStablecoinCentsMultiplier(unsafeAmount, unsafeMultiplier);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe(ERROR_CODES.EXCESSIVE_DIGITS);
      }
    });
  });
});
