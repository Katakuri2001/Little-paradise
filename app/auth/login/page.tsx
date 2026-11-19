"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLibraryStore } from "@/lib/store/libraryStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const login = useLibraryStore((s) => s.login);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Login failed"); return; }
      login(data.user);
      router.push("/");
    } catch { alert("Login failed"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-strong rounded-3xl p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold">Welcome back</h1>
          <p className="text-muted text-sm mt-1">Sign in to your Little Paradise</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required className="w-full glass rounded-xl px-4 py-3 bg-transparent outline-none" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required className="w-full glass rounded-xl px-4 py-3 bg-transparent outline-none" />
          <button type="submit" className="w-full py-3 rounded-xl bg-white text-black font-medium hover:scale-[1.02] transition">Sign In</button>
        </form>
        <div className="text-center text-sm text-muted">
          No account? <Link href="/auth/register" className="text-accent">Create one</Link>
        </div>
        <div className="text-center">
          <Link href="/" className="text-xs text-muted hover:text-white">Continue as guest</Link>
        </div>
      </div>
    </div>
  );
}
