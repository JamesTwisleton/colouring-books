import Link from "next/link";
import type { BookWithPages } from "@/types/colouring";

interface BookCardProps {
  book: BookWithPages;
  activeChildId: string | null;
  onDownload?: () => void;
}

export default function BookCard({
  book,
  activeChildId,
  onDownload,
}: BookCardProps) {
  const firstPage = book.pages?.[0];
  const canPlay = !!activeChildId && !!firstPage;

  return (
    <div className="w-52 shrink-0 bg-white rounded-2xl shadow-sm border border-orange-50 overflow-hidden flex flex-col">
      {/* Cover image */}
      <div className="h-36 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
        {book.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverImageUrl}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-5xl">📖</div>
        )}
      </div>

      {/* Meta */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">
          {book.title}
        </h3>
        {book.description && (
          <p className="text-xs text-gray-400 line-clamp-2">{book.description}</p>
        )}

        <div className="mt-auto flex flex-col gap-1.5">
          {/* Play button */}
          {canPlay ? (
            <Link
              href={`/colouring/${book.id}/${firstPage.id}`}
              className="block w-full text-center py-2 bg-[#ff6b6b] hover:bg-[#e04f4f] text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Colour now
            </Link>
          ) : (
            <button
              disabled
              className="w-full py-2 bg-gray-100 text-gray-400 rounded-xl text-xs font-semibold cursor-not-allowed"
            >
              {activeChildId ? "No pages" : "Select a child"}
            </button>
          )}

          {/* Download for offline */}
          {onDownload && (
            <button
              onClick={onDownload}
              className="w-full py-1.5 border border-gray-200 text-gray-500 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              Save offline
            </button>
          )}

          {/* Print book — not yet available */}
          <button
            disabled
            className="w-full py-1.5 bg-gray-50 text-gray-300 rounded-xl text-xs font-medium cursor-not-allowed"
          >
            Print book — coming soon
          </button>
        </div>
      </div>
    </div>
  );
}
