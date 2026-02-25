"use client";

/**
 * Polyfills `crypto.randomUUID()` for non-secure HTTP contexts.
 *
 * `crypto.randomUUID` is only available in Secure Contexts (HTTPS / localhost).
 * On plain HTTP the function is `undefined`, breaking Radix UI, cmdk, and other
 * libraries that call it to generate element IDs.
 *
 * The polyfill uses `crypto.getRandomValues` (available in ALL contexts) to
 * produce a standards-compliant v4 UUID.
 *
 * NOTE: The long-term fix is to serve the app over HTTPS.
 */
if (
  typeof window !== "undefined" &&
  typeof window.crypto !== "undefined" &&
  typeof window.crypto.randomUUID !== "function"
) {
  (window.crypto as Crypto & { randomUUID: () => string }).randomUUID =
    function randomUUID(): string {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      // Set version bits (v4)
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      // Set variant bits
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
        ""
      );
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    };
}

export function CryptoPolyfill() {
  return null;
}
