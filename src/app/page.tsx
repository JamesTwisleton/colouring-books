import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-[#fff9f0] overflow-x-hidden">

      {/* ─── Nav ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#fff9f0]/90 backdrop-blur border-b border-orange-100">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-lg font-extrabold text-[#ff6b6b] tracking-tight">
            ColourBooks
          </span>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/library"
                className="px-4 py-2 bg-[#ff6b6b] text-white rounded-xl text-sm font-semibold hover:bg-[#e04f4f] transition-colors"
              >
                My Library
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-[#ff6b6b] text-white rounded-xl text-sm font-semibold hover:bg-[#e04f4f] transition-colors"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 pt-16 pb-12 text-center">
        <div className="text-6xl mb-5 select-none">🐾</div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
          Colour the page.
          <br />
          <span className="text-[#ff6b6b]">Watch it come alive.</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8 leading-relaxed">
          A magical colouring book app for kids. Fill in a page with your own colours
          — when you&apos;re done, the characters animate just for you!
        </p>
        <Link
          href="/book/cockapoos-big-adventure"
          className="inline-block px-8 py-4 bg-[#ff6b6b] text-white rounded-2xl text-lg font-bold shadow-lg hover:bg-[#e04f4f] hover:shadow-xl transition-all active:scale-95"
        >
          Try it free →
        </Link>
        <p className="mt-3 text-sm text-gray-400">No account needed to start colouring</p>
      </section>

      {/* ─── How it works ─────────────────────────────────────── */}
      <section className="bg-white border-y border-orange-100">
        <div className="max-w-5xl mx-auto px-5 py-14">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: "🖌️",
                title: "Pick up the brush",
                body: "Use your finger, stylus, or mouse to colour in each page freehand. Pressure-sensitive on Apple Pencil.",
              },
              {
                icon: "🔓",
                title: "Fill to unlock",
                body: "Each page has a colouring goal — colour enough of the page to unlock the next one. It's the rule, not a hint!",
              },
              {
                icon: "✨",
                title: "Watch the magic",
                body: "Finish a page and the characters spring to life — tails wag, characters bounce, scenes animate.",
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="text-center px-2">
                <div className="text-4xl mb-3">{icon}</div>
                <h3 className="text-base font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          {/* Colouring goal callout */}
          <div className="mt-10 bg-[#fff9f0] rounded-2xl border-2 border-[#ff6b6b]/20 p-5 text-center max-w-lg mx-auto">
            <p className="text-sm font-semibold text-[#ff6b6b] uppercase tracking-wide mb-1">
              Important rule for kids
            </p>
            <p className="text-gray-700 text-sm leading-relaxed">
              You <strong>must</strong> colour enough of the page before you can move on.
              The &ldquo;Next page&rdquo; button stays locked until you&apos;ve filled enough in —
              so keep those brushes moving!
            </p>
          </div>
        </div>
      </section>

      {/* ─── Create your own ──────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 py-14">
        <div className="grid sm:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[#ff6b6b] text-sm font-bold uppercase tracking-wide mb-2">
              For creators
            </p>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-4 leading-snug">
              Make your own book and share it with the world
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Upload your own illustrations, draw the animated regions, set colouring goals
              per page, and publish. Your book gets a shareable link — send it to anyone,
              anywhere, no app install required.
            </p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              {[
                "Upload any PNG or SVG illustration",
                "Draw animated regions with a point-and-click editor",
                "Set how much colouring unlocks each page",
                "Publish publicly or keep it private",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#ff6b6b] mt-0.5 shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="inline-block px-5 py-2.5 bg-[#ff6b6b] text-white rounded-xl text-sm font-semibold hover:bg-[#e04f4f] transition-colors"
            >
              Start creating →
            </Link>
          </div>
          <div className="bg-orange-50 rounded-3xl border-2 border-dashed border-orange-200 h-52 flex items-center justify-center text-5xl select-none">
            🎨
          </div>
        </div>
      </section>

      {/* ─── Print your book ──────────────────────────────────── */}
      <section className="bg-white border-y border-orange-100">
        <div className="max-w-5xl mx-auto px-5 py-14">
          <div className="grid sm:grid-cols-2 gap-10 items-center">
            <div className="bg-orange-50 rounded-3xl border-2 border-dashed border-orange-200 h-52 flex items-center justify-center text-5xl select-none order-last sm:order-first">
              📦
            </div>
            <div>
              <p className="text-[#ff6b6b] text-sm font-bold uppercase tracking-wide mb-2">
                Phygital
              </p>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4 leading-snug">
                Get a real printed book — with your child&apos;s artwork inside
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Once your child has finished colouring, order a professionally printed
                copy of the book featuring <em>their</em> coloured pages. Every printed
                book includes a <strong>QR code</strong> on each page so readers can
                scan straight to the digital version — and carry on colouring on any device.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                {[
                  "Printed with your child's unique colours",
                  "QR code links each page back to the digital book",
                  "Ships worldwide via print-on-demand",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-[#ff6b6b] mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 py-16 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
          Ready to start colouring?
        </h2>
        <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
          Try the example book for free — no sign-up needed.
          Create an account to save progress, make your own books, and order prints.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/book/cockapoos-big-adventure"
            className="px-8 py-3.5 bg-[#ff6b6b] text-white rounded-2xl font-bold hover:bg-[#e04f4f] transition-all active:scale-95 shadow-md"
          >
            Try it free →
          </Link>
          <Link
            href="/signup"
            className="px-8 py-3.5 border-2 border-[#ff6b6b] text-[#ff6b6b] rounded-2xl font-bold hover:bg-orange-50 transition-colors"
          >
            Create an account
          </Link>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-orange-100 bg-white">
        <div className="max-w-5xl mx-auto px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <span className="font-bold text-[#ff6b6b]">ColourBooks</span>
          <span>Scan the QR code in your printed book to colour online for free.</span>
        </div>
      </footer>
    </main>
  );
}
