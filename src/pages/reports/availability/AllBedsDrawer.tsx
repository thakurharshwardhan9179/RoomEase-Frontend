import {
  BedDouble,
  CheckCircle2,
  ChevronRight,
  Loader2,
  UserRound,
  Wrench,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getProperty,
  type Bed,
} from "../../../api/properties.api";

interface AllBedsDrawerProps {
  open: boolean;
  propertyId: string | null;

  properties: Array<{
    propertyId: string;
    propertyName: string;
  }>;

  onClose: () => void;

  onCheckIn: (
    propertyId: string,
    bedId: string
  ) => void;

  onTenant: (
    tenantId: string
  ) => void;

  onOperations: () => void;
}

interface BedItem {
  propertyId: string;
  propertyName: string;
  roomNumber: string;
  bed: Bed;
}

type BedFilter =
  | "All"
  | "Vacant"
  | "Occupied"
  | "NeedsCleaning";

export default function AllBedsDrawer({
  open,
  propertyId,
  properties,
  onClose,
  onCheckIn,
  onTenant,
  onOperations,
}: AllBedsDrawerProps) {
  const [items, setItems] =
    useState<BedItem[]>([]);

  const [filter, setFilter] =
    useState<BedFilter>("All");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        setItems([]);

        const targets = propertyId
          ? properties.filter(
              (item) =>
                item.propertyId ===
                propertyId
            )
          : properties;

        const responses =
          await Promise.all(
            targets.map(
              async (property) => ({
                property,
                detail:
                  await getProperty(
                    property.propertyId
                  ),
              })
            )
          );

        if (cancelled) return;

        const nextItems: BedItem[] =
          [];

        responses.forEach(
          ({ property, detail }) => {
            detail.rooms.forEach(
              (room) => {
                room.beds.forEach(
                  (bed) => {
                    nextItems.push({
                      propertyId:
                        property.propertyId,

                      propertyName:
                        property.propertyName,

                      roomNumber:
                        room.roomNumber,

                      bed,
                    });
                  }
                );
              }
            );
          }
        );

        nextItems.sort((a, b) =>
          `${a.propertyName}-${a.roomNumber}-${a.bed.bedNumber}`.localeCompare(
            `${b.propertyName}-${b.roomNumber}-${b.bed.bedNumber}`
          )
        );

        setItems(nextItems);
      } catch (err: any) {
        if (cancelled) return;

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load beds."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    propertyId,
    properties,
  ]);

  const counts = useMemo(() => {
    return {
      all: items.length,

      vacant: items.filter(
        (item) =>
          item.bed.status ===
          "Vacant"
      ).length,

      occupied: items.filter(
        (item) =>
          item.bed.status ===
          "Occupied"
      ).length,

      cleaning: items.filter(
        (item) =>
          item.bed.status ===
          "NeedsCleaning"
      ).length,
    };
  }, [items]);

  const filteredItems =
    useMemo(() => {
      if (filter === "All") {
        return items;
      }

      return items.filter(
        (item) =>
          item.bed.status ===
          filter
      );
    }, [filter, items]);

  if (!open) return null;

  const scopeTitle = propertyId
    ? properties.find(
        (item) =>
          item.propertyId ===
          propertyId
      )?.propertyName ||
      "Selected property"
    : "All properties";

  return (
    <div className="fixed inset-0 z-[70]">
      {/* BACKDROP */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close all beds"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
      />

      {/* DRAWER */}
      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">

        {/* HEADER */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">

          <div className="flex items-start justify-between p-5 sm:p-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600">
                Availability
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-950">
                All Beds
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {scopeTitle}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* FILTERS */}
          <div className="flex gap-2 overflow-x-auto px-5 pb-4 sm:px-6">

            <FilterButton
              label={`All ${counts.all}`}
              active={
                filter === "All"
              }
              onClick={() =>
                setFilter("All")
              }
            />

            <FilterButton
              label={`Vacant ${counts.vacant}`}
              active={
                filter === "Vacant"
              }
              onClick={() =>
                setFilter("Vacant")
              }
            />

            <FilterButton
              label={`Occupied ${counts.occupied}`}
              active={
                filter === "Occupied"
              }
              onClick={() =>
                setFilter("Occupied")
              }
            />

            <FilterButton
              label={`Cleaning ${counts.cleaning}`}
              active={
                filter ===
                "NeedsCleaning"
              }
              onClick={() =>
                setFilter(
                  "NeedsCleaning"
                )
              }
            />
          </div>
        </div>

        {/* BODY */}
        <div className="p-5 sm:p-6">

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-12">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />

                Loading beds...
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : filteredItems.length ===
            0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <BedDouble className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-extrabold text-slate-900">
                No beds found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try another status filter.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map(
                (item) => {
                  const status =
                    item.bed.status;

                  const tenant =
                    item.bed.tenant;

                  return (
                    <div
                      key={`${item.propertyId}-${item.bed.bedId}`}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        {/* INFO */}
                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge
                              status={
                                status
                              }
                            />

                            <span className="text-[10px] font-bold text-slate-400">
                              {
                                item.propertyName
                              }
                            </span>
                          </div>

                          <h3 className="mt-2 text-sm font-extrabold text-slate-900">
                            Room{" "}
                            {
                              item.roomNumber
                            }

                            {" · "}

                            Bed{" "}
                            {
                              item.bed
                                .bedNumber
                            }
                          </h3>

                          {tenant && (
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {
                                tenant.fullName
                              }
                            </p>
                          )}
                        </div>

                        {/* ACTION */}
                        <div className="shrink-0">

                          {status ===
                            "Vacant" && (
                            <button
                              type="button"
                              onClick={() =>
                                onCheckIn(
                                  item.propertyId,
                                  item.bed.bedId
                                )
                              }
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700"
                            >
                              Check-in

                              <ChevronRight className="h-4 w-4" />
                            </button>
                          )}

                          {status ===
                            "Occupied" &&
                            tenant && (
                            <button
                              type="button"
                              onClick={() =>
                                onTenant(
                                  tenant.tenantId
                                )
                              }
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                            >
                              View Tenant

                              <ChevronRight className="h-4 w-4" />
                            </button>
                          )}

                          {status ===
                            "NeedsCleaning" && (
                            <button
                              type="button"
                              onClick={
                                onOperations
                              }
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-extrabold text-amber-700 hover:bg-amber-100"
                            >
                              Operations

                              <Wrench className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-xl px-3 py-2 text-xs font-extrabold transition ${
        active
          ? "bg-slate-950 text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (status === "Vacant") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Vacant
      </span>
    );
  }

  if (status === "Occupied") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-700">
        <UserRound className="h-3 w-3" />
        Occupied
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700">
      <Wrench className="h-3 w-3" />
      Needs Cleaning
    </span>
  );
}