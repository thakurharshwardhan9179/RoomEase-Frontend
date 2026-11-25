import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  UserRound,
  UserX,
  X,
} from "lucide-react";
import api from "../../api/axios";
import {
  getProperties,
  type Property,
} from "../../api/properties.api";
import {
  addStaff,
  deactivateStaff,
  getMyStaff,
  updateStaff,
  type Staff,
  type StaffDepartment,
} from "../../api/staff.api";

const departments: StaffDepartment[] = [
  "Housekeeping",
  "Maintenance",
  "IT",
  "FnB",
  "Other",
];

export default function Staff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyStaff({
        department: department || undefined,
        page: 1,
        pageSize: 50,
      });

      setStaff(data.items || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to load staff."
      );
    } finally {
      setLoading(false);
    }
  }, [department]);

  const loadProperties = useCallback(async () => {
    try {
      setLoadingProperties(true);

      const response = await getProperties({
        page: 1,
        pageSize: 100,
      });

      setProperties(response.items || []);
    } catch (err: any) {
      setProperties([]);
      console.error(
        err?.response?.data?.message ||
          "Unable to load properties.",
      );
    } finally {
      setLoadingProperties(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const handleDeactivate = async (member: Staff) => {
    const confirmed = window.confirm(
      `Deactivate ${member.fullName}?`
    );

    if (!confirmed) return;

    try {
      await deactivateStaff(member.staffId);
      await loadStaff();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          "Unable to deactivate staff."
      );
    }
  };

  const fetchStaffPortalUrl = async (member: Staff) => {
    try {
      const response = await api.get(
        `/api/Staff/${member.staffId}/portal-link`
      );

      const data =
        response.data?.data ?? response.data;

      const token = data?.staffAccessToken;

      if (!token) {
        throw new Error(
          "Staff portal token was not returned by the backend."
        );
      }

      return `${window.location.origin}/staff/portal/${encodeURIComponent(
        token
      )}`;
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to generate staff portal link."
      );

      return null;
    }
  };

  const copyStaffPortalLink = async (member: Staff) => {
    const link = await fetchStaffPortalUrl(member);
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      alert("Staff portal link copied.");
    } catch {
      window.prompt("Copy staff portal link:", link);
    }
  };

  const openStaffPortal = async (member: Staff) => {
    const popup = window.open("about:blank", "_blank");
    const link = await fetchStaffPortalUrl(member);

    if (!link) {
      popup?.close();
      return;
    }

    if (popup) {
      popup.opener = null;
      popup.location.href = link;
    } else {
      window.location.href = link;
    }
  };

  const shareStaffPortalWhatsApp = async (member: Staff) => {
    const link = await fetchStaffPortalUrl(member);
    if (!link) return;

    const message = encodeURIComponent(
      `RoomEase Staff Portal\n\n` +
        `Hello ${member.fullName},\n\n` +
        `You can manage your assigned tasks from the RoomEase Staff Portal using this link:\n\n` +
        `${link}\n\n` +
        `Please keep this link private.`
    );

    window.open(
      `https://wa.me/?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 space-y-6">

        {/* PAGE HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
              Operations
            </p>

            <h1 className="mt-1 text-xl font-medium tracking-tight text-[#294436] sm:text-2xl">
              Staff Management
            </h1>

            <p className="mt-0.5 text-xs text-[#859083]">
              Manage operational staff and their availability.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadStaff}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E3E6DE] bg-white px-3.5 py-2 text-xs font-medium text-[#40543E] shadow-sm hover:bg-[#F2F4EC]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#295640]"
            >
              <Plus className="h-4 w-4" />
              Add Staff
            </button>
          </div>
        </div>

        {/* DEPARTMENT FILTER */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDepartment("")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              department === ""
                ? "bg-[#1D4435] text-white shadow-sm"
                : "border border-[#E3E6DE] bg-white text-[#40543E] hover:bg-[#F2F4EC]"
            }`}
          >
            All
          </button>

          {departments.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setDepartment(item)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                department === item
                  ? "bg-[#1D4435] text-white shadow-sm"
                  : "border border-[#E3E6DE] bg-white text-[#40543E] hover:bg-[#F2F4EC]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-60 animate-pulse rounded-xl border border-[#E3E6DE] bg-white"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] p-5 text-center">
            <p className="text-xs font-medium text-[#8A624D]">
              {error}
            </p>

            <button
              type="button"
              onClick={loadStaff}
              className="mt-3.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#295640]"
            >
              Try Again
            </button>
          </div>
        ) : staff.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#DFE4DA] bg-white p-10 text-center shadow-sm">
            <UserRound className="mx-auto h-9 w-9 text-[#7D887D]" />

            <h3 className="mt-3 text-xs font-medium text-[#294436]">
              No staff found
            </h3>

            <p className="mt-0.5 text-xs text-[#859083]">
              Add your first staff member to start operations.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {staff.map((member) => (
              <div
                key={member.staffId}
                className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm"
              >
                {/* STAFF HEADER */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
                      <UserRound className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-xs font-medium text-[#294436]">
                        {member.fullName}
                      </h3>

                      <p className="text-[11px] text-[#859083]">
                        {member.role || member.department}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-md px-2 py-0.5 text-[9px] font-medium ${
                      member.currentStatus === "Free"
                        ? "bg-[#E8EFE8] text-[#356248]"
                        : "bg-[#F7EEDC] text-[#9B712F]"
                    }`}
                  >
                    {member.currentStatus}
                  </span>
                </div>

                {/* STAFF DETAILS */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between gap-4">
                    <span className="text-[#859083]">
                      Department
                    </span>

                    <span className="text-right font-medium text-[#36503E]">
                      {member.department}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-[#859083]">
                      Mobile
                    </span>

                    <span className="text-right font-medium text-[#36503E]">
                      {member.mobileNumber}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-[#859083]">
                      Account
                    </span>

                    <span
                      className={`font-medium ${
                        member.isActive
                          ? "text-[#356248]"
                          : "text-[#7D887D]"
                      }`}
                    >
                      {member.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* STAFF PORTAL */}
                {member.isActive && (
                  <div className="mt-4 rounded-lg border border-[#E3E6DE] bg-[#F7F6F0]/60 p-3">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#356248]" />

                      <p className="text-xs font-medium text-[#294436]">
                        Staff Portal Ready
                      </p>
                    </div>

                    <p className="mt-0.5 text-[11px] leading-4 text-[#859083]">
                      Generate a fresh portal link for this staff member from the backend.
                    </p>

                    <div className="mt-2.5 grid gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openStaffPortal(member)
                        }
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-3 py-2 text-xs font-medium text-white hover:bg-[#295640]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open Portal
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            copyStaffPortalLink(member)
                          }
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E3E6DE] bg-white px-3 py-2 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC]"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy Link
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            shareStaffPortalWhatsApp(member)
                          }
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E3E6DE] bg-white px-3 py-2 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC]"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ACTIONS */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setEditing(member)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#E3E6DE] px-3 py-2 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>

                  {member.isActive && (
                    <button
                      onClick={() => handleDeactivate(member)}
                      className="flex items-center justify-center rounded-lg border border-[#E7D4C7] bg-white px-3 py-2 text-[#A2634B] hover:bg-[#FBF0E9]"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ADD MODAL */}
        {showAdd && (
          <StaffFormModal
            title="Add Staff"
            properties={properties}
            loadingProperties={loadingProperties}
            onClose={() => setShowAdd(false)}
            onSubmit={async (data) => {
              await addStaff(data);
              setShowAdd(false);
              await loadStaff();
            }}
          />
        )}

        {/* EDIT MODAL */}
        {editing && (
          <StaffFormModal
            title="Edit Staff"
            initial={editing}
            onClose={() => setEditing(null)}
            onSubmit={async (data) => {
              await updateStaff(
                editing.staffId,
                data
              );

              setEditing(null);
              await loadStaff();
            }}
          />
        )}
      </div>
    </div>
  );
}

function StaffFormModal({
  title,
  initial,
  properties = [],
  loadingProperties = false,
  onClose,
  onSubmit,
}: {
  title: string;
  initial?: Staff;
  properties?: Property[];
  loadingProperties?: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(
    initial?.fullName || ""
  );

  const [mobileNumber, setMobileNumber] = useState(
    initial?.mobileNumber || ""
  );

  const [department, setDepartment] =
    useState<StaffDepartment>(
      (initial?.department as StaffDepartment) ||
        "Housekeeping"
    );

  const [role, setRole] = useState(
    initial?.role || ""
  );

  const [propertyId, setPropertyId] = useState(
    initial?.propertyId || ""
  );

  const [saving, setSaving] = useState(false);

  const submit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!fullName.trim()) {
      alert("Full name is required.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      alert(
        "Enter a valid 10 digit mobile number."
      );
      return;
    }

    if (!initial && !propertyId.trim()) {
      alert("Please select a property.");
      return;
    }

    try {
      setSaving(true);

      await onSubmit({
        ...(initial
          ? {}
          : {
              propertyId: propertyId.trim(),
            }),
        fullName: fullName.trim(),
        mobileNumber,
        department,
        role: role.trim(),
      });
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          "Unable to save staff."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-xl bg-white p-5 sm:p-6 shadow-2xl overflow-hidden"
      >
        <h2 className="text-sm font-medium text-[#294436]">
          {title}
        </h2>

        <div className="mt-4 space-y-3.5">
          {!initial && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#304B35]">
                Property
              </label>

              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                disabled={loadingProperties}
                required
                className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] disabled:bg-[#F7F6F0]"
              >
                <option value="">
                  {loadingProperties
                    ? "Loading properties..."
                    : properties.length === 0
                      ? "No properties found"
                      : "Select property"}
                </option>

                {properties.map((property) => (
                  <option
                    key={property.propertyId}
                    value={property.propertyId}
                  >
                    {property.propertyName}
                    {property.city ? ` — ${property.city}` : ""}
                  </option>
                ))}
              </select>

              {!loadingProperties && properties.length === 0 && (
                <p className="mt-1 text-[10px] text-[#A2634B]">
                  Add a property first before adding staff.
                </p>
              )}
            </div>
          )}

          <Field
            label="Full Name"
            value={fullName}
            onChange={setFullName}
            placeholder="Staff full name"
          />

          <Field
            label="Mobile Number"
            value={mobileNumber}
            onChange={setMobileNumber}
            placeholder="10 digit mobile number"
          />

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#304B35]">
              Department
            </label>

            <select
              value={department}
              onChange={(e) =>
                setDepartment(
                  e.target.value as StaffDepartment
                )
              }
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92]"
            >
              {departments.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>

          <Field
            label="Role"
            value={role}
            onChange={setRole}
            placeholder="Cleaner, Electrician, Cook..."
          />
        </div>

        <div className="mt-5 flex gap-2.5 border-t border-[#EEF0E9] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#E3E6DE] px-3.5 py-2 text-xs font-medium text-[#55755A] hover:bg-[#F2F4EC]"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#295640] disabled:opacity-60"
          >
            {saving && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}

            {saving
              ? "Saving..."
              : "Save Staff"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[#304B35]">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
      />
    </div>
  );
}