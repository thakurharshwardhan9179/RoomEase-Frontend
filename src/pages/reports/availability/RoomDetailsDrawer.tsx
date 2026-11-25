import {
  BedDouble,
  Building2,
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
  type PropertyDetail,
} from "../../../api/properties.api";

interface RoomDetailsDrawerProps {
  open: boolean;
  propertyId: string | null;

  properties: Array<{
    propertyId: string;
    propertyName: string;
  }>;

  onClose: () => void;

  onOpenProperty: (
    propertyId: string
  ) => void;
}

interface PropertyDetailItem {
  propertyId: string;
  propertyName: string;
  detail: PropertyDetail;
}

export default function RoomDetailsDrawer({
  open,
  propertyId,
  properties,
  onClose,
  onOpenProperty,
}: RoomDetailsDrawerProps) {
  const [details, setDetails] =
    useState<
      PropertyDetailItem[]
    >([]);

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
        setDetails([]);

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
                propertyId:
                  property.propertyId,

                propertyName:
                  property.propertyName,

                detail:
                  await getProperty(
                    property.propertyId
                  ),
              })
            )
          );

        if (cancelled) return;

        setDetails(responses);
      } catch (err: any) {
        if (cancelled) return;

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load rooms."
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
      )?.propertyName ||
      "Selected property"
    : "All properties";

  return (
    <div className="fixed inset-0 z-[70]">

      {/* BACKDROP */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close room details"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
      />

      {/* DRAWER */}
      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">

        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-5 sm:p-6">

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600">
              Availability
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950">
              Room Details
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
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-12">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />

                Loading rooms...
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : details.length ===
            0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <Building2 className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-extrabold text-slate-900">
                No rooms found
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {details.map(
                ({
                  propertyId,
                  propertyName,
                  detail,
                }) => (
                  <section
                    key={propertyId}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >

                    {/* PROPERTY HEADER */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">
                          {propertyName}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            detail.rooms
                              .length
                          }{" "}
                          room
                          {detail.rooms
                            .length !==
                          1
                            ? "s"
                            : ""}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onOpenProperty(
                            propertyId
                          )
                        }
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                      >
                        Open Property

                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* ROOMS */}
                    <div className="mt-4 grid gap-3">

                      {detail.rooms.map(
                        (room) => {
                          const occupied =
                            room.beds.filter(
                              (bed) =>
                                bed.status ===
                                "Occupied"
                            ).length;

                          const vacant =
                            room.beds.filter(
                              (bed) =>
                                bed.status ===
                                "Vacant"
                            ).length;

                          const cleaning =
                            room.beds.filter(
                              (bed) =>
                                bed.status ===
                                "NeedsCleaning"
                            ).length;

                          return (
                            <div
                              key={
                                room.roomId
                              }
                              className="rounded-xl border border-slate-200 bg-white p-4"
                            >

                              <div className="flex items-start justify-between gap-4">

                                <div>
                                  <div className="flex items-center gap-2">
                                    <BedDouble className="h-4 w-4 text-indigo-600" />

                                    <h4 className="text-sm font-extrabold text-slate-900">
                                      Room{" "}
                                      {
                                        room.roomNumber
                                      }
                                    </h4>
                                  </div>

                                  <p className="mt-1 text-xs font-semibold text-slate-400">
                                    {
                                      room.roomType
                                    }
                                  </p>
                                </div>

                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">
                                  {
                                    room
                                      .beds
                                      .length
                                  }{" "}
                                  beds
                                </span>
                              </div>

                              {/* STATS */}
                              <div className="mt-4 grid grid-cols-3 gap-2">

                                <RoomStat
                                  label="Beds"
                                  value={
                                    room
                                      .beds
                                      .length
                                  }
                                />

                                <RoomStat
                                  label="Occupied"
                                  value={
                                    occupied
                                  }
                                  tone="red"
                                />

                                <RoomStat
                                  label="Vacant"
                                  value={
                                    vacant
                                  }
                                  tone="green"
                                />

                              </div>

                              {/* CLEANING */}
                              {cleaning >
                                0 && (
                                <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-700">
                                  {
                                    cleaning
                                  }{" "}
                                  bed
                                  {cleaning >
                                  1
                                    ? "s"
                                    : ""}{" "}
                                  need cleaning
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}

                    </div>
                  </section>
                )
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function RoomStat({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "slate" | "red" | "green";
}) {
  const classes =
    tone === "red"
      ? "bg-red-50 text-red-700"
      : tone === "green"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-slate-50 text-slate-900";

  return (
    <div
      className={`rounded-xl p-2.5 text-center ${classes}`}
    >
      <p className="text-[9px] font-black uppercase tracking-wider opacity-60">
        {label}
      </p>

      <p className="mt-1 text-sm font-black">
        {value}
      </p>
    </div>
  );
}