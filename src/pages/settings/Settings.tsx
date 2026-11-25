import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  KeyRound,
  LogOut,
  Mail,
  Monitor,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  Smartphone,
  UserCircle2,
  Building2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { changePassword, logout } from "../../api/auth.api";
import OwnerNotificationButton from "../../components/notifications/OwnerNotificationButton";

type OwnerAccount = {
  fullName?: string;
  ownerId?: string;
  mobileNumber?: string;
  email?: string;
  companyName?: string;
  workspaceName?: string;
};

type TabKey = "profile" | "security" | "notifications";

export default function Settings() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  const [owner, setOwner] = useState<OwnerAccount>({});
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    mobileNumber: "",
    email: "",
    companyName: "",
    workspaceName: "",
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("roomease_owner") || "{}"
      ) as OwnerAccount;

      setOwner(stored);

      setProfileForm({
        fullName: stored.fullName || "",
        mobileNumber: stored.mobileNumber || "",
        email: stored.email || "",
        companyName: stored.companyName || "",
        workspaceName: stored.workspaceName || "RoomEase Workspace",
      });
    } catch {
      const fallback = {
        fullName: "RoomEase Owner",
        mobileNumber: "",
        email: "",
        companyName: "",
        workspaceName: "RoomEase Workspace",
      };

      setOwner(fallback);
      setProfileForm(fallback);
    }
  }, []);

  const initials = useMemo(() => {
    const name = owner.fullName || "RoomEase Owner";

    const value = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

    return value || "RE";
  }, [owner.fullName]);

  const saveProfile = async () => {
    setProfileMessage("");
    setProfileError("");

    if (!profileForm.fullName.trim()) {
      setProfileError("Full name is required.");
      return;
    }

    if (
      profileForm.mobileNumber &&
      !/^[6-9]\d{9}$/.test(profileForm.mobileNumber)
    ) {
      setProfileError("Enter a valid 10 digit mobile number.");
      return;
    }

    try {
      setProfileSaving(true);

      const updatedOwner: OwnerAccount = {
        ...owner,
        fullName: profileForm.fullName.trim(),
        mobileNumber: profileForm.mobileNumber.trim(),
        email: profileForm.email.trim(),
        companyName: profileForm.companyName.trim(),
        workspaceName:
          profileForm.workspaceName.trim() || "RoomEase Workspace",
      };

      localStorage.setItem(
        "roomease_owner",
        JSON.stringify(updatedOwner)
      );

      setOwner(updatedOwner);
      setEditingProfile(false);
      setProfileMessage(
        "Profile updated successfully on this device."
      );

      window.dispatchEvent(new Event("roomease-owner-updated"));
    } catch {
      setProfileError("Unable to save profile details.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    try {
      setPasswordLoading(true);

      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPasswordMessage(
        result?.message ||
          "Password changed successfully. Please login again."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        localStorage.removeItem("roomease_token");
        localStorage.removeItem("roomease_owner");
        localStorage.removeItem("roomease_property_id");

        navigate("/login", { replace: true });
      }, 1200);
    } catch (err: any) {
      setPasswordError(
        err?.response?.data?.message ||
          "Unable to change password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Local cleanup still matters.
    }

    localStorage.removeItem("roomease_token");
    localStorage.removeItem("roomease_owner");
    localStorage.removeItem("roomease_property_id");

    navigate("/login", { replace: true });
  };

  const tabs = [
    {
      key: "profile" as const,
      label: "Profile",
      description: "Personal & workspace information",
      icon: UserCircle2,
    },
    {
      key: "security" as const,
      label: "Security",
      description: "Password & active session",
      icon: ShieldCheck,
    },
    {
      key: "notifications" as const,
      label: "Notifications",
      description: "Push notification preferences",
      icon: Bell,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* PAGE HEADER */}
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
            Account center
          </p>

          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl font-medium tracking-tight text-[#294436] sm:text-2xl">
                Owner Profile & Account Settings
              </h1>

              <p className="mt-0.5 max-w-2xl text-xs leading-5 text-[#859083]">
                Manage your owner identity, workspace information,
                account security, and notification preferences.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[#E3E6DE] bg-white px-3.5 py-2 text-xs font-medium text-[#40543E] shadow-sm hover:bg-[#F2F4EC]"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* HERO / PROFILE SUMMARY */}
        <section className="overflow-hidden rounded-xl bg-[#1D4435] text-white shadow-sm">
          <div className="relative p-5 sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1),_transparent_40%)]" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-base font-medium text-[#294436] shadow-sm sm:h-16 sm:w-16">
                  {initials}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-medium sm:text-lg text-white">
                      {owner.fullName || "RoomEase Owner"}
                    </h2>

                    <span className="rounded-md bg-[#E8EFE8] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-[#356248]">
                      Active
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs text-white/80">
                    Owner account • Property Management
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <span className="rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-medium text-white/90">
                      ID: {owner.ownerId || "Not available"}
                    </span>

                    <span className="rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-medium text-white/90">
                      {owner.workspaceName || "RoomEase Workspace"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 lg:w-[340px]">
                <SummaryStat
                  label="Role"
                  value="Owner"
                />
                <SummaryStat
                  label="Status"
                  value="Active"
                />
                <SummaryStat
                  label="Workspace"
                  value="RoomEase"
                />
              </div>
            </div>
          </div>
        </section>

        {/* TABS */}
        <div className="grid gap-2 rounded-xl border border-[#E3E6DE] bg-white p-1.5 shadow-sm md:grid-cols-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setProfileMessage("");
                  setProfileError("");
                  setPasswordMessage("");
                  setPasswordError("");
                }}
                className={[
                  "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-left transition",
                  active
                    ? "bg-[#1D4435] text-white shadow-sm"
                    : "text-[#40543E] hover:bg-[#F2F4EC]",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    active
                      ? "bg-white/15 text-white"
                      : "bg-[#F2F4EC] text-[#55755A]",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <span className="min-w-0">
                  <span className="block text-xs font-medium">
                    {tab.label}
                  </span>

                  <span
                    className={[
                      "mt-0.5 block text-[10px]",
                      active
                        ? "text-white/80"
                        : "text-[#859083]",
                    ].join(" ")}
                  >
                    {tab.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* CONTENT */}
        <div>
          {activeTab === "profile" && (
            <ProfileTab
              owner={owner}
              initials={initials}
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              editing={editingProfile}
              setEditing={setEditingProfile}
              saving={profileSaving}
              message={profileMessage}
              error={profileError}
              onSave={saveProfile}
              onCancel={() => {
                setEditingProfile(false);
                setProfileForm({
                  fullName: owner.fullName || "",
                  mobileNumber: owner.mobileNumber || "",
                  email: owner.email || "",
                  companyName: owner.companyName || "",
                  workspaceName:
                    owner.workspaceName ||
                    "RoomEase Workspace",
                });
                setProfileError("");
                setProfileMessage("");
              }}
            />
          )}

          {activeTab === "security" && (
            <SecurityTab
              owner={owner}
              passwordLoading={passwordLoading}
              passwordMessage={passwordMessage}
              passwordError={passwordError}
              currentPassword={currentPassword}
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              setCurrentPassword={setCurrentPassword}
              setNewPassword={setNewPassword}
              setConfirmPassword={setConfirmPassword}
              onSubmit={handleChangePassword}
              onLogout={handleLogout}
            />
          )}

          {activeTab === "notifications" && (
            <NotificationsTab />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------
   PROFILE TAB
--------------------------------------- */

function ProfileTab({
  owner,
  initials,
  profileForm,
  setProfileForm,
  editing,
  setEditing,
  saving,
  message,
  error,
  onSave,
  onCancel,
}: {
  owner: OwnerAccount;
  initials: string;
  profileForm: {
    fullName: string;
    mobileNumber: string;
    email: string;
    companyName: string;
    workspaceName: string;
  };
  setProfileForm: React.Dispatch<
    React.SetStateAction<{
      fullName: string;
      mobileNumber: string;
      email: string;
      companyName: string;
      workspaceName: string;
    }>
  >;
  editing: boolean;
  setEditing: (value: boolean) => void;
  saving: boolean;
  message: string;
  error: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const updateField = (
    key: keyof typeof profileForm,
    value: string
  ) => {
    setProfileForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
      <section className="rounded-xl border border-[#E3E6DE] bg-white shadow-sm">
        <div className="flex flex-col gap-3.5 border-b border-[#EEF0E9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
              Personal information
            </p>

            <h3 className="mt-0.5 text-xs font-medium text-[#294436]">
              Owner details
            </h3>

            <p className="mt-0.5 text-[11px] text-[#859083]">
              Keep your account information up to date.
            </p>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E3E6DE] bg-white px-3.5 py-2 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC]"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Profile
            </button>
          )}
        </div>

        <div className="p-5 sm:p-6">
          {message && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#D5E2D5] bg-[#E8EFE8] px-3.5 py-3 text-xs font-medium text-[#356248]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] px-3.5 py-3 text-xs font-medium text-[#8A624D]">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-5 flex items-center gap-3.5 rounded-xl border border-[#E3E6DE] bg-[#F7F6F0]/60 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1D4435] text-xs font-medium text-white shadow-sm">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium text-[#294436]">
                {owner.fullName || "RoomEase Owner"}
              </p>

              <p className="mt-0.5 text-[11px] text-[#859083]">
                Owner • RoomEase Property Management
              </p>

              <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-[#E8EFE8] px-2 py-0.5 text-[9px] font-medium text-[#356248]">
                <Check className="h-3 w-3" />
                Account active
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ProfileField
              label="Full Name"
              icon={<UserCircle2 className="h-4 w-4" />}
              value={profileForm.fullName}
              disabled={!editing}
              onChange={(value) =>
                updateField("fullName", value)
              }
            />

            <ProfileField
              label="Phone Number"
              icon={<Phone className="h-4 w-4" />}
              value={profileForm.mobileNumber}
              disabled={!editing}
              onChange={(value) =>
                updateField("mobileNumber", value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="10 digit mobile number"
            />

            <ProfileField
              label="Email Address"
              icon={<Mail className="h-4 w-4" />}
              value={profileForm.email}
              disabled={!editing}
              onChange={(value) =>
                updateField("email", value)
              }
              placeholder="Email is not available from current backend"
            />

            <ProfileField
              label="Role / Account Type"
              icon={<ShieldCheck className="h-4 w-4" />}
              value="Owner"
              disabled
            />

            <ProfileField
              label="Company / Business"
              icon={<Building2 className="h-4 w-4" />}
              value={profileForm.companyName}
              disabled={!editing}
              onChange={(value) =>
                updateField("companyName", value)
              }
              placeholder="Your company / business name"
            />

            <ProfileField
              label="Workspace"
              icon={<Monitor className="h-4 w-4" />}
              value={profileForm.workspaceName}
              disabled={!editing}
              onChange={(value) =>
                updateField("workspaceName", value)
              }
              placeholder="RoomEase Workspace"
            />
          </div>

          {editing && (
            <div className="mt-5 flex flex-col-reverse gap-2.5 border-t border-[#EEF0E9] pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="h-10 rounded-lg border border-[#E3E6DE] bg-white px-4 text-xs font-medium text-[#55755A] hover:bg-[#F2F4EC]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={onSave}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-4 text-xs font-medium text-white shadow-sm hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6 space-y-4">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
            Account identity
          </p>

          <h3 className="mt-0.5 text-xs font-medium text-[#294436]">
            Workspace information
          </h3>
        </div>

        <div className="space-y-2.5">
          <InfoRow
            label="Account role"
            value="Owner"
          />

          <InfoRow
            label="Account status"
            value="Active"
          />

          <InfoRow
            label="Owner ID"
            value={owner.ownerId || "Not available"}
          />

          <InfoRow
            label="Workspace"
            value={
              owner.workspaceName ||
              "RoomEase Workspace"
            }
          />
        </div>

        <div className="rounded-xl border border-[#D5E2D5] bg-[#E8EFE8] p-4">
          <div className="flex gap-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#356248]" />

            <div>
              <p className="text-xs font-medium text-[#356248]">
                Protected owner account
              </p>

              <p className="mt-0.5 text-[11px] leading-4 text-[#356248]/90">
                Your dashboard actions use the authenticated
                RoomEase owner session.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------
   SECURITY TAB
--------------------------------------- */

function SecurityTab({
  owner,
  passwordLoading,
  passwordMessage,
  passwordError,
  currentPassword,
  newPassword,
  confirmPassword,
  setCurrentPassword,
  setNewPassword,
  setConfirmPassword,
  onSubmit,
  onLogout,
}: {
  owner: OwnerAccount;
  passwordLoading: boolean;
  passwordMessage: string;
  passwordError: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  setCurrentPassword: (value: string) => void;
  setNewPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onLogout: () => Promise<void>;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
      <section className="rounded-xl border border-[#E3E6DE] bg-white shadow-sm">
        <div className="border-b border-[#EEF0E9] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
              <KeyRound className="h-4 w-4" />
            </div>

            <div>
              <h3 className="text-xs font-medium text-[#294436]">
                Change password
              </h3>

              <p className="mt-0.5 text-[11px] text-[#859083]">
                Password changes invalidate previous RoomEase
                sessions.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-5 sm:p-6">
          {passwordMessage && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#D5E2D5] bg-[#E8EFE8] px-3.5 py-3 text-xs font-medium text-[#356248]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{passwordMessage}</span>
            </div>
          )}

          {passwordError && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] px-3.5 py-3 text-xs font-medium text-[#8A624D]">
              <span>{passwordError}</span>
            </div>
          )}

          <div className="grid gap-4">
            <PasswordField
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
            />

            <PasswordField
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
            />

            <PasswordField
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-4 text-xs font-medium text-white shadow-sm hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <KeyRound className="h-3.5 w-3.5" />

              {passwordLoading
                ? "Updating..."
                : "Update Password"}
            </button>
          </div>
        </form>
      </section>

      <div className="space-y-5">
        <section className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8EFE8] text-[#356248]">
              <Smartphone className="h-4 w-4" />
            </div>

            <div>
              <h3 className="text-xs font-medium text-[#294436]">
                Current session
              </h3>

              <p className="mt-0.5 text-[11px] text-[#859083]">
                This browser is currently authenticated.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-[#E3E6DE] bg-[#F7F6F0]/60 p-3.5">
            <div className="flex items-start gap-2.5">
              <div className="mt-1 h-2 w-2 rounded-full bg-[#356248]" />

              <div>
                <p className="text-xs font-medium text-[#294436]">
                  Active browser session
                </p>

                <p className="mt-0.5 text-[11px] text-[#859083]">
                  Signed in as{" "}
                  <span className="font-medium text-[#36503E]">
                    {owner.fullName ||
                      "RoomEase Owner"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <LogOut className="mt-0.5 h-4 w-4 text-[#A2634B]" />

            <div className="min-w-0">
              <h3 className="text-xs font-medium text-[#8A624D]">
                Sign out
              </h3>

              <p className="mt-0.5 text-[11px] leading-4 text-[#A17255]">
                End your current RoomEase session on this
                browser.
              </p>

              <button
                type="button"
                onClick={() => void onLogout()}
                className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg border border-[#E7D4C7] bg-white px-3.5 py-2 text-xs font-medium text-[#A2634B] hover:bg-[#F7EEDC]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out securely
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------------------------------------
   NOTIFICATION TAB
--------------------------------------- */

function NotificationsTab() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
      <section className="rounded-xl border border-[#E3E6DE] bg-white shadow-sm">
        <div className="border-b border-[#EEF0E9] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8EFE8] text-[#356248]">
              <Bell className="h-4 w-4" />
            </div>

            <div>
              <h3 className="text-xs font-medium text-[#294436]">
                Push notifications
              </h3>

              <p className="mt-0.5 text-[11px] text-[#859083]">
                Control notifications for this owner account.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="rounded-lg border border-[#E3E6DE] bg-[#F7F6F0]/60 p-3.5">
            <div className="flex items-start gap-3">
              <Bell className="mt-0.5 h-4 w-4 text-[#55755A]" />

              <div>
                <p className="text-xs font-medium text-[#294436]">
                  Browser notifications
                </p>

                <p className="mt-0.5 text-[11px] leading-4 text-[#859083]">
                  Enable or disable RoomEase push notifications
                  for this device.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <OwnerNotificationButton />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6 space-y-4">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
            Notification policy
          </p>

          <h3 className="mt-0.5 text-xs font-medium text-[#294436]">
            What you can expect
          </h3>
        </div>

        <div className="space-y-2.5">
          <NotificationInfo
            title="Task updates"
            description="Important operational notifications can appear here."
          />

          <NotificationInfo
            title="Property activity"
            description="Stay informed about relevant dashboard activity."
          />

          <NotificationInfo
            title="Browser specific"
            description="Notification permission is controlled per browser/device."
          />
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------
   REUSABLE UI
--------------------------------------- */

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2.5">
      <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#A3C1AD]">
        {label}
      </p>

      <p className="mt-0.5 truncate text-xs font-medium text-white">
        {value}
      </p>
    </div>
  );
}

function ProfileField({
  label,
  icon,
  value,
  disabled = false,
  onChange,
  placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-[#304B35]">
        <span className="text-[#7D887D]">{icon}</span>
        {label}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange?.(event.target.value)
        }
        disabled={disabled}
        placeholder={placeholder}
        className={[
          "mt-1.5 h-10 w-full rounded-lg border px-3 text-xs font-medium outline-none transition",
          disabled
            ? "cursor-not-allowed border-[#E3E6DE] bg-[#F7F6F0] text-[#7D887D]"
            : "border-[#DFE4DA] bg-[#F7F6F0]/50 text-[#36503E] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]",
        ].join(" ")}
      />
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#304B35]">
        {label}
      </label>

      <input
        type="password"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-1.5 h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
      />
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[#E3E6DE] bg-[#F7F6F0]/60 px-3.5 py-2.5">
      <span className="text-xs text-[#859083]">
        {label}
      </span>

      <span className="max-w-[60%] truncate text-right text-xs font-medium text-[#294436]">
        {value}
      </span>
    </div>
  );
}

function NotificationInfo({
  title,
  description,
}: {
  title: string;
  description: string;
} ) {
  return (
    <div className="rounded-lg border border-[#E3E6DE] bg-[#F7F6F0]/60 p-3.5">
      <div className="flex items-start gap-2.5">
        <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[#1D4435]" />

        <div>
          <p className="text-xs font-medium text-[#294436]">
            {title}
          </p>

          <p className="mt-0.5 text-[11px] leading-4 text-[#859083]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}