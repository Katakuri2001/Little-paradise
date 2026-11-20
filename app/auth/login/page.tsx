"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLibraryStore } from "@/lib/store/libraryStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const login = useLibraryStore((s) => s.login);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed"); setLoading(false); return; }
      login(data.user);
      router.push("/");
    } catch {
      setError("Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#090B12]">
      <div className="glass-raised rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        <div className="text-center">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-white font-bold text-sm">LP</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted text-sm mt-1">Sign in to your Little Paradise</p>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted">Email address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
              required
              className="w-full glass rounded-xl px-4 py-3 bg-transparent outline-none focus-visible:ring-accent transition-colors duration-150 ease-out-custom"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              required
              className="w-full glass rounded-xl px-4 py-3 bg-transparent outline-none focus-visible:ring-accent transition-colors duration-150 ease-out-custom"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-transform duration-150 ease-out-custom active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="text-center text-sm text-muted">
          No account?{" "}
          <Link href="/auth/register" className="text-accent hover:text-accent/90 font-medium transition-colors">
            Create one
          </Link>
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs text-muted hover:text-white transition-colors">
            Continue as guest
          </Link>
        </div>
      </div>
    </div>
  );
}
