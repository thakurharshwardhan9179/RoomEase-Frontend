import { type FormEvent, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOtp, login } from "../../api/auth.api";

interface LocationState {
  mobileNumber: string;
  password: string;
}

export default function OtpVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Agar koi seedha is page pe aa gaya (signup step skip karke),
    // to usse wapas signup pe bhej do — humein mobileNumber/password chahiye.
    if (!state?.mobileNumber || !state?.password) {
      navigate("/signup", { replace: true });
    }
  }, [state, navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    if (!state) return;

    try {
      setLoading(true);

      await verifyOtp(state.mobileNumber, otp);

      // Verify hote hi seedha login bhi kar dete hain — user ko
      // dobara password type karne ki zaroorat nahi.
      const response = await login({
        mobileNumber: state.mobileNumber,
        password: state.password,
      });

      localStorage.setItem("roomease_token", response.token);
      localStorage.setItem(
        "roomease_owner",
        JSON.stringify({
          ownerId: response.ownerId,
          fullName: response.fullName,
          hasProperty: response.hasProperty,
          documentsSubmitted: response.documentsSubmitted,
        })
      );

      if (!response.documentsSubmitted) {
        navigate("/onboarding/documents", { replace: true });
        return;
      }
      if (!response.hasProperty) {
        navigate("/onboarding/property", { replace: true });
        return;
      }
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Invalid OTP. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 sm:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <ShieldCheck className="h-6 w-6 text-slate-700" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Verify your mobile number
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter the 6-digit code sent to {state?.mobileNumber}.
            </p>
            
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="text-sm font-medium text-slate-700">OTP</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit OTP"
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-center text-lg tracking-[0.5em] outline-none transition placeholder:tracking-normal placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-7 flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Verifying...
                </span>
              ) : (
                "Verify & Continue"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}