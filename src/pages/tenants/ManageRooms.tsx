import { type FormEvent, useEffect, useState } from "react";
import { ArrowLeft, BedDouble, Check, CheckCircle2, Copy } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getTenants,
  addBedToTenant,
  transferTenantBed,
  type Tenant,
  type TransferBedResponse,
} from "../../api/tenants.api";
import { getProperties, getProperty, type Property } from "../../api/properties.api";

interface VacantBedOption {
  bedId: string;
  label: string;
  rent: number;
}

export default function ManageRooms() {
  const { tenantId } = useParams();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [vacantBeds, setVacantBeds] = useState<VacantBedOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add-extra-room form state
  const [addBedId, setAddBedId] = useState("");
  const [addRent, setAddRent] = useState("");

  // Transfer form state
  const [oldBedId, setOldBedId] = useState("");
  const [newBedId, setNewBedId] = useState("");
  const [newRent, setNewRent] = useState("");
  const [transferring, setTransferring] = useState(false);

  // Transfer Success Modal State
  const [transferResult, setTransferResult] = useState<TransferBedResponse | null>(null);
  const [transferCopied, setTransferCopied] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    const load = async () => {
      try {
        setLoading(true);
        const [tenantData, propsData] = await Promise.all([
          getTenants({ page: 1, pageSize: 100 }),
          getProperties({ page: 1, pageSize: 100 }),
        ]);
        const found = tenantData.items.find((t) => t.tenantId === tenantId);
        if (found) {
          setTenant(found);
          if (found.rooms.length) setOldBedId(found.rooms[0].bedId);
        }
        setProperties(propsData.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenantId]);

  useEffect(() => {
    if (!selectedPropertyId) {
      setVacantBeds([]);
      return;
    }
    const loadBeds = async () => {
      const detail = await getProperty(selectedPropertyId);
      const options: VacantBedOption[] = [];
      detail.rooms.forEach((room) => {
        room.beds.forEach((bed) => {
          if (bed.status === "Vacant") {
            options.push({
              bedId: bed.bedId,
              label: `${room.roomNumber} / ${bed.bedNumber}`,
              rent: bed.monthlyRent,
            });
          }
        });
      });
      setVacantBeds(options);
    };
    loadBeds();
  }, [selectedPropertyId]);

  const handleAddRoom = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!tenantId || !addBedId) {
      setError("Please select a vacant bed.");
      return;
    }
    const rent = Number(addRent);
    if (!rent || rent <= 0) {
      setError("Please enter a valid rent amount.");
      return;
    }

    try {
      const response = await addBedToTenant({ tenantId, bedId: addBedId, agreedRent: rent });
      setTransferResult({
        stayAccessCode: response.stayAccessCode,
        message: response.message || "Room added successfully! Give this access code to the tenant for the new bed.",
      });
      setAddBedId("");
      setAddRent("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to add room.");
    }
  };

  const handleTransfer = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!tenantId || !oldBedId || !newBedId) {
      setError("Please select both rooms.");
      return;
    }
    const rent = Number(newRent);
    if (!rent || rent <= 0) {
      setError("Please enter a valid rent amount.");
      return;
    }

    try {
      setTransferring(true);
      const response = await transferTenantBed({
        tenantId,
        oldBedId,
        newBedId,
        newAgreedRent: rent,
      });

      // Capture returned stayAccessCode and display modal
      setTransferResult(response);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to transfer tenant.");
    } finally {
      setTransferring(false);
    }
  };

  const copyTransferCode = async () => {
    if (!transferResult?.stayAccessCode) return;
    try {
      await navigator.clipboard.writeText(transferResult.stayAccessCode);
      setTransferCopied(true);
      window.setTimeout(() => setTransferCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  const handleCloseTransferModal = () => {
    setTransferResult(null);
    navigate(`/tenants/${tenantId}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F0] p-8 text-center text-xs text-[#7D887D]">
        Loading...
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-[#F7F6F0] p-8 text-center">
        <p className="font-medium text-[#294436]">Tenant not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      <header className="border-b border-[#E3E6DE] bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4 sm:px-6">
          <button
            onClick={() => navigate(`/tenants/${tenantId}`)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#55755A] transition hover:text-[#1D4435]"
          >
            <ArrowLeft className="h-4 w-4" />
            {tenant.fullName}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {error && (
          <div className="rounded-lg border border-[#E7D4C7] bg-[#FBF0E9] px-3.5 py-3 text-xs font-medium text-[#8A624D]">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-[#D5E2D5] bg-[#E8EFE8] px-3.5 py-3 text-xs font-medium text-[#356248]">
            {success}
          </div>
        )}

        <div className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8EFE8] text-[#356248]">
              <BedDouble className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-medium text-[#294436]">Pick a property</h2>
              <p className="text-[11px] text-[#859083]">Vacant beds from this property will show below.</p>
            </div>
          </div>

          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
          >
            <option value="">Select a property</option>
            {properties.map((p) => (
              <option key={p.propertyId} value={p.propertyId}>{p.propertyName}</option>
            ))}
          </select>
        </div>

        {/* ADD EXTRA ROOM */}
        <div className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xs font-medium text-[#294436]">Add an extra room (multi-room tenant)</h2>
          <p className="mt-0.5 text-[11px] text-[#859083]">Give this tenant an additional bed in the selected property.</p>

          <form onSubmit={handleAddRoom} className="mt-4 space-y-3.5">
            <select
              value={addBedId}
              onChange={(e) => {
                setAddBedId(e.target.value);
                const bed = vacantBeds.find((b) => b.bedId === e.target.value);
                if (bed) setAddRent(String(bed.rent));
              }}
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
            >
              <option value="">Select a vacant bed</option>
              {vacantBeds.map((b) => (
                <option key={b.bedId} value={b.bedId}>{b.label} (₹{b.rent})</option>
              ))}
            </select>

            <input
              type="number"
              value={addRent}
              onChange={(e) => setAddRent(e.target.value)}
              placeholder="Agreed rent"
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
            />

            <button
              type="submit"
              className="flex h-10 w-full items-center justify-center rounded-lg bg-[#1D4435] text-xs font-medium text-white transition hover:bg-[#295640]"
            >
              Add Room
            </button>
          </form>
        </div>

        {/* TRANSFER */}
        <div className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xs font-medium text-[#294436]">Transfer to another room</h2>
          <p className="mt-0.5 text-[11px] text-[#859083]">Move the tenant from one of their current rooms to a vacant one.</p>

          <form onSubmit={handleTransfer} className="mt-4 space-y-3.5">
            <select
              value={oldBedId}
              onChange={(e) => setOldBedId(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
            >
              <option value="">Select current room</option>
              {tenant.rooms.map((r) => (
                <option key={r.bedId} value={r.bedId}>
                  {r.propertyName} / {r.roomNumber}-{r.bedNumber}
                </option>
              ))}
            </select>

            <select
              value={newBedId}
              onChange={(e) => {
                setNewBedId(e.target.value);
                const bed = vacantBeds.find((b) => b.bedId === e.target.value);
                if (bed) setNewRent(String(bed.rent));
              }}
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
            >
              <option value="">Select new vacant bed</option>
              {vacantBeds.map((b) => (
                <option key={b.bedId} value={b.bedId}>{b.label} (₹{b.rent})</option>
              ))}
            </select>

            <input
              type="number"
              value={newRent}
              onChange={(e) => setNewRent(e.target.value)}
              placeholder="New agreed rent"
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
            />

            <button
              type="submit"
              disabled={transferring}
              className="flex h-10 w-full items-center justify-center rounded-lg bg-[#A2634B] text-xs font-medium text-white transition hover:bg-[#8D543F] disabled:opacity-50"
            >
              {transferring ? "Transferring..." : "Transfer Tenant"}
            </button>
          </form>
        </div>
      </main>

      {/* TRANSFER SUCCESS MODAL */}
      {transferResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8EFE8] text-[#356248]">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <h1 className="mt-4 text-center text-sm font-medium text-[#294436]">
              Tenant Transferred
            </h1>

            <p className="mt-1 text-center text-xs text-[#859083]">
              The tenant has been successfully moved to the new bed.
            </p>

            {/* Stay Access Code Display */}
            <div className="mt-4 rounded-xl border border-[#D5E2D5] bg-[#E8EFE8] p-4">
              <p className="text-center text-[9px] font-medium uppercase tracking-[0.12em] text-[#356248]">
                New Stay Access Code
              </p>

              <div className="mt-2.5 flex items-center gap-2.5">
                <div className="min-w-0 flex-1 rounded-lg border border-[#D5E2D5] bg-white px-3.5 py-3">
                  <p className="break-all text-center text-xl font-medium tracking-[0.15em] text-[#294436]">
                    {transferResult.stayAccessCode || "Unavailable"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={copyTransferCode}
                  disabled={!transferResult.stayAccessCode}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#1D4435] text-white transition hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-40"
                  title="Copy stay access code"
                >
                  {transferCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="mt-2.5 text-center text-[11px] leading-4 text-[#356248]">
                {transferResult.message || "Give this new code to the tenant. The previous code has been invalidated."}
              </p>

              <div className="mt-3 rounded-lg bg-white/80 px-3.5 py-2.5">
                <p className="text-[11px] font-medium text-[#294436]">
                  Give this code to the tenant.
                </p>
                <p className="mt-0.5 text-[10px] leading-4 text-[#859083]">
                  This 6-digit access code is required for guest portal authentication and stay access.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={handleCloseTransferModal}
                className="flex h-10 w-full items-center justify-center rounded-lg bg-[#1D4435] text-xs font-medium text-white transition hover:bg-[#295640]"
              >
                Acknowledge & Return to Tenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}