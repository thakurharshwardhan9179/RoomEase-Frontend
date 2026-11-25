import { useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, LockKeyhole, Phone, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { requestForgotPasswordOtp, resetPassword } from "../../api/auth.api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const requestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    try {
      setLoading(true);
      const result = await requestForgotPasswordOtp(mobileNumber);
      setSuccess(result?.message || "OTP sent successfully.");
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (otp.length !== 6) return setError("Enter the 6-digit OTP.");
    if (newPassword.length < 6) return setError("Password must be at least 6 characters.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");
    try {
      setLoading(true);
      const result = await resetPassword({ mobileNumber, otp, newPassword, confirmPassword });
      setSuccess(result?.message || "Password reset successful. Please login.");
      setTimeout(() => navigate("/login", { replace: true }), 900);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
          <div className="relative z-10 flex w-full flex-col justify-between p-12">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white font-bold text-slate-900">R</div>
              <div><h1 className="text-xl font-bold text-white">RoomEase</h1><p className="text-xs text-slate-400">Property Management</p></div>
            </div>
            <div className="max-w-lg">
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">Account recovery</p>
              <h2 className="text-5xl font-bold leading-tight tracking-tight text-white">Get back into<br />your account.</h2>
              <p className="mt-6 max-w-md text-base leading-7 text-slate-400">Request an OTP, create a new password, and continue managing your properties securely.</p>
            </div>
            <p className="text-xs text-slate-500">© 2026 RoomEase</p>
          </div>
        </div>
        <div className="flex items-center justify-center bg-slate-50 px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <button onClick={() => navigate("/login")} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" /> Back to login
            </button>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"><ShieldCheck className="h-6 w-6 text-slate-700" /></div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Forgot password</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{step === 1 ? "We’ll send an OTP to your registered mobile number." : "Enter the OTP and choose a new password."}</p>
              </div>
              {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              {success && <div className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{success}</div>}
              {step === 1 ? (
                <form onSubmit={requestOtp}>
                  <label className="text-sm font-medium text-slate-700">Mobile number</label>
                  <div className="relative mt-2"><Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))} maxLength={10} inputMode="numeric" placeholder="Enter 10-digit mobile number" className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100" /></div>
                  <button disabled={loading} className="mt-7 flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Sending OTP..." : "Send OTP"}</button>
                </form>
              ) : (
                <form onSubmit={handleReset}>
                  <label className="text-sm font-medium text-slate-700">OTP</label>
                  <div className="relative mt-2"><KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} maxLength={6} inputMode="numeric" placeholder="123456" className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm tracking-[0.35em] outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100" /></div>
                  <div className="mt-5"><label className="text-sm font-medium text-slate-700">New password</label><div className="relative mt-2"><LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100" /></div></div>
                  <div className="mt-5"><label className="text-sm font-medium text-slate-700">Confirm password</label><div className="relative mt-2"><LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100" /></div></div>
                  <label className="mt-4 flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} /> Show passwords</label>
                  <button disabled={loading} className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Resetting..." : "Reset password"}</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
