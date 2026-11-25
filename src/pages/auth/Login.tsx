import {
  type FormEvent,
  type ReactNode,
  useState,
} from "react";

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
  Users,
  WalletCards,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { login } from "../../api/auth.api";
import { teamApi } from "../../api/team.api";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85";

export default function Login() {
  const navigate = useNavigate();

  const [mobileNumber, setMobileNumber] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loginType, setLoginType] =
    useState<"owner" | "team">("owner");

  const handleSubmit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    setError("");

    if (!mobileNumber || !password) {
      setError(
        "Mobile number and password are required.",
      );
      return;
    }

    if (loginType === "owner" && !/^[6-9]\d{9}$/.test(mobileNumber)) {
      setError(
        "Please enter a valid 10-digit mobile number.",
      );
      return;
    }

    if (loginType === "team" && !/^\d{6,15}$/.test(mobileNumber)) {
      setError("Please enter the mobile number assigned to your team account.");
      return;
    }

    try {
      setLoading(true);

      // Clear old session before creating a new one.
      localStorage.removeItem(
        "roomease_token",
      );
      localStorage.removeItem(
        "roomease_owner",
      );
      localStorage.removeItem(
        "roomease_property_id",
      );

      if (loginType === "team") {
        const response = await teamApi.login(mobileNumber, password);
        localStorage.setItem("roomease_token", response.token);
        localStorage.setItem("roomease_owner", JSON.stringify({
          ownerId: response.ownerId,
          fullName: response.fullName,
          userType: "TeamUser",
          accountUserId: response.userId,
          roleName: response.roleName,
          permissions: response.permissions,
        }));
        window.dispatchEvent(new Event("roomease-owner-updated"));
        navigate("/dashboard", { replace: true });
        return;
      }

      const response = await login({ mobileNumber, password });

      localStorage.setItem(
        "roomease_token",
        response.token,
      );

      localStorage.setItem(
        "roomease_owner",
        JSON.stringify({
          ownerId: response.ownerId,
          fullName: response.fullName,
          hasProperty: response.hasProperty,
          documentsSubmitted:
            response.documentsSubmitted,
        }),
      );

      if (!response.documentsSubmitted) {
        navigate(
          "/onboarding/documents",
          { replace: true },
        );
        return;
      }

      if (!response.hasProperty) {
        navigate(
          "/onboarding/property",
          { replace: true },
        );
        return;
      }

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Login failed. Please check your mobile number and password.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">

        {/* =====================================================
            LEFT BRAND / VISUAL
        ===================================================== */}
        <section className="relative hidden min-h-screen overflow-hidden lg:block">

          {/* Property image */}
          <img
            src={HERO_IMAGE}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-slate-950/80" />

          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/75 to-slate-900/40" />

          {/* Decorative glow */}
          <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative z-10 flex min-h-screen flex-col justify-between p-10 xl:p-12">

            {/* BRAND */}
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

            {/* CONTENT */}
            <div className="max-w-xl">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-bold text-slate-200 backdrop-blur-xl">
                <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                Property management, simplified
              </div>

              <h2 className="text-4xl font-black leading-[1.05] tracking-tight text-white xl:text-5xl">
                Manage your
                <br />
                property.
                <br />
                <span className="text-indigo-300">
                  Your way.
                </span>
              </h2>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
                Keep tenants, rooms, beds, rent,
                payments and daily operations organized
                from one simple workspace.
              </p>

              {/* FEATURE CARDS */}
              <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
                <FeatureCard
                  icon={
                    <Building2 className="h-4 w-4" />
                  }
                  title="Properties"
                  subtitle="Manage spaces"
                />

                <FeatureCard
                  icon={
                    <Users className="h-4 w-4" />
                  }
                  title="Tenants"
                  subtitle="Track residents"
                />

                <FeatureCard
                  icon={
                    <WalletCards className="h-4 w-4" />
                  }
                  title="Payments"
                  subtitle="Stay on top"
                />
              </div>

              {/* TRUST CARD */}
              <div className="mt-5 flex max-w-xl items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-black text-white">
                    Everything in one place
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    From your first property setup to daily operations.
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
                Welcome back.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            RIGHT LOGIN
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

            {/* LOGIN CARD */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">

              {/* TOP */}
              <div className="flex items-start justify-between gap-4">

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">
                    {loginType === "owner" ? "Owner sign in" : "Team member sign in"}
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    Welcome back
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {loginType === "owner"
                      ? "Sign in to continue managing your property."
                      : "Use the mobile number and password your account owner gave you."}
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>

              {/* SMALL STATUS */}
              <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />

                <p className="text-xs font-semibold text-slate-500">
                  {loginType === "owner" ? "Secure owner access" : "Secure team member access"}
                </p>
              </div>

              <div className="mt-4 text-center text-xs text-slate-500">
                {loginType === "owner" ? "Are you a team member?" : "Are you the account owner?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setLoginType((current) => current === "owner" ? "team" : "owner");
                  }}
                  className="font-black text-indigo-600 hover:text-indigo-700"
                >
                  {loginType === "owner" ? "Team sign in" : "Owner sign in"}
                </button>
              </div>

              {/* ERROR */}
              {error && (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-start gap-3">

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 font-black text-rose-600">
                      !
                    </div>

                    <div>
                      <p className="text-sm font-black text-rose-900">
                        Sign in unsuccessful
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

                {/* MOBILE */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">
                      Mobile number
                    </label>

                    <span className="text-[10px] font-semibold text-slate-400">
                      {loginType === "owner" ? "10 digits" : "Team account mobile"}
                    </span>
                  </div>

                  <div className="relative mt-2">
                    <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={loginType === "owner" ? 10 : 15}
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
                      Your password
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
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value,
                        )
                      }
                      placeholder="Enter your password"
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
                      Signing in...
                    </>
                  ) : (
                    <>
                      {loginType === "owner" ? "Sign in to RoomEase" : "Sign in to your team account"}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* FORGOT PASSWORD */}
              {loginType === "owner" && <div className="mt-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100" />

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/forgot-password",
                    )
                  }
                  className="shrink-0 text-xs font-bold text-slate-600 transition hover:text-indigo-600"
                >
                  Forgot password?
                </button>

                <div className="h-px flex-1 bg-slate-100" />
              </div>}

              {/* SIGNUP */}
              {loginType === "owner" && <div className="mt-6 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-500">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/signup")
                    }
                    className="font-black text-indigo-600 transition hover:text-indigo-700"
                  >
                    Create an account
                  </button>
                </p>
              </div>}
            </div>

            {/* BOTTOM NOTE */}
            <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-400">
              <LockKeyhole className="h-3.5 w-3.5 text-slate-400" />
              {loginType === "owner" ? "RoomEase owner workspace" : "RoomEase team workspace"}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   FEATURE CARD
========================================================= */

function FeatureCard({
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
