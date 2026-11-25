import {
  CheckCircle2,
  FileCheck2,
  FileText,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyDocuments,
  uploadDocument,
  type DocumentType,
} from "../../api/documents.api";

type UploadState = {
  file: File | null;
  uploading: boolean;
  uploaded: boolean;
  error: string;
};

const initialState: UploadState = {
  file: null,
  uploading: false,
  uploaded: false,
  error: "",
};

export default function Documents() {
  const navigate = useNavigate();

  const identityInput = useRef<HTMLInputElement>(null);
  const ownershipInput = useRef<HTMLInputElement>(null);

  const [identity, setIdentity] =
    useState<UploadState>(initialState);

  const [ownership, setOwnership] =
    useState<UploadState>(initialState);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await getMyDocuments();

      const identityUploaded = data.some(
        (doc) =>
          doc.documentType === "AadharCard"
      );

      const ownershipUploaded = data.some(
        (doc) =>
          doc.documentType === "PropertyProof"
      );

      if (identityUploaded) {
        setIdentity((prev) => ({
          ...prev,
          uploaded: true,
        }));
      }

      if (ownershipUploaded) {
        setOwnership((prev) => ({
          ...prev,
          uploaded: true,
        }));
      }
    } catch (error) {
      console.error(
        "Failed to load documents",
        error
      );
    }
  };

  const validateFile = (file: File) => {
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!hasValidExtension) {
      return "Only JPG, PNG, or PDF files are allowed.";
    }

    if (file.size === 0) {
      return "This file appears to be empty.";
    }

    if (file.size > 5 * 1024 * 1024) {
      return "File size must be less than 5 MB.";
    }

    return "";
  };

  const handleFileSelect = async (
    type: DocumentType,
    file: File
  ) => {
    const validationError = validateFile(file);

    if (validationError) {
      if (type === "AadharCard") {
        setIdentity({
          ...initialState,
          error: validationError,
        });
      } else {
        setOwnership({
          ...initialState,
          error: validationError,
        });
      }

      return;
    }

    if (type === "AadharCard") {
      setIdentity({
        file,
        uploading: true,
        uploaded: false,
        error: "",
      });
    } else {
      setOwnership({
        file,
        uploading: true,
        uploaded: false,
        error: "",
      });
    }

    try {
      await uploadDocument(type, file);

      if (type === "AadharCard") {
        setIdentity({
          file,
          uploading: false,
          uploaded: true,
          error: "",
        });
      } else {
        setOwnership({
          file,
          uploading: false,
          uploaded: true,
          error: "",
        });
      }

      await loadDocuments();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Upload failed. Please try again.";

      if (type === "AadharCard") {
        setIdentity({
          file,
          uploading: false,
          uploaded: false,
          error: message,
        });
      } else {
        setOwnership({
          file,
          uploading: false,
          uploaded: false,
          error: message,
        });
      }
    }
  };

  const removeFile = (type: DocumentType) => {
    if (type === "AadharCard") {
      setIdentity(initialState);

      if (identityInput.current) {
        identityInput.current.value = "";
      }
    } else {
      setOwnership(initialState);

      if (ownershipInput.current) {
        ownershipInput.current.value = "";
      }
    }
  };

  const canContinue =
    identity.uploaded &&
    ownership.uploaded;

  const handleContinue = () => {
    if (!canContinue) return;

    navigate("/onboarding/property");
  };

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">

      {/* HEADER */}
      <header className="border-b border-[#E3E6DE] bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1D4435] font-medium text-white shadow-sm">
              R
            </div>

            <div>
              <h1 className="text-xs font-medium text-[#294436]">
                RoomEase
              </h1>

              <p className="text-[10px] text-[#859083]">
                Property Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#55755A]">
            <ShieldCheck className="h-4 w-4" />
            Secure verification
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5">

            <Step
              number="1"
              label="Documents"
              active
            />

            <div className="h-px flex-1 bg-[#E3E6DE]" />

            <Step
              number="2"
              label="Property"
            />

            <div className="h-px flex-1 bg-[#E3E6DE]" />

            <Step
              number="3"
              label="Dashboard"
            />

          </div>
        </div>

        {/* TITLE */}
        <div className="max-w-xl">
          <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1D4435] shadow-sm">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>

          <h1 className="text-xl font-medium tracking-tight text-[#294436] sm:text-2xl">
            Verify your documents
          </h1>

          <p className="mt-1.5 text-xs leading-5 text-[#859083]">
            Upload your identity and property ownership
            documents. This helps us keep your RoomEase
            account secure.
          </p>
        </div>

        {/* DOCUMENT CARDS */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">

          <DocumentCard
            title="Identity Proof"
            description="Aadhaar, PAN, Driving License or other valid ID."
            type="AadharCard"
            state={identity}
            inputRef={identityInput}
            onSelect={handleFileSelect}
            onRemove={removeFile}
          />

          <DocumentCard
            title="Ownership Proof"
            description="Property ownership or valid ownership document."
            type="PropertyProof"
            state={ownership}
            inputRef={ownershipInput}
            onSelect={handleFileSelect}
            onRemove={removeFile}
          />

        </div>

        {/* INFO */}
        <div className="mt-5 flex gap-3 rounded-xl border border-[#D5E2D5] bg-[#E8EFE8] p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#356248]" />

          <div>
            <p className="text-xs font-medium text-[#356248]">
              Your documents are secure
            </p>

            <p className="mt-0.5 text-[11px] leading-4 text-[#356248]/90">
              Files are securely uploaded and reviewed.
              Supported formats are JPG, PNG and PDF up to
              5 MB.
            </p>
          </div>
        </div>

        {/* CONTINUE */}
        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="h-10 rounded-lg border border-[#E3E6DE] bg-white px-4 text-xs font-medium text-[#55755A] hover:bg-[#F2F4EC] transition"
          >
            Back to Login
          </button>

          <button
            type="button"
            disabled={!canContinue}
            onClick={handleContinue}
            className="h-10 rounded-lg bg-[#1D4435] px-6 text-xs font-medium text-white shadow-sm transition hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue to Property
          </button>

        </div>
      </main>
    </div>
  );
}

