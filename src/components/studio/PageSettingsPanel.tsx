"use client";

interface PageSettingsPanelProps {
  completionThreshold: number;
  pageTitle: string | null;
  onChange: (changes: { completionThreshold?: number; pageTitle?: string | null }) => void;
}

export default function PageSettingsPanel({
  completionThreshold,
  pageTitle,
  onChange,
}: PageSettingsPanelProps) {
  const pct = Math.round(completionThreshold * 100);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Page title{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={pageTitle ?? ""}
          onChange={(e) => onChange({ pageTitle: e.target.value || null })}
          placeholder="e.g. At the beach"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 focus:border-[#ff6b6b] text-sm"
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
          Shown in the top bar while the child colours.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Colouring threshold</label>
          <span className="text-sm font-bold text-[#ff6b6b]">{pct}%</span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={pct}
          onChange={(e) =>
            onChange({ completionThreshold: Number(e.target.value) / 100 })
          }
          className="w-full accent-[#ff6b6b]"
        />

        <div className="flex justify-between mt-1 mb-3">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">0% — no gating</span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">100% — fully coloured</span>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
          {pct === 0
            ? "No gating — the child can go to the next page immediately. Good for the last page."
            : `The child must colour at least ${pct}% of this page before the next page unlocks.`}
        </p>
      </div>

      {/* Visual hint of what the threshold ring will look like */}
      <div className="flex flex-col items-center gap-2 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <svg width="52" height="52" viewBox="0 0 52 52">
          {(() => {
            const r = 20;
            const circ = 2 * Math.PI * r;
            const dash = (pct / 100) * circ;
            return (
              <>
                <circle cx="26" cy="26" r={r} fill="none" stroke="#f3f4f6" strokeWidth="5" />
                <circle
                  cx="26"
                  cy="26"
                  r={r}
                  fill="none"
                  stroke={pct >= 100 ? "#27AE60" : "#ff6b6b"}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circ - dash}`}
                  strokeDashoffset={circ / 4}
                />
                <text
                  x="26"
                  y="30"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="#374151"
                >
                  {pct}%
                </text>
              </>
            );
          })()}
        </svg>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">Threshold ring preview</p>
      </div>
    </div>
  );
}
