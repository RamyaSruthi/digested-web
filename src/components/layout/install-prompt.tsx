"use client";

import { useState, useEffect } from "react";
import { X, Share, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "install-prompt-dismissed";

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Don't show if already installed (standalone) or already dismissed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true);

    if (isStandalone) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const safari = /safari/i.test(navigator.userAgent) && !/crios|fxios|opios|chrome/i.test(navigator.userAgent);

    if (ios && safari) {
      setIsIOS(true);
      // Show after a short delay so it doesn't pop up instantly
      const t = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(t);
    }

    // Android / Chrome: listen for the native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 2000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  }

  if (!show) return null;

  return (
    <div className="lg:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-3 right-3 z-40 bg-card border border-border rounded-2xl shadow-lg p-4 flex gap-3 items-start">
      {/* App icon */}
      <div className="w-10 h-10 rounded-xl bg-brand-purple flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-lg">D</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">Add Digested to Home Screen</p>
        {isIOS ? (
          <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1 flex-wrap">
            Tap <Share className="w-3.5 h-3.5 inline-flex flex-shrink-0" /> then
            <span className="inline-flex items-center gap-0.5 font-medium"><PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen</span>
          </p>
        ) : (
          <p className="text-xs text-text-muted mt-0.5">Install as an app for quick access.</p>
        )}
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="mt-2 text-xs font-semibold text-brand-purple hover:underline"
          >
            Install now
          </button>
        )}
      </div>

      <button onClick={dismiss} className="text-text-muted hover:text-text-primary flex-shrink-0 mt-0.5">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