function Step({
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
        className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium ${
          active
            ? "bg-[#1D4435] text-white shadow-sm"
            : "border border-[#E3E6DE] bg-white text-[#7D887D]"
        }`}
      >
        {number}
      </div>

      <span
        className={`hidden text-xs font-medium sm:block ${
          active
            ? "text-[#294436]"
            : "text-[#859083]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function DocumentCard({
  title,
  description,
  type,
  state,
  inputRef,
  onSelect,
  onRemove,
}: {
  title: string;
  description: string;
  type: DocumentType;
  state: UploadState;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (
    type: DocumentType,
    file: File
  ) => void;
  onRemove: (type: DocumentType) => void;
}) {
  return (
    <div className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between gap-3">

        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
            {state.uploaded ? (
              <FileCheck2 className="h-4 w-4 text-[#356248]" />
            ) : (
              <FileText className="h-4 w-4 text-[#7D887D]" />
            )}
          </div>

          <div>
            <h2 className="text-xs font-medium text-[#294436]">
              {title}
            </h2>

            <p className="mt-0.5 text-[11px] leading-4 text-[#859083]">
              {description}
            </p>
          </div>
        </div>

        {state.uploaded && (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#356248]" />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            onSelect(type, file);
          }
        }}
      />

      {!state.file && !state.uploaded && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#DFE4DA] bg-[#F7F6F0]/50 px-4 py-6 transition hover:border-[#92AA92] hover:bg-[#E8EFE8]/30"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#55755A] shadow-sm border border-[#E3E6DE]">
            <Upload className="h-4 w-4" />
          </div>

          <p className="mt-2 text-xs font-medium text-[#294436]">
            Click to upload
          </p>

          <p className="mt-0.5 text-[10px] text-[#8C9782]">
            JPG, PNG or PDF • Max 5 MB
          </p>
        </button>
      )}

      {(state.file || state.uploaded) && (
        <div className="mt-4 rounded-lg border border-[#E3E6DE] bg-[#F7F6F0]/60 p-3.5">

          <div className="flex items-center justify-between gap-3">

            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E3E6DE] text-[#55755A]">
                <FileText className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-[#294436]">
                  {state.file?.name || "Document uploaded"}
                </p>

                <p className="mt-0.5 text-[10px] text-[#859083]">
                  {state.uploading
                    ? "Uploading..."
                    : state.uploaded
                      ? "Uploaded successfully"
                      : ""}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRemove(type)}
              className="rounded-lg p-1.5 text-[#7D887D] hover:bg-white hover:text-[#A2634B] transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {state.uploading && (
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#E3E6DE]">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-[#1D4435]" />
            </div>
          )}

          {state.uploaded && (
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-[#356248]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Document uploaded
            </div>
          )}
        </div>
      )}

      {state.error && (
        <p className="mt-2.5 text-xs font-medium text-[#A2634B]">
          {state.error}
        </p>
      )}
    </div>
  );
}