import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import { BrainCircuit, Mail, Lock, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusField, setFocusField] = useState(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { token, user } = await authService.login(email, password);

      login(user, token);

      toast.success("Logged in successfully!");
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.message || "Failed to login. Please check your credentials."
      );

      toast.error(err.message || "Failed to login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50">

      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:19px_16px] opacity-30" />

      <div className="relative w-full max-w-md px-6">

        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/50 p-10">

          {/* Header */}

          <div className="text-center mb-10">

            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/25 mb-6">
              <BrainCircuit className="w-7 h-7 text-white" strokeWidth={2} />
            </div>

            <h1 className="text-2xl font-medium text-slate-900 tracking-tight mb-2">
              Welcome Back
            </h1>

            <p className="text-slate-500 text-sm">
              Sign in to continue your journey
            </p>

          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}

            <div className="space-y-2">

              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wide"
              >
                Email
              </label>

              <div className="relative group">

                <div
                  className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${
                    focusField === "email"
                      ? "text-emerald-500"
                      : "text-slate-400"
                  }`}
                >
                  <Mail className="h-5 w-5" strokeWidth={2} />
                </div>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusField("email")}
                  onBlur={() => setFocusField(null)}
                  placeholder="you@example.com"
                  className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:bg-white focus:shadow-lg focus:shadow-emerald-500/10"
                />
              </div>

            </div>

            {/* Password */}

            <div className="space-y-2">

              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wide"
              >
                Password
              </label>

              <div className="relative group">

                <div
                  className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${
                    focusField === "password"
                      ? "text-emerald-500"
                      : "text-slate-400"
                  }`}
                >
                  <Lock className="h-5 w-5" strokeWidth={2} />
                </div>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusField("password")}
                  onBlur={() => setFocusField(null)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:bg-white focus:shadow-lg focus:shadow-emerald-500/10"
                />
              </div>

            </div>
                        {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-xs text-red-600 font-medium text-center">
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full h-12 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-emerald-500/25 overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
                      strokeWidth={2.5}
                    />
                  </>
                )}
              </span>

              <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>

          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200/60">
            <p className="text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
              >
                Sign up
              </Link>
            </p>
          </div>

        </div>

        {/* Bottom Text */}
        <p className="text-center text-xs text-slate-400 mt-6">
          By continuing, you agree to our Terms & Privacy Policy
        </p>

      </div>
    </div>
  );
};

export default LoginPage;
