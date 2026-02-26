(function () {
  if (
    typeof window !== "undefined" &&
    window.crypto &&
    typeof window.crypto.randomUUID !== "function"
  ) {
    window.crypto.randomUUID = function () {
      var b = new Uint8Array(16);
      window.crypto.getRandomValues(b);
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      var h = Array.from(b, function (x) {
        return x.toString(16).padStart(2, "0");
      }).join("");
      return (
        h.slice(0, 8) +
        "-" +
        h.slice(8, 12) +
        "-" +
        h.slice(12, 16) +
        "-" +
        h.slice(16, 20) +
        "-" +
        h.slice(20)
      );
    };
  }
})();
