import {
  BedDouble,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import {
  getProperty,
  type Bed,
} from "../../../api/properties.api";

function money(value: number) {
  return `₹${Number(
    value || 0
  ).toLocaleString("en-IN")}`;
}

interface VacantBedsDrawerProps {
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
}

interface VacantBedItem {
  propertyId: string;
  propertyName: string;
  roomNumber: string;
  bed: Bed;
}

export default function VacantBedsDrawer({
  open,
  propertyId,
  properties,
  onClose,
  onCheckIn,
}: VacantBedsDrawerProps) {
  const [items, setItems] =
    useState<VacantBedItem[]>([]);

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

        const nextItems: VacantBedItem[] =
          [];

        responses.forEach(
          ({ property, detail }) => {
            detail.rooms.forEach(
              (room) => {
                room.beds
                  .filter(
                    (bed) =>
                      bed.status ===
                      "Vacant"
                  )
                  .forEach((bed) => {
                    nextItems.push({
                      propertyId:
                        property.propertyId,
                      propertyName:
                        property.propertyName,
                      roomNumber:
                        room.roomNumber,
                      bed,
                    });
                  });
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
            "Unable to load vacant beds."
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

  if (!open) return null;

  const scopeTitle = propertyId
    ? properties.find(
        (item) =>
          item.propertyId ===
          propertyId
      )?.propertyName
    : "All properties";

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close vacant beds"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">

        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-5 sm:p-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
              Availability
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950">
              Vacant Beds
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

        {/* BODY */}
        <div className="p-5 sm:p-6">
          {loading ? (
            <LoadingState label="Loading vacant beds..." />
          ) : error ? (
            <ErrorState message={error} />
          ) : items.length === 0 ? (
            <EmptyState label="No vacant beds found." />
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.propertyId}-${item.bed.bedId}`}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-emerald-600" />

                        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                          Vacant
                        </p>
                      </div>

                      <h3 className="mt-2 text-sm font-extrabold text-slate-900">
                        {item.propertyName}
                      </h3>

                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Room {item.roomNumber}
                        {" · "}
                        Bed {item.bed.bedNumber}
                      </p>

                      <p className="mt-2 text-xs font-bold text-slate-700">
                        {money(
                          item.bed.monthlyRent
                        )}
                        {" / month"}
                      </p>
                    </div>

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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function LoadingState({
  label,
}: {
  label: string;
}) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-12">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}

function ErrorState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
      {message}
    </div>
  );
}

function EmptyState({
  label,
}: {
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
      <BedDouble className="mx-auto h-8 w-8 text-slate-300" />

      <p className="mt-3 text-sm font-extrabold text-slate-900">
        {label}
      </p>
    </div>
  );
}