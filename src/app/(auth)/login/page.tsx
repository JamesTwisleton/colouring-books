"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Instantiate inside handler — not at module/component level — so
    // this never runs during SSR pre-render (env vars are browser-only).
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/library");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#fff9f0] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎨</div>
          <h1 className="text-3xl font-bold text-[#ff6b6b]">Coloring Books</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Parent sign-in — your child&apos;s magical library awaits
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 focus:border-[#ff6b6b] transition text-gray-900 text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 focus:border-[#ff6b6b] transition text-gray-900 text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff6b6b] hover:bg-[#e04f4f] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          New here?{" "}
          <Link
            href="/signup"
            className="text-[#ff6b6b] font-medium hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
