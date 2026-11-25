import {
  Check,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Wifi,
  Wrench,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  addService,
  deactivateService,
  getServicesByProperty,
  updateService,
  type Service,
  type ServiceDepartment,
} from "../../api/services.api";

import {
  getProperties,
  type Property,
} from "../../api/properties.api";

const DEPARTMENTS: ServiceDepartment[] = [
  "Housekeeping",
  "Maintenance",
  "IT",
  "Other",
];

const META: Record<
  ServiceDepartment,
  {
    label: string;
    description: string;
    icon: ReactNode;
  }
> = {
  Housekeeping: {
    label: "Housekeeping",
    description:
      "Cleaning, linen and room services",
    icon: (
      <Sparkles className="h-4 w-4" />
    ),
  },
  Maintenance: {
    label: "Maintenance",
    description:
      "AC, electrical, plumbing and furniture",
    icon: (
      <Wrench className="h-4 w-4" />
    ),
  },
  IT: {
    label: "IT & Wi-Fi",
    description:
      "Internet and technology assistance",
    icon: (
      <Wifi className="h-4 w-4" />
    ),
  },
  Other: {
    label: "Other Services",
    description:
      "Laundry, front desk and general help",
    icon: (
      <SlidersHorizontal className="h-4 w-4" />
    ),
  },
};

