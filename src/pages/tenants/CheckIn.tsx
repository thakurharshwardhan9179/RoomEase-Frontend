import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  checkInTenant,
  type CheckInTenantResponse,
} from "../../api/tenants.api";

export default function Checkin() {
  const {
    bedId,
    propertyId,
  } = useParams();

  const navigate =
    useNavigate();

  const [
    fullName,
    setFullName,
  ] = useState("");

  const [
    mobileNumber,
    setMobileNumber,
  ] = useState("");

  const [
    agreedRent,
    setAgreedRent,
  ] = useState("");

  const [
    depositAmount,
    setDepositAmount,
  ] = useState("");

  const [
    joiningDate,
    setJoiningDate,
  ] = useState("");

  const [
    agreementEndDate,
    setAgreementEndDate,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState(false);

  const [
    stayAccessCode,
    setStayAccessCode,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    copied,
    setCopied,
  ] = useState(false);

  const handleSubmit =
    async (
      e: FormEvent,
    ) => {
      e.preventDefault();

      if (!bedId) {
        setError(
          "Bed information is missing.",
        );
        return;
      }

      if (
        !fullName.trim() ||
        !mobileNumber.trim() ||
        !agreedRent ||
        !depositAmount ||
        !joiningDate
      ) {
        setError(
          "Please fill all required fields.",
        );
        return;
      }

      if (
        !/^[6-9]\d{9}$/.test(
          mobileNumber.trim(),
        )
      ) {
        setError(
          "Please enter a valid 10-digit mobile number (starts with 6-9).",
        );
        return;
      }

      const rent =
        Number(agreedRent);

      const deposit =
        Number(
          depositAmount,
        );

      if (
        !Number.isFinite(
          rent,
        ) ||
        rent < 0
      ) {
        setError(
          "Please enter a valid monthly rent.",
        );
        return;
      }

      if (
        !Number.isFinite(
          deposit,
        ) ||
        deposit < 0
      ) {
        setError(
          "Please enter a valid deposit amount.",
        );
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response: CheckInTenantResponse =
          await checkInTenant({
            bedId,
            fullName:
              fullName.trim(),
            mobileNumber:
              mobileNumber.trim(),
            agreedRent:
              rent,
            depositAmount:
              deposit,
            joiningDate,
            agreementEndDate:
              agreementEndDate ||
              null,
          });

        setStayAccessCode(
          response.stayAccessCode,
        );

        setSuccessMessage(
          response.message ||
            "Give this code to the guest. It is valid until checkout.",
        );

        setSuccess(true);
      } catch (err: any) {
        console.error(
          "Check-in error:",
          err,
        );

        setError(
          err?.response?.data
            ?.message ||
            "Unable to check-in tenant.",
        );
      } finally {
        setLoading(false);
      }
    };

  const copyCode =
    async () => {
      if (!stayAccessCode) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          stayAccessCode,
        );

        setCopied(true);

        window.setTimeout(
          () => {
            setCopied(false);
          },
          2000,
        );
      } catch {
        window.prompt(
          "Copy this stay access code:",
          stayAccessCode,
        );
      }
    };

  /* ---------------------------------------
     SUCCESS SCREEN
  --------------------------------------- */

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F6F0] px-6 text-[#2C4136]">
        <div className="w-full max-w-md rounded-xl border border-[#E3E6DE] bg-white p-6 shadow-sm sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#E8EFE8] text-[#356248]">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-center text-lg font-medium text-[#294436]">
            Tenant Checked In
          </h1>

          <p className="mt-1 text-center text-xs leading-5 text-[#859083]">
            The tenant has been successfully assigned to this bed.
          </p>

          {/* Stay Access Code */}
          <div className="mt-5 rounded-xl border border-[#D5E2D5] bg-[#E8EFE8] p-4">
            <p className="text-center text-[9px] font-medium uppercase tracking-[0.12em] text-[#356248]">
              Stay Access Code
            </p>

            <div className="mt-3 flex items-center gap-2.5">
              <div className="min-w-0 flex-1 rounded-lg border border-[#D5E2D5] bg-white px-3.5 py-3">
                <p className="break-all text-center text-xl font-medium tracking-[0.15em] text-[#294436]">
                  {stayAccessCode ||
                    "Unavailable"}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  copyCode
                }
                disabled={
                  !stayAccessCode
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#1D4435] text-white transition hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-40"
                title="Copy stay access code"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>

            <p className="mt-2.5 text-center text-[11px] leading-4 text-[#356248]">
              {successMessage}
            </p>

            <div className="mt-3.5 rounded-lg bg-white/80 px-3.5 py-2.5">
              <p className="text-[11px] font-medium text-[#294436]">
                Give this code to the tenant.
              </p>

              <p className="mt-0.5 text-[10px] leading-4 text-[#859083]">
                The tenant will scan the permanent bed QR code and enter this code to access guest services and food.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/properties/${propertyId}`,
              )
            }
            className="mt-5 w-full rounded-lg bg-[#1D4435] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#295640]"
          >
            Back to Property
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------
     CHECK-IN FORM
  --------------------------------------- */

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      <header className="border-b border-[#E3E6DE] bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4 sm:px-6">
          <button
            type="button"
            onClick={() =>
              navigate(
                `/properties/${propertyId}`,
              )
            }
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#55755A] transition hover:text-[#1D4435]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Property
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1D4435] text-white">
            <UserRound className="h-4 w-4" />
          </div>

          <h1 className="mt-3 text-xl font-medium tracking-tight text-[#294436] sm:text-2xl">
            Check-in Tenant
          </h1>

          <p className="mt-1 text-xs text-[#859083]">
            Add tenant details and assign this vacant bed.
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-7"
        >
          {error && (
            <div className="mb-4 rounded-lg border border-[#E7D4C7] bg-[#FBF0E9] px-3.5 py-3 text-xs font-medium leading-5 text-[#8A624D]">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              placeholder="e.g. Ramesh Kumar"
              value={
                fullName
              }
              onChange={
                setFullName
              }
              required
            />

            <Input
              label="Mobile Number"
              placeholder="10 digit mobile number"
              value={
                mobileNumber
              }
              onChange={
                setMobileNumber
              }
              type="tel"
              maxLength={10}
              required
            />

            <Input
              label="Agreed Monthly Rent"
              placeholder="6000"
              value={
                agreedRent
              }
              onChange={
                setAgreedRent
              }
              type="number"
              required
            />

            <Input
              label="Deposit Amount"
              placeholder="12000"
              value={
                depositAmount
              }
              onChange={
                setDepositAmount
              }
              type="number"
              required
            />

            <Input
              label="Joining Date"
              value={
                joiningDate
              }
              onChange={
                setJoiningDate
              }
              type="date"
              required
            />

            <Input
              label="Agreement End Date"
              value={
                agreementEndDate
              }
              onChange={
                setAgreementEndDate
              }
              type="date"
            />
          </div>

          <div className="mt-5 rounded-lg border border-[#E4E8DE] bg-[#F7F6F0]/60 p-3.5">
            <p className="text-[11px] font-medium text-[#304B35]">
              Note
            </p>

            <p className="mt-0.5 text-[11px] leading-4 text-[#7D887D]">
              Agreed rent can be different from the bed&apos;s listed monthly rent.
            </p>

            <p className="mt-1.5 text-[11px] leading-4 text-[#7D887D]">
              After check-in, a unique stay access code will be generated for this tenant. Give that code to the tenant.
            </p>
          </div>

          <button
            type="submit"
            disabled={
              loading
            }
            className="mt-6 w-full rounded-lg bg-[#1D4435] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Checking in..."
              : "Check-in Tenant"}
          </button>
        </form>
      </main>
    </div>
  );
}

/* ---------------------------------------
   Input Component
--------------------------------------- */

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[#304B35]">
        {label}

        {required && (
          <span className="ml-1 text-[#A2634B]">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value,
          )
        }
        placeholder={
          placeholder
        }
        required={
          required
        }
        maxLength={
          maxLength
        }
        className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
      />
    </div>
  );
}