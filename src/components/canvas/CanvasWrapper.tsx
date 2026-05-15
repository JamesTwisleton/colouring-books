"use client";

import dynamic from "next/dynamic";

// ssr: false must live in a Client Component — Server Components cannot use it
const ColouringCanvas = dynamic(
  () => import("@/components/canvas/ColouringCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🎨</div>
          <p className="text-gray-400 text-sm">Loading canvas…</p>
        </div>
      </div>
    ),
  }
);

interface CanvasWrapperProps {
  outlineUrl: string;
  animatableElementsUrl: string;
  bookId: string;
  pageId: string;
  initialColouredImageUrl?: string;
  prevPageId?: string;
  nextPageId?: string;
  pageNumber: number;
  totalPages: number;
  completionThreshold?: number;
}

export default function CanvasWrapper(props: CanvasWrapperProps) {
  return <ColouringCanvas {...props} />;
}