function apiError(error: any, fallback: string) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export default function Services() {
  const [properties, setProperties] =
    useState<Property[]>([]);

  const [selectedPropertyId, setSelectedPropertyId] =
    useState("");

  const [services, setServices] =
    useState<Service[]>([]);

  const [loadingProperties, setLoadingProperties] =
    useState(true);

  const [loadingServices, setLoadingServices] =
    useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showAdd, setShowAdd] =
    useState(false);

  const [editingService, setEditingService] =
    useState<Service | null>(null);

  const [busyId, setBusyId] =
    useState<string | null>(null);

  const loadProperties = async () => {
    try {
      setLoadingProperties(true);
      setError("");

      const response =
        await getProperties({
          page: 1,
          pageSize: 100,
        });

      const items = Array.isArray(response)
        ? response
        : response?.items || [];

      setProperties(items);

      if (
        !selectedPropertyId &&
        items.length > 0
      ) {
        setSelectedPropertyId(
          items[0].propertyId,
        );
      }
    } catch (error) {
      setError(
        apiError(
          error,
          "Unable to load properties.",
        ),
      );
    } finally {
      setLoadingProperties(false);
    }
  };

  const loadServices = async () => {
    if (!selectedPropertyId) {
      setServices([]);
      return;
    }

    try {
      setLoadingServices(true);
      setError("");

      const data =
        await getServicesByProperty(
          selectedPropertyId,
        );

      setServices(data);
    } catch (error) {
      setError(
        apiError(
          error,
          "Unable to load services.",
        ),
      );

      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    loadServices();
  }, [selectedPropertyId]);

  const filteredServices =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return services;
      }

      return services.filter(
        (service) =>
          service.name
            .toLowerCase()
            .includes(query) ||
          service.department
            .toLowerCase()
            .includes(query) ||
          (service.description || "")
            .toLowerCase()
            .includes(query),
      );
    }, [services, search]);

  const grouped = useMemo(() => {
    const result: Record<
      ServiceDepartment,
      Service[]
    > = {
      Housekeeping: [],
      Maintenance: [],
      IT: [],
      Other: [],
    };

    filteredServices.forEach(
      (service) => {
        if (
          result[service.department]
        ) {
          result[
            service.department
          ].push(service);
        }
      },
    );

    Object.values(result).forEach(
      (items) =>
        items.sort(
          (a, b) =>
            (a.sortOrder || 0) -
              (b.sortOrder || 0) ||
            a.name.localeCompare(
              b.name,
            ),
        ),
    );

    return result;
  }, [filteredServices]);

  const activeCount =
    services.filter(
      (service) => service.isActive,
    ).length;

  const inactiveCount =
    services.filter(
      (service) => !service.isActive,
    ).length;

  const handleDeactivate = async (
    service: Service,
  ) => {
    const confirmed =
      window.confirm(
        `Deactivate "${service.name}"?\n\nIt will disappear from the guest list, but existing task history remains safe.`,
      );

    if (!confirmed) return;

    try {
      setBusyId(service.serviceId);
      setError("");

      await deactivateService(
        service.serviceId,
      );

      await loadServices();
    } catch (error) {
      setError(
        apiError(
          error,
          "Unable to deactivate service.",
        ),
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      <main className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
              Guest self-service
            </p>

            <h1 className="mt-1 text-xl font-medium tracking-tight text-[#294436] sm:text-2xl">
              Services
            </h1>

            <p className="mt-0.5 max-w-2xl text-xs leading-5 text-[#859083]">
              Manage non-food services that guests can request from their room QR.
            </p>
          </div>

          <button
            type="button"
            disabled={!selectedPropertyId}
            onClick={() => setShowAdd(true)}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-4 text-xs font-medium text-white shadow-sm hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        </div>

        <section className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                Property
              </p>

              <h2 className="mt-1 text-xs font-medium text-[#294436]">
                Select property
              </h2>
            </div>

            <select
              value={selectedPropertyId}
              onChange={(event) =>
                setSelectedPropertyId(
                  event.target.value,
                )
              }
              disabled={loadingProperties}
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3.5 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] lg:max-w-md"
            >
              <option value="">
                {loadingProperties
                  ? "Loading..."
                  : "Select property"}
              </option>

              {properties.map(
                (property) => (
                  <option
                    key={
                      property.propertyId
                    }
                    value={
                      property.propertyId
                    }
                  >
                    {property.propertyName} ·{" "}
                    {property.city}
                  </option>
                ),
              )}
            </select>
          </div>

          {selectedPropertyId && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-md bg-[#E8EFE8] px-2.5 py-1 text-[10px] font-medium text-[#356248]">
                {activeCount} active
              </span>

              <span className="rounded-md bg-[#EDF1F3] px-2.5 py-1 text-[10px] font-medium text-[#5C7180]">
                {inactiveCount} inactive
              </span>
            </div>
          )}
        </section>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7D887D]" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search services..."
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white pl-9 pr-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:ring-4 focus:ring-[#E3EADF]"
            />
          </div>

          <button
            type="button"
            onClick={loadServices}
            disabled={
              !selectedPropertyId ||
              loadingServices
            }
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E3E6DE] bg-white px-3.5 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC] disabled:opacity-40"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                loadingServices
                  ? "animate-spin"
                  : ""
              }`}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] p-4 text-xs text-[#8A624D]">
            <div>
              <p className="font-medium">
                Action failed
              </p>
              <p className="mt-0.5">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="rounded-lg p-1 text-[#A17255] hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="space-y-5">
          {!selectedPropertyId ? (
            <EmptyState
              title="Select a property"
              description="Choose a property to manage its guest services."
            />
          ) : loadingServices ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {Array.from({
                length: 4,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-44 animate-pulse rounded-xl border border-[#E3E6DE] bg-white"
                />
              ))}
            </div>
          ) : filteredServices.length ===
            0 ? (
            <EmptyState
              title={
                search.trim()
                  ? "No matching services"
                  : "No services yet"
              }
              description={
                search.trim()
                  ? "Try another search."
                  : "Add a service so guests can request it from the QR page."
              }
              action={
                !search.trim()
                  ? {
                      label:
                        "Add Service",
                      onClick: () =>
                        setShowAdd(
                          true,
                        ),
                    }
                  : undefined
              }
            />
          ) : (
            DEPARTMENTS.map(
              (department) => {
                const items =
                  grouped[
                    department
                  ];

                if (
                  items.length === 0
                ) {
                  return null;
                }

                const meta =
                  META[department];

                return (
                  <section
                    key={department}
                    className="overflow-hidden rounded-xl border border-[#E3E6DE] bg-white shadow-sm"
                  >
                    <div className="border-b border-[#EEF0E9] p-4 sm:p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8EFE8] text-[#356248]">
                          {meta.icon}
                        </div>

                        <div>
                          <h2 className="text-xs font-medium text-[#294436]">
                            {meta.label}
                          </h2>

                          <p className="text-[11px] text-[#859083]">
                            {meta.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-[#EEF0E9]">
                      {items.map(
                        (service) => (
                          <div
                            key={
                              service.serviceId
                            }
                            className={`flex flex-col gap-4 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between ${
                              service.isActive
                                ? "bg-white"
                                : "bg-[#F7F6F0]/60"
                            }`}
                          >
                            <div className="flex min-w-0 items-start gap-3">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                  service.isActive
                                    ? "bg-[#E8EFE8] text-[#356248]"
                                    : "bg-[#DFE4DA] text-[#7D887D]"
                                }`}
                              >
                                {service.isActive ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3
                                    className={`text-xs font-medium ${
                                      service.isActive
                                        ? "text-[#294436]"
                                        : "text-[#859083]"
                                    }`}
                                  >
                                    {
                                      service.name
                                    }
                                  </h3>

                                  <span
                                    className={`rounded-md px-2 py-0.5 text-[9px] font-medium uppercase ${
                                      service.isActive
                                        ? "bg-[#E8EFE8] text-[#356248]"
                                        : "bg-[#DFE4DA] text-[#7D887D]"
                                    }`}
                                  >
                                    {service.isActive
                                      ? "Active"
                                      : "Inactive"}
                                  </span>
                                </div>

                                {service.description && (
                                  <p className="mt-1 text-xs text-[#859083]">
                                    {
                                      service.description
                                    }
                                  </p>
                                )}

                                <p className="mt-1.5 text-[10px] text-[#8C9782]">
                                  Sort order:{" "}
                                  {
                                    service.sortOrder
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingService(
                                    service,
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E3E6DE] bg-white px-3 py-1.5 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC]"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                Edit
                              </button>

                              {service.isActive && (
                                <button
                                  type="button"
                                  disabled={
                                    busyId ===
                                    service.serviceId
                                  }
                                  onClick={() =>
                                    handleDeactivate(
                                      service,
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7D4C7] bg-white px-3 py-1.5 text-xs font-medium text-[#A2634B] hover:bg-[#FBF0E9] disabled:opacity-40"
                                >
                                  {busyId ===
                                  service.serviceId ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <ToggleRight className="h-3.5 w-3.5" />
                                  )}
                                  Deactivate
                                </button>
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </section>
                );
              },
            )
          )}
        </section>
      </main>

      {showAdd &&
        selectedPropertyId && (
          <ServiceModal
            mode="add"
            propertyId={
              selectedPropertyId
            }
            defaultSortOrder={
              services.length
                ? Math.max(
                    ...services.map(
                      (item) =>
                        item.sortOrder ||
                        0,
                    ),
                  ) + 1
                : 1
            }
            onClose={() =>
              setShowAdd(false)
            }
            onSaved={async () => {
              setShowAdd(false);
              await loadServices();
            }}
            setError={setError}
          />
        )}

      {editingService && (
        <ServiceModal
          mode="edit"
          propertyId={
            selectedPropertyId
          }
          service={editingService}
          onClose={() =>
            setEditingService(null)
          }
          onSaved={async () => {
            setEditingService(null);
            await loadServices();
          }}
          setError={setError}
        />
      )}
    </div>
  );
}

