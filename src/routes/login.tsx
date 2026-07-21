import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";
import { getUser, login, signup } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Green-Scanner — Sign In" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // already logged in — skip straight to dashboard
  useEffect(() => {
    if (getUser()) navigate({ to: "/dashboard" });
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (tab === "login") {
      const user = login(email, password);
      if (!user) {
        setError("Incorrect email or password.");
        return;
      }
      navigate({ to: "/dashboard" });
    } else {
      if (!name.trim()) {
        setError("Please enter your name.");
        return;
      }
      const user = signup(name, email, password);
      if (!user) {
        setError("An account with this email already exists.");
        return;
      }
      navigate({ to: "/dashboard" });
    }
  }

  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl mb-8">
        <span className="grid place-items-center h-10 w-10 rounded-xl gradient-primary text-primary-foreground shadow-soft">
          <Leaf className="h-5 w-5" />
        </span>
        Green-Scanner
      </Link>

      <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-card p-8">
        {/* Tab toggle */}
        <div className="flex rounded-xl bg-secondary p-1 mb-7">
          <button
            onClick={() => { setTab("login"); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === "login" ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab("signup"); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === "signup" ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"
            }`}
          >
            Create Account
          </button>
        </div>

        <h1 className="font-display text-2xl font-bold mb-1">
          {tab === "login" ? "Welcome back" : "Get started"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {tab === "login"
            ? "Sign in to access your dashboard and history."
            : "Create a free account to start analyzing your fields."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "signup" && (
            <div>
              <label className="text-sm font-semibold block mb-1.5">Full name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-semibold block mb-1.5">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>

          {error && (
            <p className="text-sm text-[var(--weed)] font-semibold">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl gradient-primary text-primary-foreground py-2.5 font-semibold shadow-soft hover:opacity-95 transition mt-2"
          >
            {tab === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>

      <p className="text-xs text-muted-foreground mt-6">
        <Link to="/" className="hover:text-primary transition">← Back to site</Link>
      </p>
    </div>
  );
}
