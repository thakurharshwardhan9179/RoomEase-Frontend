import {
  BedDouble,
  Building2,
  CheckCircle2,
  DoorOpen,
  Users,
} from "lucide-react";

import type {
  AvailabilityItem,
  AvailabilityTotals,
} from "../report.types";

interface AvailabilityTableProps {
  items: AvailabilityItem[];
  totals: AvailabilityTotals;

  onAllRoomsClick: () => void;
  onAllBedsClick: () => void;
  onAllOccupiedClick: () => void;
  onAllVacantClick: () => void;

  onPropertyClick: (
    propertyId: string
  ) => void;

  onRoomsClick: (
    propertyId: string
  ) => void;

  onBedsClick: (
    propertyId: string
  ) => void;

  onOccupiedClick: (
    propertyId: string
  ) => void;

  onVacantClick: (
    propertyId: string
  ) => void;
}

export default function AvailabilityTable({
  items,
  totals,

  onAllRoomsClick,
  onAllBedsClick,
  onAllOccupiedClick,
  onAllVacantClick,

  onPropertyClick,
  onRoomsClick,
  onBedsClick,
  onOccupiedClick,
  onVacantClick,
}: AvailabilityTableProps) {
  const occupancy = totals.beds
    ? Math.round(
        (totals.occupied /
          totals.beds) *
          100
      )
    : 0;

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-sm">

      {/* =================================================
          SUMMARY
      ================================================= */}
      <div className="grid gap-3 border-b border-slate-200 p-5 sm:grid-cols-2 lg:grid-cols-5 sm:p-6">

        <SummaryButton
          label="Rooms"
          value={totals.rooms}
          icon={
            <Building2 className="h-5 w-5" />
          }
          onClick={onAllRoomsClick}
        />

        <SummaryButton
          label="Beds"
          value={totals.beds}
          icon={
            <BedDouble className="h-5 w-5" />
          }
          onClick={onAllBedsClick}
        />

        <SummaryButton
          label="Occupied"
          value={totals.occupied}
          tone="red"
          icon={
            <Users className="h-5 w-5" />
          }
          onClick={onAllOccupiedClick}
        />

        <SummaryButton
          label="Vacant"
          value={totals.vacant}
          tone="green"
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
          onClick={onAllVacantClick}
        />

        <SummaryButton
          label="Occupancy"
          value={`${occupancy}%`}
          tone="indigo"
          icon={
            <DoorOpen className="h-5 w-5" />
          }
        />
      </div>

      {/* =================================================
          TABLE
      ================================================= */}
      {items.length === 0 ? (
        <div className="p-12 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-300" />

          <p className="mt-3 text-sm font-extrabold text-slate-900">
            No properties found.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">

            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-5 py-4">
                  Property
                </th>

                <th className="px-5 py-4">
                  City
                </th>

                <th className="px-5 py-4">
                  Rooms
                </th>

                <th className="px-5 py-4">
                  Beds
                </th>

                <th className="px-5 py-4">
                  Occupied
                </th>

                <th className="px-5 py-4">
                  Vacant
                </th>

                <th className="px-5 py-4">
                  Occupancy
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {items.map((item) => (
                <tr
                  key={item.propertyId}
                  className="transition hover:bg-slate-50"
                >
                  {/* PROPERTY */}
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        onPropertyClick(
                          item.propertyId
                        )
                      }
                      className="text-sm font-extrabold text-slate-900 hover:text-indigo-600"
                    >
                      {item.propertyName}
                    </button>

                    <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                      Open property
                    </p>
                  </td>

                  {/* CITY */}
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {item.city}
                  </td>

                  {/* ROOMS */}
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        onRoomsClick(
                          item.propertyId
                        )
                      }
                      className="rounded-xl px-3 py-2 text-sm font-extrabold text-slate-800 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      {item.totalRooms}
                    </button>
                  </td>

                  {/* BEDS */}
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        onBedsClick(
                          item.propertyId
                        )
                      }
                      className="rounded-xl px-3 py-2 text-sm font-extrabold text-slate-800 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      {item.totalBeds}
                    </button>
                  </td>

                  {/* OCCUPIED */}
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        onOccupiedClick(
                          item.propertyId
                        )
                      }
                      className="rounded-xl bg-red-50 px-3 py-2 text-sm font-extrabold text-red-700 hover:bg-red-100"
                    >
                      {item.occupiedBeds}
                    </button>
                  </td>

                  {/* VACANT */}
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        onVacantClick(
                          item.propertyId
                        )
                      }
                      className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-extrabold text-emerald-700 hover:bg-emerald-100"
                    >
                      {item.vacantBeds}
                    </button>
                  </td>

                  {/* OCCUPANCY */}
                  <td className="px-5 py-4">
                    <div className="min-w-[100px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-slate-700">
                          {item.occupancy}%
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{
                            width: `${Math.min(
                              item.occupancy,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
        <p className="text-[11px] font-semibold text-slate-500">
          Click any summary card or property-level number to inspect the actual rooms and beds.
        </p>
      </div>
    </section>
  );
}

function SummaryButton({
  label,
  value,
  icon,
  tone = "slate",
  onClick,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: "slate" | "red" | "green" | "indigo";
  onClick?: () => void;
}) {
  const toneClass =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
      : tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : tone === "indigo"
      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
      : "border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100";

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
          {label}
        </span>

        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 shadow-sm">
          {icon}
        </span>
      </div>

      <p className="mt-2 text-2xl font-black">
        {value}
      </p>

      {onClick && (
        <p className="mt-1 text-[10px] font-bold opacity-60">
          Click to inspect
        </p>
      )}
    </>
  );

  if (!onClick) {
    return (
      <div
        className={`rounded-2xl border p-4 ${toneClass}`}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${toneClass}`}
    >
      {content}
    </button>
  );
}