function ServiceModal({
  mode,
  propertyId,
  service,
  defaultSortOrder,
  onClose,
  onSaved,
  setError,
}: {
  mode: "add" | "edit";
  propertyId: string;
  service?: Service;
  defaultSortOrder?: number;
  onClose: () => void;
  onSaved: () => Promise<void>;
  setError: (value: string) => void;
}) {
  const [name, setName] = useState(
    service?.name || "",
  );

  const [department, setDepartment] =
    useState<ServiceDepartment>(
      service?.department ||
        "Housekeeping",
    );

  const [description, setDescription] =
    useState(
      service?.description || "",
    );

  const [sortOrder, setSortOrder] =
    useState(
      String(
        service?.sortOrder ??
          defaultSortOrder ??
          1,
      ),
    );

  const [isActive, setIsActive] =
    useState(
      service?.isActive ?? true,
    );

  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] =
    useState("");

  const submit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();
    setLocalError("");

    const cleanName = name.trim();
    const order = Number(
      sortOrder,
    );

    if (!cleanName) {
      setLocalError(
        "Service name is required.",
      );
      return;
    }

    if (
      cleanName.length > 150
    ) {
      setLocalError(
        "Service name must be 150 characters or less.",
      );
      return;
    }

    if (
      description.trim().length >
      500
    ) {
      setLocalError(
        "Description must be 500 characters or less.",
      );
      return;
    }

    if (
      !Number.isInteger(order) ||
      order < 0
    ) {
      setLocalError(
        "Sort order must be a non-negative integer.",
      );
      return;
    }

    try {
      setBusy(true);

      if (mode === "add") {
        await addService({
          propertyId,
          name: cleanName,
          department,
          description:
            description.trim() ||
            undefined,
          sortOrder: order,
        });
      } else if (service) {
        await updateService(
          service.serviceId,
          {
            name: cleanName,
            department,
            description:
              description.trim() ||
              undefined,
            isActive,
            sortOrder: order,
          },
        );
      }

      await onSaved();
    } catch (error) {
      setLocalError(
        apiError(
          error,
          mode === "add"
            ? "Unable to add service."
            : "Unable to update service.",
        ),
      );
      setError("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#EEF0E9] p-5 sm:p-6">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
              {mode === "add"
                ? "New service"
                : "Edit service"}
            </p>

            <h2 className="mt-0.5 text-sm font-medium text-[#294436]">
              {mode === "add"
                ? "Add Guest Service"
                : "Edit Guest Service"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#7D887D] hover:bg-[#F2F4EC] hover:text-[#294436]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 p-5 sm:p-6"
        >
          {localError && (
            <div className="rounded-lg border border-[#E7D4C7] bg-[#FBF0E9] p-3 text-xs text-[#8A624D]">
              {localError}
            </div>
          )}

          <label className="block">
            <span className="text-xs font-medium text-[#304B35]">
              Service name
            </span>

            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="Room Cleaning"
              maxLength={150}
              className="mt-1.5 h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3.5 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
            />
          </label>

          <div>
            <span className="text-xs font-medium text-[#304B35]">
              Department
            </span>

            <div className="mt-2 grid grid-cols-2 gap-2">
              {DEPARTMENTS.map(
                (item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() =>
                      setDepartment(
                        item,
                      )
                    }
                    className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition ${
                      department ===
                      item
                        ? "border-[#1D4435] bg-[#1D4435] text-white shadow-sm"
                        : "border-[#E3E6DE] bg-white text-[#40543E] hover:border-[#C7D3C7]"
                    }`}
                  >
                    {
                      META[item].label
                    }
                  </button>
                ),
              )}
            </div>
          </div>

          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#304B35]">
                Description
              </span>

              <span className="text-[10px] text-[#8C9782]">
                Optional
              </span>
            </div>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              rows={3}
              maxLength={500}
              placeholder="Short description for the guest"
              className="mt-1.5 w-full resize-none rounded-lg border border-[#DFE4DA] px-3.5 py-2.5 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-[#304B35]">
                Sort order
              </span>

              <input
                type="number"
                min={0}
                step={1}
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(
                    event.target.value,
                  )
                }
                className="mt-1.5 h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3.5 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
              />
            </label>

            {mode === "edit" && (
              <div>
                <span className="text-xs font-medium text-[#304B35]">
                  Guest visibility
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setIsActive(
                      (current) =>
                        !current,
                    )
                  }
                  className={`mt-1.5 flex h-10 w-full items-center justify-between rounded-lg border px-3 text-xs font-medium transition ${
                    isActive
                      ? "border-[#D5E2D5] bg-[#E8EFE8] text-[#356248]"
                      : "border-[#E3E6DE] bg-[#F7F6F0] text-[#7D887D]"
                  }`}
                >
                  <span>
                    {isActive
                      ? "Active"
                      : "Inactive"}
                  </span>

                  {isActive ? (
                    <ToggleRight className="h-4 w-4" />
                  ) : (
                    <ToggleLeft className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-[#EEF0E9] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3.5 py-2 text-xs font-medium text-[#55755A] hover:bg-[#F2F4EC]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4435] px-4 py-2 text-xs font-medium text-white hover:bg-[#295640] disabled:opacity-50"
            >
              {busy && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}

              {mode === "add"
                ? "Add Service"
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div className="rounded-xl border border-dashed border-[#DFE4DA] bg-white px-6 py-12 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
        <SlidersHorizontal className="h-5 w-5" />
      </div>

      <h3 className="mt-3 text-xs font-medium text-[#294436]">
        {title}
      </h3>

      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#859083]">
        {description}
      </p>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          {action.label}
        </button>
      )}
    </div>
  );
}