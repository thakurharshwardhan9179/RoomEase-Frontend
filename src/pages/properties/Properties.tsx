import {
  Building2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { getProperties, type Property } from "../../api/properties.api";
import { getPropertyImages } from "../../api/propertyImages.api";

const PAGE_SIZE = 9;
const PROPERTY_TYPES = ["All", "PG", "Hostel", "Apartment"] as const;

type PropertyTypeFilter = (typeof PROPERTY_TYPES)[number];

function formatError(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load properties. Please try again."
  );
}

function getApiOrigin(): string {
  const baseUrl = api.defaults?.baseURL || "http://192.168.1.31:5100";
  return baseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

function buildImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl || typeof imageUrl !== "string") return null;
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${getApiOrigin()}${normalizedPath}`;
}

export default function Properties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyImages, setPropertyImages] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyTypeFilter>("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProperties = async (currentPage = page) => {
    try {
      setLoading(true);
      setError("");
      const data = await getProperties({
        search: search.trim() || undefined,
        propertyType: propertyType === "All" ? undefined : propertyType,
        page: currentPage,
        pageSize: PAGE_SIZE,
      });
      const items = data.items ?? [];
      setProperties(items);
      setTotalPages(Math.max(data.totalPages || 1, 1));
      setTotalCount(data.totalCount ?? 0);

      const results = await Promise.all(
        items.map(async (item) => {
          try {
            const imgs = await getPropertyImages(item.propertyId);
            const url = buildImageUrl(imgs?.[0]?.imageUrl);
            return [item.propertyId, url] as const;
          } catch {
            return [item.propertyId, null] as const;
          }
        })
      );

      const nextImages: Record<string, string> = {};
      for (const [id, url] of results) {
        if (url) nextImages[id] = url;
      }
      setPropertyImages(nextImages);
    } catch (err) {
      console.error(err);
      setError(formatError(err));
      setProperties([]);
      setPropertyImages({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, propertyType]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadProperties(page), 350);
    return () => window.clearTimeout(timer);
  }, [search, propertyType, page]);

  const visibleRange = useMemo(() => {
    if (!totalCount || !properties.length) return null;
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(start + properties.length - 1, totalCount);
    return `${start}-${end}`;
  }, [page, properties.length, totalCount]);

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      <div className="w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        
        {/* HERO BANNER */}
        <div className="relative overflow-hidden rounded-2xl bg-[#1D4435] p-6 sm:p-10 text-white shadow-md">
          {/* Subtle Glow Effects */}
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-10 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-[#E8EFE8]">
                <Building2 className="h-3 w-3 text-[#A4B8A6]" />
                Property Portfolio & Assets
              </span>

              <h1 className="mt-3 text-2xl font-medium tracking-tight sm:text-[32px] text-white">
                Your properties
              </h1>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-[#C4D0C5]">
                Manage every PG, hostel and apartment from one place. Open a property to manage rooms, beds and tenants.
              </p>
            </div>

            {/* Add Property Action Button */}
            <div>
              <button
                type="button"
                onClick={() => navigate("/onboarding/property")}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-medium text-[#1D4435] shadow-sm transition hover:bg-[#F2F4EC]"
              >
                <Plus className="h-4 w-4" />
                <span>Add property</span>
              </button>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS SECTION */}
        <section className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7D887D]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by property or city"
                className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 pl-9 pr-9 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-1.5 text-xs font-bold text-[#7D887D] hover:text-[#294436]"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="mr-1 hidden items-center gap-1.5 text-[11px] font-medium text-[#7D887D] sm:flex">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Type
              </span>
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setPropertyType(type)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-medium transition ${
                    propertyType === type
                      ? "bg-[#1D4435] text-white shadow-sm"
                      : "bg-[#F2F4EC] text-[#40543E] hover:bg-[#E8EFE8]"
                  }`}
                >
                  {type}
                </button>
              ))}
              <button
                onClick={() => loadProperties(page)}
                className="ml-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E3E6DE] text-[#55755A] transition hover:bg-[#F2F4EC]"
                aria-label="Refresh properties"
                title="Refresh"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </section>

        {error && (
          <section className="rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium text-[#8A624D]">Couldn&apos;t load properties</p>
                <p className="mt-1 text-[11px] text-[#A17255]">{error}</p>
              </div>
              <button
                onClick={() => loadProperties(page)}
                className="rounded-lg border border-[#DEC7B8] bg-white px-3.5 py-2 text-[11px] font-medium text-[#815A43] shadow-sm"
              >
                Retry
              </button>
            </div>
          </section>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-64 animate-pulse rounded-xl border border-[#E3E6DE] bg-white" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <section className="rounded-xl border border-[#E3E6DE] bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F2F4EC] text-[#55755A]">
              <Building2 className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-sm font-medium text-[#294436]">
              {search || propertyType !== "All" ? "No matching properties" : "No properties yet"}
            </h2>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#859083]">
              {search || propertyType !== "All"
                ? "Try another search or filter, or clear the current filters."
                : "Create your first property to start managing rooms, beds, tenants and rent."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {(search || propertyType !== "All") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setPropertyType("All");
                  }}
                  className="rounded-lg border border-[#E3E6DE] px-3.5 py-2 text-xs font-medium text-[#40543E] hover:bg-[#F7F6F0]"
                >
                  Clear filters
                </button>
              )}
              <button
                onClick={() => navigate("/onboarding/property")}
                className="rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#295640]"
              >
                Add property
              </button>
            </div>
          </section>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard
                  key={property.propertyId}
                  property={property}
                  bgImage={propertyImages[property.propertyId] ?? null}
                  onClick={() => navigate(`/properties/${property.propertyId}`)}
                />
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-[#E3E6DE] bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] text-[#8C9782]">
                {visibleRange ? `Showing ${visibleRange} of ${totalCount}` : `${totalCount} properties`}
              </p>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(value - 1, 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E3E6DE] px-3 py-1.5 text-xs font-medium text-[#40543E] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <span className="min-w-16 text-center text-[10px] font-medium text-[#7D887D]">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((value) => Math.min(value + 1, totalPages))}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#1D4435] px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PropertyCard({
  property,
  bgImage,
  onClick,
}: {
  property: Property;
  bgImage: string | null;
  onClick: () => void;
}) {
  const occupancy = property.totalBeds > 0
    ? Math.round((property.occupiedBeds / property.totalBeds) * 100)
    : 0;
  const vacantBeds = Math.max(property.totalBeds - property.occupiedBeds, 0);
  const hasImage = Boolean(bgImage);

  return (
    <button
      type="button"
      onClick={onClick}
      style={
        bgImage
          ? {
              backgroundImage: `url("${bgImage}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
      className={`group relative w-full overflow-hidden rounded-xl border p-5 text-left shadow-sm transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#DDE8DE] ${
        hasImage
          ? "border-[#2A3B32] bg-[#16261E] text-white hover:border-[#4D6B5B] hover:shadow-md"
          : "border-[#E3E6DE] bg-white text-[#2C4136] hover:border-[#C7D3C7] hover:shadow"
      }`}
    >
      {hasImage && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/60 to-black/35 transition-opacity duration-200 group-hover:from-black/90 group-hover:via-black/65"
        />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1D4435] text-white">
            <Building2 className="h-4 w-4" />
          </div>
          <span
            className={`rounded-md px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider ${
              hasImage
                ? "bg-white/15 text-white backdrop-blur-sm"
                : "bg-[#F2F4EC] text-[#55755A]"
            }`}
          >
            {property.propertyType}
          </span>
        </div>

        <div className="mt-4">
          <h2
            className={`truncate text-sm font-medium ${
              hasImage ? "text-white group-hover:text-emerald-200" : "text-[#294436] group-hover:text-[#356248]"
            }`}
          >
            {property.propertyName}
          </h2>
          <div className={`mt-1 flex items-start gap-1 text-xs ${hasImage ? "text-white/80" : "text-[#859083]"}`}>
            <MapPin className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${hasImage ? "text-emerald-300" : "text-[#7D887D]"}`} />
            <span className="line-clamp-2">{property.city}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniStat label="Rooms" value={property.totalRooms} hasImage={hasImage} />
          <MiniStat label="Beds" value={property.totalBeds} hasImage={hasImage} />
          <MiniStat label="Vacant" value={vacantBeds} hasImage={hasImage} />
        </div>

        <div className={`mt-4 border-t pt-3 ${hasImage ? "border-white/15" : "border-[#EEF0E9]"}`}>
          <div className="flex items-center justify-between text-[10px]">
            <span className={hasImage ? "text-white/75" : "text-[#889184]"}>Occupancy</span>
            <span className={`font-medium ${hasImage ? "text-white" : "text-[#36503C]"}`}>{occupancy}%</span>
          </div>
          <div className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${hasImage ? "bg-white/20" : "bg-[#E8EAE0]"}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${hasImage ? "bg-emerald-400" : "bg-[#356248]"}`}
              style={{ width: `${occupancy}%` }}
            />
          </div>
        </div>

        <div className={`mt-4 flex items-center justify-between text-[10px] font-medium ${hasImage ? "text-white/85" : "text-[#678471]"}`}>
          <span>Open property</span>
          <span className={`transition-transform group-hover:translate-x-0.5 ${hasImage ? "text-emerald-300" : "text-[#356248]"}`}>
            View details →
          </span>
        </div>
      </div>
    </button>
  );
}

function MiniStat({
  label,
  value,
  hasImage,
}: {
  label: string;
  value: number;
  hasImage: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-2.5 ${
        hasImage
          ? "border-white/15 bg-black/35 text-white backdrop-blur-sm"
          : "border-[#E4E8DE] bg-[#F7F6F0]/60 text-[#263F33]"
      }`}
    >
      <p className={`text-[9px] font-medium uppercase tracking-wider ${hasImage ? "text-white/70" : "text-[#859083]"}`}>
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-medium ${hasImage ? "text-white" : "text-[#263F33]"}`}>{value}</p>
    </div>
  );
}