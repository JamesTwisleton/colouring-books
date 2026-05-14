"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "cb:a2hs-dismissed";

/**
 * Shows an "Add to Home Screen" instruction modal for iOS Safari users
 * who haven't yet installed the PWA. Dismissed persistently via localStorage.
 */
export default function AddToHomeScreenModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone =
      "standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const dismissed = localStorage.getItem(DISMISSED_KEY) === "1";

    if (isIOS && !isStandalone && !dismissed) {
      // Delay slightly so it doesn't block first render
      const id = setTimeout(() => setVisible(true), 2_000);
      return () => clearTimeout(id);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-safe-min-4 bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Tip arrow pointing down to Safari toolbar */}
        <div className="relative px-6 pt-6 pb-5">
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg"
            aria-label="Dismiss"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">📱</div>
            <div>
              <h3 className="font-bold text-gray-800 text-base leading-tight">
                Get the full experience
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Add to your Home Screen for fullscreen colouring
              </p>
            </div>
          </div>

          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-[#ff6b6b] text-white flex items-center justify-center text-xs font-bold shrink-0">
                1
              </span>
              Tap the{" "}
              <span className="inline-flex items-center gap-1 font-medium text-gray-800">
                Share{" "}
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 inline"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                </svg>
              </span>{" "}
              button in Safari&apos;s toolbar below
            </li>
            <li className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-[#ff6b6b] text-white flex items-center justify-center text-xs font-bold shrink-0">
                2
              </span>
              Tap{" "}
              <span className="font-medium text-gray-800">
                &ldquo;Add to Home Screen&rdquo;
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-[#ff6b6b] text-white flex items-center justify-center text-xs font-bold shrink-0">
                3
              </span>
              Open the app icon — no more browser chrome!
            </li>
          </ol>

          <button
            onClick={dismiss}
            className="mt-5 w-full py-2.5 bg-[#ff6b6b] text-white rounded-xl text-sm font-semibold"
          >
            Got it
          </button>
        </div>

        {/* Visual indicator pointing to the share button location */}
        <div className="bg-gray-50 border-t border-gray-100 py-3 px-6 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-l-2 border-b-2 border-[#ff6b6b] rotate-[-45deg] mt-1" />
          <span className="text-xs text-gray-400">Share button is in the toolbar below</span>
        </div>
      </div>
    </div>
  );
}
