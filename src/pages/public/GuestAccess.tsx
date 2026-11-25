import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  validateGuestAccess,
} from "../../api/guestAccess.api";

import {
  getGuestSessionToken,
  saveGuestSession,
} from "../../utils/guestSession";

export default function GuestAccess() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const bedToken = searchParams.get("bedToken");

  const [stayAccessCode, setStayAccessCode] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [tooManyAttempts, setTooManyAttempts] =
    useState(false);

  /*
   * Existing valid guest session:
   * directly open Guest Portal.
   */
  useEffect(() => {
    if (
      bedToken &&
      getGuestSessionToken()
    ) {
      navigate("/guest", {
        replace: true,
      });
    }
  }, [bedToken, navigate]);

  const getErrorMessage = (err: any) => {
    return (
      err?.response?.data?.message ||
      err?.message ||
      "Unable to verify your stay code."
    );
  };

  const handleSubmit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (!bedToken) {
      setError(
        "Invalid QR link. Please scan the QR code provided for your bed again.",
      );
      return;
    }

    const code = stayAccessCode
      .trim()
      .toUpperCase();

    if (!code) {
      setError(
        "Please enter your stay access code.",
      );
      return;
    }

    if (code.length < 8) {
      setError(
        "Please enter the complete stay access code.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setTooManyAttempts(false);

      const response =
        await validateGuestAccess({
          bedToken,
          stayAccessCode: code,
        });

      if (!response?.guestSessionToken) {
        setError(
          "Guest session could not be created. Please contact front desk.",
        );
        return;
      }

      /*
       * Existing session flow.
       * DO NOT change.
       */
      saveGuestSession(
        response.guestSessionToken,
        bedToken,
      );

      navigate("/guest", {
        replace: true,
      });
    } catch (err: any) {
      console.error(
        "Guest access validation failed:",
        err,
      );

      const status =
        err?.response?.status;

      if (status === 429) {
        setTooManyAttempts(true);

        setError(
          "Too many attempts. Please try again later or contact front desk.",
        );

        return;
      }

      if (
        status === 401 ||
        status === 403
      ) {
        setError(
          "Your stay access code is invalid or your stay is no longer active. Please contact front desk.",
        );

        return;
      }

      setError(
        getErrorMessage(err),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F0] px-4 py-6 sm:px-6 sm:py-10 text-[#2C4136] antialiased">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center justify-center sm:min-h-[calc(100vh-5rem)]">
        <div className="w-full overflow-hidden rounded-xl border border-[#E3E6DE] bg-white shadow-xl">
          
          {/* =========================================
              TOP BRAND AREA
          ========================================= */}
          <div className="bg-[#1D4435] px-5 pb-6 pt-6 text-white sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-xs font-medium tracking-tight">
                    RoomEase
                  </p>

                  <p className="text-[10px] text-white/70">
                    Guest Portal
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1">
                <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#A3C1AD]">
                  Secure access
                </span>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#A3C1AD]">
                Welcome to your stay
              </p>

              <h1 className="mt-1 text-xl font-medium tracking-tight sm:text-2xl">
                Access your guest portal
              </h1>

              <p className="mt-1 max-w-xs text-xs leading-5 text-white/80">
                Enter the stay access code provided
                by your property or front desk.
              </p>
            </div>
          </div>

          {/* =========================================
              CONTENT
          ========================================= */}
          <div className="px-5 py-5 sm:px-6 sm:py-6">
            
            {/* QR VERIFIED */}
            {bedToken && (
              <div className="flex items-start gap-2.5 rounded-xl border border-[#D5E2D5] bg-[#E8EFE8] p-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#356248] shadow-sm">
                  <CheckCircle2 className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#356248]">
                    QR link verified
                  </p>

                  <p className="mt-0.5 text-[11px] leading-4 text-[#356248]/90">
                    Your bed access link is ready.
                    Enter your stay code to continue.
                  </p>
                </div>
              </div>
            )}

            {/* INVALID QR */}
            {!bedToken && (
              <div className="rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] p-3.5">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F7EEDC] text-[#A2634B]">
                    <X className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-[#8A624D]">
                      Invalid QR link
                    </p>

                    <p className="mt-0.5 text-[11px] leading-4 text-[#A17255]">
                      Please scan the permanent QR
                      code provided for your bed again.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* =====================================
                FORM
            ===================================== */}
            {bedToken && (
              <form
                onSubmit={handleSubmit}
                className="mt-5"
              >
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="stayAccessCode"
                    className="text-xs font-medium text-[#304B35]"
                  >
                    Stay access code
                  </label>

                  <span className="text-[10px] text-[#8C9782]">
                    Required
                  </span>
                </div>

                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center justify-center text-[#7D887D]">
                    <KeyRound className="h-4 w-4" />
                  </div>

                  <input
                    id="stayAccessCode"
                    type="text"
                    value={stayAccessCode}
                    onChange={(event) => {
                      setStayAccessCode(
                        event.target.value
                          .toUpperCase()
                          .replace(
                            /[^A-Z0-9]/g,
                            "",
                          )
                          .slice(0, 10),
                      );

                      if (error) {
                        setError("");
                      }

                      if (tooManyAttempts) {
                        setTooManyAttempts(false);
                      }
                    }}
                    placeholder="K7M9X4QP"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={10}
                    disabled={loading}
                    className="h-12 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 pl-10 pr-3 text-center text-base font-medium tracking-[0.18em] text-[#36503E] outline-none transition placeholder:text-xs placeholder:font-normal placeholder:tracking-[0.08em] placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF] disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#356248]" />

                  <p className="text-[10px] text-[#55755A]">
                    Your access is linked to your current stay.
                  </p>
                </div>

                {/* ERROR */}
                {error && (
                  <div className="mt-4 rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] p-3.5 text-xs text-[#8A624D]">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F7EEDC] text-[#A2634B]">
                        <X className="h-3.5 w-3.5" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-medium text-[#294436]">
                          Unable to continue
                        </p>

                        <p className="mt-0.5 leading-4 text-[#859083]">
                          {error}
                        </p>

                        {tooManyAttempts && (
                          <p className="mt-1.5 text-[10px] text-[#A2634B]">
                            Please wait a little before trying
                            another code.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* CONTINUE */}
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !stayAccessCode.trim() ||
                    tooManyAttempts
                  }
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-4 py-3 text-xs font-medium text-white shadow-sm transition hover:bg-[#295640] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Verifying access…
                    </>
                  ) : (
                    <>
                      Continue to portal
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* =====================================
                SECURITY INFO
            ===================================== */}
            <div className="mt-5 rounded-xl border border-[#E3E6DE] bg-[#F7F6F0]/60 p-3.5">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#55755A] shadow-sm border border-[#E3E6DE]">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-xs font-medium text-[#294436]">
                    Private & secure
                  </p>

                  <p className="mt-0.5 text-[11px] leading-4 text-[#859083]">
                    Your guest access is tied to the
                    active stay and is not shared with
                    other rooms.
                  </p>
                </div>
              </div>
            </div>

            {/* =====================================
                HELP
            ===================================== */}
            <div className="mt-5 text-center">
              <p className="text-[11px] text-[#859083]">
                Having trouble accessing your stay?
              </p>

              <p className="mt-0.5 text-[11px] font-medium text-[#36503E]">
                Please contact the front desk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}