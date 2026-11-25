import { type FormEvent, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signup } from "../../api/auth.api";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85";

export default function Signup() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setError(
        "Please enter a valid 10-digit mobile number.",
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters.",
      );
      return;
    }

    try {
      setLoading(true);

      await signup({
        fullName: fullName.trim(),
        mobileNumber,
        password,
      });

      navigate("/otp-verify", {
        state: {
          mobileNumber,
          password,
        },
        replace: true,
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Signup failed. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">

        {/* =====================================================
            LEFT — BRAND / VISUAL
        ===================================================== */}
        <section className="relative hidden min-h-screen overflow-hidden lg:block">
          {/* Background */}
          <img
            src={HERO_IMAGE}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Dark overlays */}
          <div className="absolute inset-0 bg-slate-950/75" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/70 to-slate-900/30" />

          {/* Decorative glow */}
          <div className="absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative z-10 flex min-h-screen flex-col justify-between p-10 xl:p-12">

            {/* LOGO */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-950 shadow-lg">
                R
              </div>

              <div>
                <h1 className="text-xl font-black tracking-tight text-white">
                  RoomEase
                </h1>

                <p className="text-xs font-medium text-slate-400">
                  Property Management
                </p>
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="max-w-xl">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-bold text-slate-200 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                Built for modern property owners
              </div>

              <h2 className="text-4xl font-black leading-[1.05] tracking-tight text-white xl:text-5xl">
                Run your
                <br />
                properties.
                <br /> 
                <span className="text-indigo-300">
                  Not your paperwork.
                </span>
              </h2>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
                Manage tenants, rooms, beds, rent,
                payments and day-to-day operations
                from one simple workspace.
              </p>

              {/* FEATURE CARDS */}
              <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
                <Feature
                  icon={
                    <Users className="h-4 w-4" />
                  }
                  title="Tenants"
                  subtitle="Track stays"
                />

                <Feature
                  icon={
                    <Building2 className="h-4 w-4" />
                  }
                  title="Properties"
                  subtitle="Manage spaces"
                />

                <Feature
                  icon={
                    <ShieldCheck className="h-4 w-4" />
                  }
                  title="Secure"
                  subtitle="Protected data"
                />
              </div>

              {/* FLOATING INFO CARD */}
              <div className="mt-5 flex max-w-lg items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-bold text-white">
                    One place. Every property.
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    From first check-in to final checkout.
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-between border-t border-white/10 pt-5">
              <p className="text-xs text-slate-500">
                © 2026 RoomEase
              </p>

              <p className="text-xs font-medium text-slate-500">
                Property operations, simplified.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            RIGHT — SIGNUP FORM
        ===================================================== */}
        <section className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-5 py-8 sm:px-8 lg:px-10">

          <div className="w-full max-w-md">

            {/* MOBILE BRAND */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 font-black text-white">
                R
              </div>

              <div>
                <h1 className="font-black text-slate-950">
                  RoomEase
                </h1>

                <p className="text-xs text-slate-500">
                  Property Management
                </p>
              </div>
            </div>

            {/* CARD */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">

              {/* TOP */}
              <div>
                <div className="flex items-center justify-between gap-4">

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">
                      Step 1 of 2
                    </p>

                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                      Create your account
                    </h2>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Building2 className="h-6 w-6" />
                  </div>
                </div>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Start managing your PG, hostel or
                  apartment in just a few steps.
                </p>
              </div>

              {/* PROGRESS */}
              <div className="mt-7">
                <div className="flex items-center gap-3">

                  <ProgressStep
                    number="1"
                    label="Account"
                    active
                  />

                  <div className="h-px flex-1 bg-slate-200" />

                  <ProgressStep
                    number="2"
                    label="Verify"
                  />
                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                      !
                    </div>

                    <div>
                      <p className="text-sm font-black text-rose-900">
                        Unable to create account
                      </p>

                      <p className="mt-1 text-xs leading-5 text-rose-700">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* FORM */}
              <form
                onSubmit={handleSubmit}
                className="mt-7"
              >

                {/* FULL NAME */}
                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Full name
                  </label>

                  <div className="relative mt-2">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      value={fullName}
                      onChange={(e) =>
                        setFullName(
                          e.target.value,
                        )
                      }
                      placeholder="Enter your full name"
                      autoComplete="name"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                </div>

                {/* MOBILE */}
                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">
                      Mobile number
                    </label>

                    <span className="text-[10px] font-semibold text-slate-400">
                      10 digits
                    </span>
                  </div>

                  <div className="relative mt-2">
                    <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={mobileNumber}
                      onChange={(e) =>
                        setMobileNumber(
                          e.target.value.replace(
                            /\D/g,
                            "",
                          ),
                        )
                      }
                      placeholder="98765 01234"
                      autoComplete="tel"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium tracking-wide text-slate-800 outline-none transition placeholder:text-slate-400 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">
                      Password
                    </label>

                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                      <KeyRound className="h-3 w-3" />
                      Min. 6 characters
                    </span>
                  </div>

                  <div className="relative mt-2">
                    <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value,
                        )
                      }
                      placeholder="Create a secure password"
                      autoComplete="new-password"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) =>
                            !value,
                        )
                      }
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* PASSWORD INDICATOR */}
                  {password && (
                    <div className="mt-3">
                      <div className="flex gap-1">
                        <span
                          className={`h-1 flex-1 rounded-full ${
                            password.length >= 1
                              ? "bg-indigo-500"
                              : "bg-slate-200"
                          }`}
                        />

                        <span
                          className={`h-1 flex-1 rounded-full ${
                            password.length >= 6
                              ? "bg-indigo-500"
                              : "bg-slate-200"
                          }`}
                        />

                        <span
                          className={`h-1 flex-1 rounded-full ${
                            password.length >= 10
                              ? "bg-emerald-500"
                              : "bg-slate-200"
                          }`}
                        />

                        <span
                          className={`h-1 flex-1 rounded-full ${
                            password.length >= 14
                              ? "bg-emerald-500"
                              : "bg-slate-200"
                          }`}
                        />
                      </div>

                      <p className="mt-1.5 text-[10px] font-semibold text-slate-400">
                        {password.length < 6
                          ? "Keep going — at least 6 characters required."
                          : password.length < 10
                          ? "Good start."
                          : "Strong password."}
                      </p>
                    </div>
                  )}
                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                {/* TRUST */}
                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Your account is protected by RoomEase authentication.
                </div>
              </form>

              {/* LOGIN */}
              <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/login")
                    }
                    className="font-black text-indigo-600 transition hover:text-indigo-700"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>

            {/* MOBILE FOOTER */}
            <p className="mt-6 text-center text-[10px] font-medium text-slate-400 lg:hidden">
              © 2026 RoomEase · Property Management
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   FEATURE CARD
========================================================= */

function Feature({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-xl">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white">
        {icon}
      </div>

      <p className="mt-3 text-xs font-black text-white">
        {title}
      </p>

      <p className="mt-0.5 text-[10px] text-slate-400">
        {subtitle}
      </p>
    </div>
  );
}

/* =========================================================
   PROGRESS STEP
========================================================= */

function ProgressStep({
  number,
  label,
  active = false,
}: {
  number: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
          active
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {number}
      </div>

      <span
        className={`text-xs font-bold ${
          active
            ? "text-slate-800"
            : "text-slate-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}