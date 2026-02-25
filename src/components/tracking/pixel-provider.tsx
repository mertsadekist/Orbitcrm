"use client";

import { createContext, useContext, useCallback } from "react";
import type { QuizTracking } from "@/types/quiz";
import { FacebookPixel } from "./facebook-pixel";
import { TikTokPixel } from "./tiktok-pixel";

type PixelContextType = {
  firePageView: () => void;
  fireCompleteRegistration: () => void;
};

const PixelContext = createContext<PixelContextType>({
  firePageView: () => {},
  fireCompleteRegistration: () => {},
});

export function usePixel() {
  return useContext(PixelContext);
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (...args: unknown[]) => void; page: () => void };
  }
}

export function PixelProvider({
  tracking,
  children,
}: {
  tracking: QuizTracking;
  children: React.ReactNode;
}) {
  const firePageView = useCallback(() => {
    window.fbq?.("track", "PageView");
    window.ttq?.page();
  }, []);

  const fireCompleteRegistration = useCallback(() => {
    window.fbq?.("track", "CompleteRegistration");
    window.ttq?.track("CompleteRegistration");
  }, []);

  return (
    <PixelContext.Provider value={{ firePageView, fireCompleteRegistration }}>
      {tracking.facebookPixelId && (
        <FacebookPixel pixelId={tracking.facebookPixelId} />
      )}
      {tracking.tiktokPixelId && (
        <TikTokPixel pixelId={tracking.tiktokPixelId} />
      )}
      {children}
    </PixelContext.Provider>
  );
}
