import confetti from "canvas-confetti";

export function fireDealConfetti() {
  // First burst — left side
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.3, y: 0.6 },
    colors: ["#10b981", "#6366f1", "#f59e0b", "#3b82f6"],
  });

  // Second burst — right side, slight delay
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.7, y: 0.6 },
      colors: ["#10b981", "#6366f1", "#f59e0b", "#3b82f6"],
    });
  }, 150);
}
