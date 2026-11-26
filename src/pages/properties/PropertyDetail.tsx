import {
  ArrowLeft,
  BedDouble,
  Building2,
  Camera,
  Check,
  ChevronRight,
  Edit3,
  Eye,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "react-qr-code";

import {
  deleteBed,
  deleteProperty,
  deleteRoom,
  getProperty,
  getPropertyFinance,
  updateBed,
  updateProperty,
  updateRoom,
  type Bed,
  type FinanceSummary,
  type PropertyDetail as PropertyDetailType,
  type Room,
  type RoomType,
} from "../../api/properties.api";

import {
  deletePropertyImage,
  getBedImages,
  getPropertyImages,
  getRoomImages,
  uploadPropertyImage,
  type PropertyImage,
} from "../../api/propertyImages.api";

import api from "../../api/axios";

const PROPERTY_TYPES = ["PG", "Hostel", "Apartment"] as const;
type PropertyType = (typeof PROPERTY_TYPES)[number];

type GalleryScope = "property" | "room" | "bed";

type GalleryTarget = {
  scope: GalleryScope;
  propertyId: string;
  roomId?: string;
  bedId?: string;
  title: string;
  subtitle?: string;
};

type GalleryCache = Record<string, PropertyImage[]>;
type CoverMap = Record<string, string>;

const COVER_STORAGE_KEY = "roomease:gallery-covers";

function readCovers(): CoverMap {
  try {
    const raw = localStorage.getItem(COVER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CoverMap) : {};
  } catch {
    return {};
  }
}

function writeCovers(map: CoverMap) {
  try {
    localStorage.setItem(
      COVER_STORAGE_KEY,
      JSON.stringify(map),
    );
  } catch {
    /* ignore storage errors */
  }
}

function pickCover(
  images: PropertyImage[],
  coverId?: string,
): PropertyImage | undefined {
  if (!images.length) return undefined;
  return (
    images.find(
      (img) => img.propertyImageId === coverId,
    ) ?? images[0]
  );
}

// Room gallery me bed ki photos, property gallery me room/bed ki photos na aaye
function scopeImages(
  scope: GalleryScope,
  images: PropertyImage[] | null | undefined,
): PropertyImage[] {
  return (images ?? []).filter((img) => {
    const a = img as any;
    if (scope === "property") return !a.roomId && !a.bedId;
    if (scope === "room") return !a.bedId;
    return true;
  });
}

function apiError(error: any, fallback: string) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

const money = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

function resolveImageUrl(imageUrl: string) {
  if (!imageUrl) return "";

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }

  try {
    const apiBase =
      api.defaults.baseURL || window.location.origin;

    return new URL(imageUrl, apiBase).toString();
  } catch {
    return imageUrl;
  }
}

function cssUrl(url: string) {
  return `url("${url.replace(/"/g, "%22")}")`;
}

function galleryKey(
  scope: GalleryScope,
  id: string,
) {
  return `${scope}:${id}`;
}

function targetKey(target: GalleryTarget) {
  if (target.scope === "bed" && target.bedId)
    return galleryKey("bed", target.bedId);
  if (target.scope === "room" && target.roomId)
    return galleryKey("room", target.roomId);
  return galleryKey("property", target.propertyId);
}

function formatGalleryDate(value?: string | null) {
  if (!value) return "";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PropertyDetail() {
  const { propertyId } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] =
    useState<PropertyDetailType | null>(null);

  const [finance, setFinance] =
    useState<FinanceSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedRoom, setExpandedRoom] =
    useState<string | null>(null);

  const [propertyModal, setPropertyModal] =
    useState(false);

  const [deleteModal, setDeleteModal] =
    useState(false);

  const [deleteRoomTarget, setDeleteRoomTarget] =
    useState<Room | null>(null);

  const [deleteBedTarget, setDeleteBedTarget] =
    useState<Bed | null>(null);

  const [editingRoom, setEditingRoom] =
    useState<Room | null>(null);

  const [editingBed, setEditingBed] =
    useState<Bed | null>(null);

  const [busyId, setBusyId] =
    useState<string | null>(null);

  const [qrBed, setQrBed] =
    useState<Bed | null>(null);

  const [propertyImages, setPropertyImages] =
    useState<PropertyImage[]>([]);

  const [propertyImagesLoading, setPropertyImagesLoading] =
    useState(false);

  const [roomImages, setRoomImages] =
    useState<GalleryCache>({});

  const [bedImages, setBedImages] =
    useState<GalleryCache>({});

  const [covers, setCovers] = useState<CoverMap>(
    () => readCovers(),
  );

  const [galleryTarget, setGalleryTarget] =
    useState<GalleryTarget | null>(null);

  const [galleryImages, setGalleryImages] =
    useState<PropertyImage[]>([]);

  const [galleryLoading, setGalleryLoading] =
    useState(false);

  const [galleryError, setGalleryError] =
    useState("");

  const setCover = (
    key: string,
    imageId: string,
  ) => {
    setCovers((prev) => {
      const next = { ...prev, [key]: imageId };
      writeCovers(next);
      return next;
    });
  };

  const load = async () => {
    if (!propertyId) return;

    try {
      setLoading(true);
      setError("");

      const [propertyData, financeData] =
        await Promise.all([
          getProperty(propertyId),
          getPropertyFinance(propertyId),
        ]);

      setProperty(propertyData);
      setFinance(financeData);

      try {
        setPropertyImagesLoading(true);
        setPropertyImages(
          scopeImages(
            "property",
            await getPropertyImages(propertyId),
          ),
        );
      } catch (galleryErr) {
        console.error(
          "Property gallery load failed:",
          galleryErr,
        );
        setPropertyImages([]);
      } finally {
        setPropertyImagesLoading(false);
      }

      const roomsList = propertyData?.rooms ?? [];
      const bedsList = roomsList.flatMap(
        (r) => r.beds ?? [],
      );

      void Promise.all(
        roomsList.map(async (r) => {
          try {
            const imgs = scopeImages(
              "room",
              await getRoomImages(r.roomId),
            );
            return [galleryKey("room", r.roomId), imgs] as const;
          } catch {
            return [
              galleryKey("room", r.roomId),
              [] as PropertyImage[],
            ] as const;
          }
        }),
      ).then((entries) => {
        setRoomImages((prev) => {
          const next = { ...prev };
          for (const [k, imgs] of entries) next[k] = imgs;
          return next;
        });
      });

      void Promise.all(
        bedsList.map(async (b) => {
          try {
            const imgs = scopeImages(
              "bed",
              await getBedImages(b.bedId),
            );
            return [galleryKey("bed", b.bedId), imgs] as const;
          } catch {
            return [
              galleryKey("bed", b.bedId),
              [] as PropertyImage[],
            ] as const;
          }
        }),
      ).then((entries) => {
        setBedImages((prev) => {
          const next = { ...prev };
          for (const [k, imgs] of entries) next[k] = imgs;
          return next;
        });
      });
    } catch (err) {
      console.error(err);

      setError(
        apiError(
          err,
          "Unable to load property details.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [propertyId]);

  const stats = useMemo(() => {
    const rooms = property?.rooms ?? [];
    const beds = rooms.flatMap(
      (room) => room.beds,
    );

    const occupied = beds.filter(
      (bed) => bed.status === "Occupied",
    ).length;

    const cleaning = beds.filter(
      (bed) => bed.status === "NeedsCleaning",
    ).length;

    const vacant = beds.filter(
      (bed) => bed.status === "Vacant",
    ).length;

    return {
      rooms: rooms.length,
      beds: beds.length,
      occupied,
      cleaning,
      vacant,
      occupancy: beds.length
        ? Math.round((occupied / beds.length) * 100)
        : 0,
    };
  }, [property]);

  const openGallery = async (
    target: GalleryTarget,
  ) => {
    setGalleryTarget(target);
    setGalleryError("");
    setGalleryImages([]);
    setGalleryLoading(true);

    try {
      let images: PropertyImage[] = [];

      if (target.scope === "property") {
        images = scopeImages(
          "property",
          await getPropertyImages(
            target.propertyId,
          ),
        );
        setPropertyImages(images);
      } else if (
        target.scope === "room" &&
        target.roomId
      ) {
        images = scopeImages(
          "room",
          await getRoomImages(target.roomId),
        );

        setRoomImages((prev) => ({
          ...prev,
          [galleryKey(
            "room",
            target.roomId!,
          )]: images,
        }));
      } else if (
        target.scope === "bed" &&
        target.bedId
      ) {
        images = scopeImages(
          "bed",
          await getBedImages(target.bedId),
        );

        setBedImages((prev) => ({
          ...prev,
          [galleryKey(
            "bed",
            target.bedId!,
          )]: images,
        }));
      }

      setGalleryImages(images);
    } catch (err) {
      console.error(err);

      setGalleryError(
        apiError(
          err,
          "Unable to load images.",
        ),
      );
    } finally {
      setGalleryLoading(false);
    }
  };

  const refreshCurrentGallery = async () => {
    if (!galleryTarget) return;
    await openGallery(galleryTarget);
  };

  const handleDeleteProperty = async () => {
    if (!propertyId) return;

    try {
      setBusyId(propertyId);
      await deleteProperty(propertyId);

      navigate("/properties", {
        replace: true,
      });
    } catch (err) {
      setError(
        apiError(
          err,
          "This property could not be deleted.",
        ),
      );
      setDeleteModal(false);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteRoom = async (
    room: Room,
  ) => {
    try {
      setBusyId(room.roomId);
      await deleteRoom(room.roomId);
      if (expandedRoom === room.roomId) {
        setExpandedRoom(null);
      }
      await load();
    } catch (err) {
      setError(
        apiError(
          err,
          "Room could not be deleted.",
        ),
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteBed = async (
    bed: Bed,
  ) => {
    try {
      setBusyId(bed.bedId);
      await deleteBed(bed.bedId);
      await load();
    } catch (err) {
      setError(
        apiError(
          err,
          "Bed could not be deleted.",
        ),
      );
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F0] p-6">
        <div className="mx-auto max-w-7xl animate-pulse space-y-5">
          <div className="h-5 w-28 rounded bg-[#E3E6DE]" />
          <div className="h-40 rounded-xl bg-white" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({
              length: 5,
            }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-white"
              />
            ))}
          </div>
          <div className="h-72 rounded-xl bg-white" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[#F7F6F0] px-5 py-16 text-center">
        <Building2 className="mx-auto h-10 w-10 text-[#7D887D]" />

        <h1 className="mt-4 text-base font-medium text-[#294436]">
          Property not found
        </h1>

        <p className="mt-1 text-xs text-[#859083]">
          The property may have been removed or you may not have access to it.
        </p>

        <button
          onClick={() =>
            navigate("/properties")
          }
          className="mt-5 rounded-lg bg-[#1D4435] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#295640]"
        >
          Back to properties
        </button>
      </div>
    );
  }

  const expandedRoomData =
    property.rooms.find(
      (r) => r.roomId === expandedRoom,
    ) ?? null;

  const openRoomGallery = (room: Room) =>
    void openGallery({
      scope: "room",
      propertyId: property.propertyId,
      roomId: room.roomId,
      title: `Room ${room.roomNumber}`,
      subtitle: "Room gallery",
    });

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Top navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() =>
              navigate("/properties")
            }
            className="inline-flex items-center gap-2 text-xs font-medium text-[#55755A] hover:text-[#1D4435]"
          >
            <ArrowLeft className="h-4 w-4" />
            Properties
          </button>

          <button
            onClick={load}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#E3E6DE] bg-white px-3 text-xs font-medium text-[#40543E] shadow-sm hover:bg-[#F2F4EC]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-4 flex flex-col gap-2 rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-[#8A624D]">
                Action failed
              </p>
              <p className="mt-1 text-[11px] text-[#A17255]">
                {error}
              </p>
            </div>

            <button
              onClick={() => setError("")}
              className="self-start rounded-lg p-1 text-[#A17255] hover:bg-white sm:self-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Property header */}
        <section className="mt-5 rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#1D4435] text-white">
                <Building2 className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-medium tracking-tight text-[#294436]">
                    {property.propertyName}
                  </h1>

                  <span className="rounded-md bg-[#F2F4EC] px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider text-[#55755A]">
                    {property.propertyType}
                  </span>
                </div>

                <div className="mt-1.5 flex items-start gap-1.5 text-xs text-[#859083]">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7D887D]" />
                  <span>
                    {property.address}, {property.city}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setPropertyModal(true)
                }
                className="inline-flex items-center gap-2 rounded-lg border border-[#E3E6DE] bg-white px-3.5 py-2 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC]"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>

              <button
                onClick={() =>
                  setDeleteModal(true)
                }
                className="inline-flex items-center gap-2 rounded-lg border border-[#E7D4C7] bg-white px-3.5 py-2 text-xs font-medium text-[#A2634B] hover:bg-[#FBF0E9]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        </section>

        {/* Property Gallery */}
        <PropertyGallerySection
          propertyImages={propertyImages}
          loading={propertyImagesLoading}
          propertyName={property.propertyName}
          onOpenGallery={() =>
            void openGallery({
              scope: "property",
              propertyId: property.propertyId,
              title: property.propertyName,
              subtitle: "Property gallery",
            })
          }
        />

        {/* Stats */}
        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard
            label="Rooms"
            value={stats.rooms.toString()}
            icon={
              <Building2 className="h-4 w-4" />
            }
          />

          <MetricCard
            label="Total beds"
            value={stats.beds.toString()}
            icon={
              <BedDouble className="h-4 w-4" />
            }
          />

          <MetricCard
            label="Occupied"
            value={stats.occupied.toString()}
            icon={
              <Users className="h-4 w-4" />
            }
          />

          <MetricCard
            label="Vacant"
            value={stats.vacant.toString()}
            icon={
              <BedDouble className="h-4 w-4" />
            }
          />

          <MetricCard
            label="Cleaning"
            value={stats.cleaning.toString()}
            icon={
              <RefreshCw className="h-4 w-4" />
            }
          />

          <MetricCard
            label="Occupancy"
            value={`${stats.occupancy}%`}
            icon={
              <Check className="h-4 w-4" />
            }
          />
        </section>

        {/* Finance */}
        {finance && (
          <section className="mt-4 grid gap-4 sm:grid-cols-3">
            <FinanceCard
              label="Expected this month"
              value={money(
                finance.expectedThisMonth,
              )}
            />

            <FinanceCard
              label="Collected this month"
              value={money(
                finance.collectedThisMonth,
              )}
              helper={
                finance.expectedThisMonth
                  ? `${Math.round(
                      (finance.collectedThisMonth /
                        finance.expectedThisMonth) *
                        100,
                    )}% collected`
                  : "No expected rent"
              }
            />

            <FinanceCard
              label="Outstanding"
              value={money(
                finance.totalOutstanding,
              )}
              danger={
                finance.totalOutstanding > 0
              }
            />
          </section>
        )}

        {/* Rooms heading */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
              Space management
            </p>

            <h2 className="mt-1 text-lg font-medium text-[#294436]">
              Rooms & beds
            </h2>

            <p className="mt-0.5 text-xs text-[#859083]">
              Manage room setup, rent, current occupancy and guest QR codes.
            </p>
          </div>

          <button
            onClick={() =>
              navigate(
                `/properties/${propertyId}/add-room`,
              )
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1D4435] px-4 text-xs font-medium text-white hover:bg-[#295640]"
          >
            <Plus className="h-4 w-4" />
            Add room
          </button>
        </div>

        {/* Status legend */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-medium text-[#7D887D]">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#D5E2D5] bg-[#E8EFE8] px-2.5 py-1 text-[#356248]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#55755A]" />
            Vacant — ready for check-in
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#E7D4C7] bg-[#FBF0E9] px-2.5 py-1 text-[#8A624D]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A2634B]" />
            Occupied — tenant assigned
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#F7EEDC] bg-[#F7EEDC] px-2.5 py-1 text-[#9B712F]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C5AB73]" />
            Needs cleaning
          </span>

          <span className="ml-auto text-[#8C9782]">
            Each bed can have its own permanent Guest QR.
          </span>
        </div>

        {/* Rooms */}
        <section className="mt-4">
          {property.rooms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E3E6DE] bg-white px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F2F4EC] text-[#55755A]">
                <BedDouble className="h-6 w-6" />
              </div>

              <h3 className="mt-3 text-sm font-medium text-[#294436]">
                No rooms yet
              </h3>

              <p className="mt-1 text-xs text-[#859083]">
                Add your first room and its beds to start checking tenants in.
              </p>

              <button
                onClick={() =>
                  navigate(
                    `/properties/${propertyId}/add-room`,
                  )
                }
                className="mt-4 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#295640]"
              >
                Add first room
              </button>
            </div>
          ) : expandedRoomData ? (
            <RoomDetailView
              room={expandedRoomData}
              allRooms={property.rooms}
              busyId={busyId}
              roomImages={
                roomImages[
                  galleryKey(
                    "room",
                    expandedRoomData.roomId,
                  )
                ] ?? []
              }
              roomCoverId={
                covers[
                  galleryKey(
                    "room",
                    expandedRoomData.roomId,
                  )
                ]
              }
              bedImages={bedImages}
              covers={covers}
              onBack={() =>
                setExpandedRoom(null)
              }
              onSelectRoom={(roomId) =>
                setExpandedRoom(roomId)
              }
              onEditRoom={() =>
                setEditingRoom(expandedRoomData)
              }
              onDeleteRoom={() =>
                setDeleteRoomTarget(
                  expandedRoomData,
                )
              }
              onOpenRoomGallery={() =>
                openRoomGallery(expandedRoomData)
              }
              onCheckIn={(bedId) =>
                navigate(
                  `/properties/${property.propertyId}/checkin/${bedId}`,
                )
              }
              onTenant={(tenantId) =>
                navigate(
                  `/tenants/${tenantId}`,
                )
              }
              onOperations={() =>
                navigate("/operations")
              }
              onEditBed={(bed) =>
                setEditingBed(bed)
              }
              onDeleteBed={(bed) =>
                setDeleteBedTarget(bed)
              }
              onShowQr={(bed) =>
                setQrBed(bed)
              }
              onOpenBedGallery={(bed) =>
                void openGallery({
                  scope: "bed",
                  propertyId:
                    property.propertyId,
                  roomId:
                    expandedRoomData.roomId,
                  bedId: bed.bedId,
                  title: `Bed ${bed.bedNumber}`,
                  subtitle: `Room ${expandedRoomData.roomNumber} • Bed gallery`,
                })
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {property.rooms.map((room) => (
                <RoomTile
                  key={room.roomId}
                  room={room}
                  busyId={busyId}
                  roomImages={
                    roomImages[
                      galleryKey(
                        "room",
                        room.roomId,
                      )
                    ] ?? []
                  }
                  coverId={
                    covers[
                      galleryKey(
                        "room",
                        room.roomId,
                      )
                    ]
                  }
                  onOpen={() =>
                    setExpandedRoom(room.roomId)
                  }
                  onEditRoom={() =>
                    setEditingRoom(room)
                  }
                  onDeleteRoom={() =>
                    setDeleteRoomTarget(room)
                  }
                  onOpenRoomGallery={() =>
                    openRoomGallery(room)
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {propertyModal && (
        <PropertyEditModal
          property={property}
          onClose={() =>
            setPropertyModal(false)
          }
          onSaved={async () => {
            setPropertyModal(false);
            await load();
          }}
          setError={setError}
        />
      )}

      {editingRoom && (
        <RoomEditModal
          room={editingRoom}
          onClose={() =>
            setEditingRoom(null)
          }
          onSaved={async () => {
            setEditingRoom(null);
            await load();
          }}
          setError={setError}
        />
      )}

      {editingBed && (
        <BedEditModal
          bed={editingBed}
          onClose={() =>
            setEditingBed(null)
          }
          onSaved={async () => {
            setEditingBed(null);
            await load();
          }}
          setError={setError}
        />
      )}

      {deleteRoomTarget && (
        <ConfirmModal
          title={`Delete room ${deleteRoomTarget.roomNumber}?`}
          description="A room that has ever had tenant history cannot be deleted. If the backend blocks this action, your records remain safe."
          confirmLabel="Delete room"
          danger
          busy={
            busyId === deleteRoomTarget.roomId
          }
          onClose={() =>
            setDeleteRoomTarget(null)
          }
          onConfirm={async () => {
            await handleDeleteRoom(
              deleteRoomTarget,
            );
            setDeleteRoomTarget(null);
          }}
        />
      )}

      {deleteBedTarget && (
        <ConfirmModal
          title={`Delete bed ${deleteBedTarget.bedNumber}?`}
          description="Only a vacant bed with no tenant history can be deleted. This action cannot be undone."
          confirmLabel="Delete bed"
          danger
          busy={
            busyId === deleteBedTarget.bedId
          }
          onClose={() =>
            setDeleteBedTarget(null)
          }
          onConfirm={async () => {
            await handleDeleteBed(
              deleteBedTarget,
            );
            setDeleteBedTarget(null);
          }}
        />
      )}

      {deleteModal && (
        <ConfirmModal
          title="Delete property?"
          description="This cannot be undone. If this property has any tenant history, the backend will block deletion to protect your records."
          confirmLabel="Delete property"
          danger
          busy={busyId === propertyId}
          onClose={() =>
            setDeleteModal(false)
          }
          onConfirm={
            handleDeleteProperty
          }
        />
      )}

      {qrBed && (
        <GuestQrModal
          bed={qrBed}
          propertyName={
            property.propertyName
          }
          onClose={() =>
            setQrBed(null)
          }
        />
      )}

      {galleryTarget && (
        <ImageGalleryModal
          target={galleryTarget}
          images={galleryImages}
          loading={galleryLoading}
          error={galleryError}
          coverId={covers[targetKey(galleryTarget)]}
          showCoverControl={
            galleryTarget.scope !== "property"
          }
          onSetCover={(imageId) =>
            setCover(
              targetKey(galleryTarget),
              imageId,
            )
          }
          onClose={() =>
            setGalleryTarget(null)
          }
          onRefresh={refreshCurrentGallery}
          onDeleted={async () => {
            await refreshCurrentGallery();
          }}
          setError={setGalleryError}
        />
      )}
    </div>
  );
}

function PropertyGallerySection({
  propertyImages,
  loading,
  propertyName,
  onOpenGallery,
}: {
  propertyImages: PropertyImage[];
  loading: boolean;
  propertyName: string;
  onOpenGallery: () => void;
}) {
  return (
    <section className="mt-5 overflow-hidden rounded-xl border border-[#E3E6DE] bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#EEF0E9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-[#55755A]" />

            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
              Property gallery
            </p>
          </div>

          <h2 className="mt-1 text-sm font-medium text-[#294436]">
            Photos of {propertyName}
          </h2>

          <p className="mt-0.5 text-xs text-[#859083]">
            Add exterior, reception, common area, kitchen and other property-level photos.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenGallery}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#295640]"
        >
          <Upload className="h-3.5 w-3.5" />
          Manage gallery
        </button>
      </div>

      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({
              length: 4,
            }).map((_, index) => (
              <div
                key={index}
                className="aspect-[4/3] animate-pulse rounded-lg bg-[#E3E6DE]"
              />
            ))}
          </div>
        ) : propertyImages.length === 0 ? (
          <button
            type="button"
            onClick={onOpenGallery}
            className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#DFE4DA] bg-[#F7F6F0]/50 px-5 py-8 text-center transition hover:border-[#92AA92] hover:bg-[#E8EFE8]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#7D887D] shadow-sm">
              <ImageIcon className="h-4 w-4" />
            </div>

            <p className="mt-3 text-xs font-medium text-[#294436]">
              No property photos yet
            </p>

            <p className="mt-0.5 text-[10px] text-[#859083]">
              Upload the first gallery image.
            </p>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {propertyImages
              .slice(0, 4)
              .map((image) => (
                <button
                  type="button"
                  key={image.propertyImageId}
                  onClick={onOpenGallery}
                  className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-[#E3E6DE] bg-white"
                >
                  <img
                    src={resolveImageUrl(
                      image.imageUrl,
                    )}
                    alt={
                      image.caption ||
                      "Property photo"
                    }
                    className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                    loading="lazy"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

                  {image.caption && (
                    <div className="absolute inset-x-2 bottom-2 translate-y-2 truncate rounded-md bg-slate-950/75 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                      {image.caption}
                    </div>
                  )}
                </button>
              ))}

            {propertyImages.length > 4 && (
              <button
                type="button"
                onClick={onOpenGallery}
                className="flex aspect-[4/3] items-center justify-center rounded-lg border border-[#E3E6DE] bg-[#F7F6F0] text-xs font-medium text-[#40543E] hover:bg-[#E8EFE8]"
              >
                +{propertyImages.length - 4} more
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function RoomTile({
  room,
  busyId,
  roomImages,
  coverId,
  onOpen,
  onEditRoom,
  onDeleteRoom,
  onOpenRoomGallery,
}: {
  room: Room;
  busyId: string | null;
  roomImages: PropertyImage[];
  coverId?: string;
  onOpen: () => void;
  onEditRoom: () => void;
  onDeleteRoom: () => void;
  onOpenRoomGallery: () => void;
}) {
  const occupied = room.beds.filter(
    (bed) => bed.status === "Occupied",
  ).length;

  const cleaning = room.beds.filter(
    (bed) => bed.status === "NeedsCleaning",
  ).length;

  const cover = pickCover(roomImages, coverId);
  const bgUrl = cover?.imageUrl
    ? resolveImageUrl(cover.imageUrl)
    : null;
  const hasImage = Boolean(bgUrl);

  const iconBtn = hasImage
    ? "bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
    : "bg-[#F2F4EC] text-[#7D887D] hover:bg-[#E3E6DE] hover:text-[#294436]";

  return (
    <article
      style={
        bgUrl
          ? {
              backgroundImage: cssUrl(bgUrl),
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
      className={`group relative aspect-[4/3] overflow-hidden rounded-xl border border-[#E3E6DE] shadow-sm transition hover:shadow-md ${
        hasImage
          ? "bg-[#16261E] text-white"
          : "bg-white text-[#294436]"
      }`}
    >
      {hasImage && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30"
        />
      )}

      {/* Whole tile click = open this room */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open room ${room.roomNumber}`}
        className="absolute inset-0 z-0"
      />

      {/* Top actions */}
      <div className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenRoomGallery}
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition ${iconBtn}`}
          title="Room photos"
        >
          <Camera className="h-3 w-3" />
          Photos
        </button>

        <button
          type="button"
          onClick={onEditRoom}
          className={`rounded-lg p-1.5 transition ${iconBtn}`}
          title="Edit room"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onDeleteRoom}
          disabled={busyId === room.roomId}
          className={`rounded-lg p-1.5 transition disabled:opacity-40 ${iconBtn}`}
          title="Delete room"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {!hasImage && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[#C9D3C6]">
          <BedDouble className="h-12 w-12" />
        </div>
      )}

      {/* Bottom info */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-2 p-3.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-medium">
              Room {room.roomNumber}
            </h3>

            <span
              className={`rounded-md px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider ${
                hasImage
                  ? "bg-white/20 text-white backdrop-blur-sm"
                  : "bg-[#F2F4EC] text-[#55755A]"
              }`}
            >
              {room.roomType}
            </span>
          </div>

          <div
            className={`mt-1 flex flex-wrap gap-2 text-[11px] ${
              hasImage
                ? "text-white/85"
                : "text-[#859083]"
            }`}
          >
            <span>
              {occupied}/{room.beds.length} occupied
            </span>

            {cleaning > 0 && (
              <span
                className={`font-medium ${
                  hasImage
                    ? "text-amber-300"
                    : "text-[#9B712F]"
                }`}
              >
                • {cleaning} cleaning
              </span>
            )}
          </div>
        </div>

        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            hasImage
              ? "bg-white/20 text-white backdrop-blur-sm"
              : "bg-[#F7F6F0] text-[#7D887D]"
          }`}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </article>
  );
}

function RoomDetailView({
  room,
  allRooms,
  busyId,
  roomImages,
  roomCoverId,
  bedImages,
  covers,
  onBack,
  onSelectRoom,
  onEditRoom,
  onDeleteRoom,
  onOpenRoomGallery,
  onCheckIn,
  onTenant,
  onOperations,
  onEditBed,
  onDeleteBed,
  onShowQr,
  onOpenBedGallery,
}: {
  room: Room;
  allRooms: Room[];
  busyId: string | null;
  roomImages: PropertyImage[];
  roomCoverId?: string;
  bedImages: GalleryCache;
  covers: CoverMap;
  onBack: () => void;
  onSelectRoom: (roomId: string) => void;
  onEditRoom: () => void;
  onDeleteRoom: () => void;
  onOpenRoomGallery: () => void;
  onCheckIn: (id: string) => void;
  onTenant: (id: string) => void;
  onOperations: () => void;
  onEditBed: (bed: Bed) => void;
  onDeleteBed: (bed: Bed) => void;
  onShowQr: (bed: Bed) => void;
  onOpenBedGallery: (bed: Bed) => void;
}) {
  const occupied = room.beds.filter(
    (bed) => bed.status === "Occupied",
  ).length;

  const cleaning = room.beds.filter(
    (bed) => bed.status === "NeedsCleaning",
  ).length;

  const cover = pickCover(roomImages, roomCoverId);
  const bgUrl = cover?.imageUrl
    ? resolveImageUrl(cover.imageUrl)
    : null;
  const hasImage = Boolean(bgUrl);

  const heroBtn = hasImage
    ? "border-white/20 bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
    : "border-[#E3E6DE] bg-white text-[#40543E] hover:bg-[#F2F4EC]";

  return (
    <div>
      {/* Back + room switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-[#E3E6DE] bg-white px-3 py-2 text-xs font-medium text-[#40543E] shadow-sm hover:bg-[#F2F4EC]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All rooms
        </button>

        <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1">
          {allRooms.map((r) => (
            <button
              key={r.roomId}
              type="button"
              onClick={() =>
                onSelectRoom(r.roomId)
              }
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                r.roomId === room.roomId
                  ? "border-[#1D4435] bg-[#1D4435] text-white"
                  : "border-[#E3E6DE] bg-white text-[#40543E] hover:bg-[#F2F4EC]"
              }`}
            >
              Room {r.roomNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Room hero */}
      <div
        style={
          bgUrl
            ? {
                backgroundImage: cssUrl(bgUrl),
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
        className={`relative mt-4 flex min-h-[160px] flex-col justify-end overflow-hidden rounded-xl border border-[#E3E6DE] p-4 shadow-sm sm:min-h-[200px] sm:p-5 ${
          hasImage
            ? "bg-[#16261E] text-white"
            : "bg-white text-[#294436]"
        }`}
      >
        {hasImage && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25"
          />
        )}

        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-medium">
                Room {room.roomNumber}
              </h3>

              <span
                className={`rounded-md px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${
                  hasImage
                    ? "bg-white/20 text-white backdrop-blur-sm"
                    : "bg-[#F2F4EC] text-[#55755A]"
                }`}
              >
                {room.roomType}
              </span>
            </div>

            <div
              className={`mt-1 flex flex-wrap gap-2 text-xs ${
                hasImage
                  ? "text-white/85"
                  : "text-[#859083]"
              }`}
            >
              <span>
                {occupied}/{room.beds.length} occupied
              </span>

              {cleaning > 0 && (
                <span
                  className={`font-medium ${
                    hasImage
                      ? "text-amber-300"
                      : "text-[#9B712F]"
                  }`}
                >
                  • {cleaning} cleaning
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenRoomGallery}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${heroBtn}`}
            >
              <Camera className="h-3.5 w-3.5" />
              Photos
            </button>

            <button
              type="button"
              onClick={onEditRoom}
              className={`rounded-lg border p-2 transition ${heroBtn}`}
              title="Edit room"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onDeleteRoom}
              disabled={busyId === room.roomId}
              className={`rounded-lg border p-2 transition disabled:opacity-40 ${heroBtn}`}
              title="Delete room"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Beds of this room only */}
      <div className="mt-4 rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm sm:p-5">
        <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
          Beds in room {room.roomNumber}
        </p>

        {room.beds.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-[#DFE4DA] bg-[#F7F6F0]/50 px-4 py-8 text-center text-xs text-[#859083]">
            This room has no beds yet.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {room.beds.map((bed) => {
              const key = galleryKey(
                "bed",
                bed.bedId,
              );

              return (
                <BedCard
                  key={bed.bedId}
                  bed={bed}
                  busyId={busyId}
                  bedImages={bedImages[key] ?? []}
                  coverId={covers[key]}
                  onCheckIn={onCheckIn}
                  onTenant={onTenant}
                  onOperations={onOperations}
                  onEdit={onEditBed}
                  onDelete={onDeleteBed}
                  onShowQr={onShowQr}
                  onOpenGallery={() =>
                    onOpenBedGallery(bed)
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BedCard({
  bed,
  busyId,
  bedImages,
  coverId,
  onCheckIn,
  onTenant,
  onOperations,
  onEdit,
  onDelete,
  onShowQr,
  onOpenGallery,
}: {
  bed: Bed;
  busyId: string | null;
  bedImages: PropertyImage[];
  coverId?: string;
  onCheckIn: (id: string) => void;
  onTenant: (id: string) => void;
  onOperations: () => void;
  onEdit: (bed: Bed) => void;
  onDelete: (bed: Bed) => void;
  onShowQr: (bed: Bed) => void;
  onOpenGallery: () => void;
}) {
  const isOccupied = bed.status === "Occupied";
  const isCleaning = bed.status === "NeedsCleaning";

  const cover = pickCover(bedImages, coverId);
  const bedBgUrl = cover?.imageUrl
    ? resolveImageUrl(cover.imageUrl)
    : null;
  const hasBedImage = Boolean(bedBgUrl);

  const getStatusText = () => {
    if (isOccupied) return "Occupied";
    if (isCleaning) return "Needs cleaning";
    return "Vacant";
  };

  const getStatusClass = () => {
    if (hasBedImage) {
      if (isOccupied) return "text-amber-200";
      if (isCleaning) return "text-yellow-300";
      return "text-emerald-300";
    }
    if (isOccupied) return "text-[#A2634B]";
    if (isCleaning) return "text-[#9B712F]";
    return "text-[#356248]";
  };

  const getCardBorder = () => {
    if (hasBedImage) return "border-[#2A3B32]";
    if (isOccupied) return "border-[#E7D4C7]";
    if (isCleaning) return "border-[#F7EEDC]";
    return "border-[#D5E2D5]";
  };

  const photoBtnClass = `mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
    hasBedImage
      ? "border-white/20 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
      : isOccupied || !isCleaning
        ? "border-[#D5E2D5] bg-[#E8EFE8] text-[#356248] hover:bg-[#D5E2D5]"
        : "border-[#E3E6DE] bg-white text-[#40543E] hover:bg-[#F2F4EC]"
  }`;

  const qrBtnClass = `mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
    hasBedImage
      ? "border-white/20 bg-black/35 text-white backdrop-blur-sm hover:bg-black/50"
      : "border-[#E3E6DE] bg-white text-[#40543E] hover:bg-[#F2F4EC]"
  }`;

  return (
    <div
      style={
        bedBgUrl
          ? {
              backgroundImage: cssUrl(bedBgUrl),
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
      className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md ${getCardBorder()} ${
        hasBedImage ? "bg-[#16261E] text-white" : "bg-white"
      }`}
    >
      {hasBedImage && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/60 to-black/40"
        />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className={`text-[9px] font-medium uppercase tracking-wider ${getStatusClass()}`}
            >
              {getStatusText()}
            </p>

            <h4
              className={`mt-0.5 text-sm font-medium sm:text-xs ${
                hasBedImage ? "text-white" : "text-[#294436]"
              }`}
            >
              Bed {bed.bedNumber}
            </h4>
          </div>

          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={() => onEdit(bed)}
              className={`rounded-lg p-1.5 transition ${
                hasBedImage
                  ? "text-white/85 hover:bg-white/15 hover:text-white"
                  : "text-[#7D887D] hover:bg-[#F2F4EC] hover:text-[#294436]"
              }`}
              title="Edit bed"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              disabled={
                busyId === bed.bedId ||
                isOccupied ||
                isCleaning
              }
              onClick={() => onDelete(bed)}
              className={`rounded-lg p-1.5 transition disabled:cursor-not-allowed disabled:opacity-30 ${
                hasBedImage
                  ? "text-white/85 hover:bg-rose-500/25 hover:text-rose-200"
                  : "text-[#7D887D] hover:bg-[#FBF0E9] hover:text-[#A2634B]"
              }`}
              title={
                isOccupied
                  ? "Occupied beds cannot be deleted"
                  : isCleaning
                    ? "Beds under cleaning cannot be deleted"
                    : "Delete bed"
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {isOccupied && bed.tenant ? (
          <>
            <button
              type="button"
              onClick={() => onTenant(bed.tenant!.tenantId)}
              className={`mt-3.5 w-full rounded-lg p-3 text-left transition ${
                hasBedImage
                  ? "border border-white/15 bg-black/40 backdrop-blur-sm hover:bg-black/55"
                  : "bg-[#FBF0E9]/70 hover:bg-[#FBF0E9]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-medium shadow-sm ${
                    hasBedImage
                      ? "bg-white/20 text-white"
                      : "bg-white text-[#294436]"
                  }`}
                >
                  {bed.tenant.fullName
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p
                    className={`truncate text-xs font-medium ${
                      hasBedImage ? "text-white" : "text-[#294436]"
                    }`}
                  >
                    {bed.tenant.fullName}
                  </p>

                  <p
                    className={`truncate text-[10px] ${
                      hasBedImage ? "text-white/75" : "text-[#859083]"
                    }`}
                  >
                    {bed.tenant.mobileNumber}
                  </p>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[10px]">
                <span
                  className={
                    hasBedImage ? "text-white/75" : "text-[#859083]"
                  }
                >
                  Balance due
                </span>

                <span
                  className={`font-medium ${
                    hasBedImage ? "text-white" : "text-[#294436]"
                  }`}
                >
                  {money(bed.tenant.balanceDue)}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenGallery}
              className={photoBtnClass}
            >
              <Camera className="h-3.5 w-3.5" />
              Bed photos
            </button>

            {bed.guestAccessToken && (
              <button
                type="button"
                onClick={() => onShowQr(bed)}
                className={qrBtnClass}
              >
                <QrCode className="h-3.5 w-3.5" />
                Show Guest QR
              </button>
            )}
          </>
        ) : (
          <>
            <p
              className={`mt-3.5 text-xs font-medium ${
                hasBedImage
                  ? isCleaning
                    ? "text-yellow-300"
                    : "text-emerald-300"
                  : isCleaning
                    ? "text-[#9B712F]"
                    : "text-[#356248]"
              }`}
            >
              {isCleaning ? "Cleaning required" : "Available"}
            </p>

            <p
              className={`mt-0.5 text-[10px] ${
                hasBedImage ? "text-white/80" : "text-[#859083]"
              }`}
            >
              {money(bed.monthlyRent)} / month
            </p>

            {isCleaning ? (
              <button
                type="button"
                onClick={onOperations}
                className={`mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  hasBedImage
                    ? "border-amber-300/30 bg-amber-400/20 text-amber-100 backdrop-blur-sm hover:bg-amber-400/30"
                    : "border-[#F7EEDC] bg-[#F7EEDC] text-[#9B712F] hover:bg-[#F0E5D0]"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                View Cleaning Task →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onCheckIn(bed.bedId)}
                className={`mt-3.5 w-full rounded-lg px-3 py-2 text-xs font-medium transition ${
                  hasBedImage
                    ? "bg-emerald-500/85 text-white hover:bg-emerald-500"
                    : "bg-[#E8EFE8] text-[#356248] hover:bg-[#D5E2D5]"
                }`}
              >
                Check-in tenant →
              </button>
            )}

            <button
              type="button"
              onClick={onOpenGallery}
              className={photoBtnClass}
            >
              <Camera className="h-3.5 w-3.5" />
              Bed photos
            </button>

            {bed.guestAccessToken && (
              <button
                type="button"
                onClick={() => onShowQr(bed)}
                className={qrBtnClass}
              >
                <QrCode className="h-3.5 w-3.5" />
                Show Guest QR
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ImageGalleryModal({
  target,
  images,
  loading,
  error,
  coverId,
  showCoverControl,
  onSetCover,
  onClose,
  onRefresh,
  onDeleted,
  setError,
}: {
  target: GalleryTarget;
  images: PropertyImage[];
  loading: boolean;
  error: string;
  coverId?: string;
  showCoverControl: boolean;
  onSetCover: (imageId: string) => void;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onDeleted: () => Promise<void>;
  setError: (value: string) => void;
}) {
  const [selectedImage, setSelectedImage] =
    useState<PropertyImage | null>(
      null,
    );

  const [uploading, setUploading] =
    useState(false);

  const [caption, setCaption] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [localMessage, setLocalMessage] =
    useState("");

  const effectiveCoverId = pickCover(
    images,
    coverId,
  )?.propertyImageId;

  const upload = async () => {
    setError("");
    setLocalMessage("");

    if (!selectedFile) {
      setError(
        "Please select an image.",
      );
      return;
    }

    const extension =
      selectedFile.name
        .split(".")
        .pop()
        ?.toLowerCase() || "";

    const allowed = [
      "jpg",
      "jpeg",
      "png",
      "webp",
    ];

    if (!allowed.includes(extension)) {
      setError(
        "Only JPG, PNG and WEBP images are allowed.",
      );
      return;
    }

    if (
      selectedFile.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Image size must be 5 MB or less.",
      );
      return;
    }

    try {
      setUploading(true);

      await uploadPropertyImage({
        propertyId:
          target.propertyId,
        // Bed photo me roomId nahi bhejte, taaki wo room gallery me na aaye
        roomId:
          target.scope === "bed"
            ? undefined
            : target.roomId,
        bedId:
          target.scope === "bed"
            ? target.bedId
            : undefined,
        caption:
          caption.trim() || undefined,
        file: selectedFile,
      });

      setSelectedFile(null);
      setCaption("");

      const input =
        document.getElementById(
          "property-gallery-file",
        ) as HTMLInputElement | null;

      if (input) input.value = "";

      setLocalMessage(
        "Image uploaded successfully.",
      );

      await onRefresh();
    } catch (err) {
      setError(
        apiError(
          err,
          "Unable to upload image.",
        ),
      );
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (
    image: PropertyImage,
  ) => {
    const confirmed =
      window.confirm(
        "Delete this image? This action cannot be undone.",
      );

    if (!confirmed) return;

    try {
      setDeletingId(
        image.propertyImageId,
      );
      setError("");
      setLocalMessage("");

      await deletePropertyImage(
        image.propertyImageId,
      );

      if (
        selectedImage?.propertyImageId ===
        image.propertyImageId
      ) {
        setSelectedImage(null);
      }

      setLocalMessage(
        "Image deleted successfully.",
      );

      await onDeleted();
    } catch (err) {
      setError(
        apiError(
          err,
          "Unable to delete image.",
        ),
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#EEF0E9] px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8EFE8] text-[#356248]">
                <Camera className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-sm font-medium text-[#294436]">
                  {target.title}
                </h2>

                <p className="text-[10px] text-[#859083]">
                  {target.subtitle ||
                    "Manage photos"}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#7D887D] hover:bg-[#F2F4EC] hover:text-[#294436]"
            aria-label="Close gallery"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Upload */}
          <div className="border-b border-[#EEF0E9] bg-[#F7F6F0]/60 p-5 sm:p-6">
            <div className="flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5 text-[#55755A]" />

              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
                Add photo
              </p>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_280px_auto]">
              <input
                id="property-gallery-file"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setSelectedFile(
                    event.target.files?.[0] ||
                      null,
                  )
                }
                className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 py-2 text-xs font-medium text-[#36503E]"
              />

              <input
                value={caption}
                onChange={(event) =>
                  setCaption(
                    event.target.value.slice(
                      0,
                      150,
                    ),
                  )
                }
                placeholder="Caption (optional)"
                className="h-10 rounded-lg border border-[#DFE4DA] bg-white px-3.5 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:ring-4 focus:ring-[#E3EADF]"
              />

              <button
                type="button"
                onClick={() => void upload()}
                disabled={
                  uploading ||
                  !selectedFile
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1D4435] px-4 text-xs font-medium text-white shadow-sm transition hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}

                {uploading
                  ? "Uploading..."
                  : "Upload"}
              </button>
            </div>

            <p className="mt-2 text-[10px] text-[#8C9782]">
              JPG, PNG or WEBP • Maximum 5 MB
            </p>

            {error && (
              <div className="mt-3 rounded-lg border border-[#E7D4C7] bg-[#FBF0E9] px-3 py-2.5 text-xs text-[#8A624D]">
                {error}
              </div>
            )}

            {localMessage && (
              <div className="mt-3 rounded-lg border border-[#D5E2D5] bg-[#E8EFE8] px-3 py-2.5 text-xs text-[#356248]">
                {localMessage}
              </div>
            )}
          </div>

          {/* Gallery */}
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                  Gallery
                </p>

                <p className="mt-0.5 text-xs font-medium text-[#294436]">
                  {loading
                    ? "Loading photos..."
                    : `${images.length} photo${
                        images.length === 1
                          ? ""
                          : "s"
                      }`}
                </p>

                {showCoverControl &&
                  !loading &&
                  images.length > 0 && (
                    <p className="mt-0.5 text-[10px] text-[#8C9782]">
                      Star dabao jis photo ko background (cover) banana hai.
                    </p>
                  )}
              </div>

              {!loading && (
                <button
                  type="button"
                  onClick={() =>
                    void onRefresh()
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E3E6DE] bg-white px-3 py-1.5 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC]"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </button>
              )}
            </div>

            {loading ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({
                  length: 8,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-[4/3] animate-pulse rounded-lg bg-[#E3E6DE]"
                  />
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-[#DFE4DA] bg-[#F7F6F0]/50 px-6 py-12 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#7D887D] shadow-sm">
                  <ImageIcon className="h-5 w-5" />
                </div>

                <h3 className="mt-3 text-xs font-medium text-[#294436]">
                  No photos yet
                </h3>

                <p className="mt-0.5 text-[10px] text-[#859083]">
                  Upload an image using the form above.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {images.map((image) => {
                  const isCover =
                    showCoverControl &&
                    image.propertyImageId ===
                      effectiveCoverId;

                  return (
                    <div
                      key={
                        image.propertyImageId
                      }
                      className={`group overflow-hidden rounded-xl border bg-white shadow-sm ${
                        isCover
                          ? "border-[#1D4435] ring-2 ring-[#1D4435]/30"
                          : "border-[#E3E6DE]"
                      }`}
                    >
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedImage(
                              image,
                            )
                          }
                          className="relative block aspect-[4/3] w-full overflow-hidden bg-[#F7F6F0]"
                        >
                          <img
                            src={resolveImageUrl(
                              image.imageUrl,
                            )}
                            alt={
                              image.caption ||
                              "RoomEase property photo"
                            }
                            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                            loading="lazy"
                          />

                          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/25 group-hover:opacity-100">
                            <Eye className="h-4 w-4" />
                          </div>
                        </button>

                        {isCover && (
                          <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-[#1D4435] px-2 py-1 text-[9px] font-medium uppercase tracking-wider text-white shadow">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            Cover
                          </span>
                        )}
                      </div>

                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-[#294436]">
                              {image.caption ||
                                "Untitled photo"}
                            </p>

                            <p className="mt-0.5 text-[10px] text-[#8C9782]">
                              {formatGalleryDate(
                                image.uploadedAt,
                              )}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-0.5">
                            {showCoverControl && (
                              <button
                                type="button"
                                onClick={() =>
                                  onSetCover(
                                    image.propertyImageId,
                                  )
                                }
                                disabled={isCover}
                                className={`rounded-lg p-1.5 transition ${
                                  isCover
                                    ? "text-[#1D4435]"
                                    : "text-[#7D887D] hover:bg-[#F2F4EC] hover:text-[#1D4435]"
                                }`}
                                title={
                                  isCover
                                    ? "Current cover"
                                    : "Set as cover (background)"
                                }
                              >
                                <Star
                                  className={`h-3.5 w-3.5 ${
                                    isCover
                                      ? "fill-current"
                                      : ""
                                  }`}
                                />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                void deleteImage(
                                  image,
                                )
                              }
                              disabled={
                                deletingId ===
                                image.propertyImageId
                              }
                              className="rounded-lg p-1.5 text-[#7D887D] hover:bg-[#FBF0E9] hover:text-[#A2634B] disabled:opacity-40"
                              title="Delete image"
                            >
                              {deletingId ===
                              image.propertyImageId ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/90 p-4">
          <button
            type="button"
            onClick={() =>
              setSelectedImage(null)
            }
            className="absolute right-4 top-4 rounded-xl bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close image viewer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="max-h-[86vh] max-w-5xl">
            <img
              src={resolveImageUrl(
                selectedImage.imageUrl,
              )}
              alt={
                selectedImage.caption ||
                "RoomEase gallery image"
              }
              className="max-h-[78vh] max-w-full rounded-xl object-contain shadow-2xl"
            />

            {selectedImage.caption && (
              <p className="mt-3 text-center text-xs font-medium text-white">
                {selectedImage.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GuestQrModal({
  bed,
  propertyName,
  onClose,
}: {
  bed: Bed;
  propertyName: string;
  onClose: () => void;
}) {
  if (!bed.guestAccessToken) return null;

  const guestUrl = `${window.location.origin}/guest/access?bedToken=${bed.guestAccessToken}`;

  const handlePrint = () => {
    const printWindow = window.open(
      "",
      "_blank",
      "width=500,height=700",
    );

    if (!printWindow) {
      alert(
        "Please allow pop-ups to print the QR code.",
      );
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>RoomEase Guest QR - Bed ${bed.bedNumber}</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              background: white;
              color: #0f172a;
            }

            .sheet {
              width: 100%;
              max-width: 420px;
              text-align: center;
              padding: 32px;
            }

            .brand {
              font-size: 26px;
              font-weight: 800;
              margin-bottom: 8px;
            }

            .property {
              font-size: 16px;
              font-weight: 700;
              margin-bottom: 4px;
            }

            .bed {
              font-size: 15px;
              color: #64748b;
              margin-bottom: 24px;
            }

            .qr {
              display: inline-flex;
              padding: 20px;
              border: 1px solid #e2e8f0;
              border-radius: 18px;
            }

            .text {
              margin-top: 22px;
              font-size: 14px;
              color: #475569;
              line-height: 1.5;
            }

            .url {
              margin-top: 16px;
              padding: 10px;
              background: #f8fafc;
              border-radius: 10px;
              word-break: break-all;
              font-size: 10px;
              color: #64748b;
            }

            @media print {
              body {
                min-height: auto;
              }
            }
          </style>
        </head>

        <body>
          <div class="sheet">
            <div class="brand">RoomEase</div>

            <div class="property">
              ${escapeHtml(propertyName)}
            </div>

            <div class="bed">
              Bed ${escapeHtml(
                bed.bedNumber,
              )}
            </div>

            <div class="qr" id="qr"></div>

            <div class="text">
              Scan this QR code to access guest services,
              request help and view available services.
            </div>

            <div class="url">
              ${escapeHtml(
                guestUrl,
              )}
            </div>
          </div>

          <script>
            const qrContainer = document.getElementById("qr");

            qrContainer.innerHTML = \`
              <img
                src="${createQrSvgDataUrl(
                  guestUrl,
                )}"
                width="220"
                height="220"
                alt="Guest QR"
              />
            \`;

            setTimeout(() => {
              window.print();
            }, 300);
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#EEF0E9] p-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8EFE8] text-[#356248]">
                <QrCode className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-sm font-medium text-[#294436]">
                  Guest QR
                </h2>

                <p className="text-xs text-[#859083]">
                  Bed {bed.bedNumber}
                </p>
              </div>
            </div>

            <p className="mt-2 text-xs text-[#7D887D]">
              {propertyName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#7D887D] hover:bg-[#F2F4EC] hover:text-[#294436]"
            aria-label="Close QR"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center p-6">
          <div
            id={`guest-qr-${bed.bedId}`}
            className="rounded-xl border border-[#E3E6DE] bg-white p-4"
          >
            <QRCode
              value={guestUrl}
              size={200}
              bgColor="#ffffff"
              fgColor="#1D4435"
            />
          </div>

          <h3 className="mt-4 text-sm font-medium text-[#294436]">
            RoomEase Guest Services
          </h3>

          <p className="mt-1 max-w-sm text-center text-xs text-[#859083]">
            Scan this QR to access guest services for this bed.
          </p>

          <div className="mt-3.5 w-full rounded-lg bg-[#F7F6F0] p-2.5">
            <p className="break-all text-center text-[10px] leading-4 text-[#7D887D]">
              {guestUrl}
            </p>
          </div>

          <div className="mt-4 flex w-full gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#E3E6DE] px-3.5 py-2 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC]"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#295640]"
            >
              Print QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createQrSvgDataUrl(_value?: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">
      <rect width="220" height="220" fill="white"/>
      <text x="110" y="105" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748b">
        Please print from the
      </text>
      <text x="110" y="125" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748b">
        Guest QR window
      </text>
    </svg>
  `)}`;
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[#7D887D]">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
          {icon}
        </span>

        <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
          {label}
        </span>
      </div>

      <p className="mt-3 text-2xl font-medium tracking-tight text-[#294436]">
        {value}
      </p>
    </div>
  );
}

function FinanceCard({
  label,
  value,
  helper,
  danger,
}: {
  label: string;
  value: string;
  helper?: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm">
      <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-medium tracking-tight ${
          danger
            ? "text-[#A2634B]"
            : "text-[#294436]"
        }`}
      >
        {value}
      </p>

      {helper && (
        <p className="mt-1 text-[10px] font-medium text-[#859083]">
          {helper}
        </p>
      )}
    </div>
  );
}

function ModalShell({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#EEF0E9] p-5 sm:p-6">
          <div>
            <h2 className="text-sm font-medium text-[#294436]">
              {title}
            </h2>

            {description && (
              <p className="mt-0.5 text-xs text-[#859083]">
                {description}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#7D887D] hover:bg-[#F2F4EC] hover:text-[#294436]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[#304B35]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="mt-2 h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3.5 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
      />
    </label>
  );
}

function PropertyEditModal({
  property,
  onClose,
  onSaved,
  setError,
}: {
  property: PropertyDetailType;
  onClose: () => void;
  onSaved: () => Promise<void>;
  setError: (value: string) => void;
}) {
  const [name, setName] = useState(
    property.propertyName,
  );

  const [type, setType] =
    useState<PropertyType>(
      property.propertyType,
    );

  const [address, setAddress] =
    useState(property.address);

  const [city, setCity] =
    useState(property.city);

  const [busy, setBusy] =
    useState(false);

  const [localError, setLocalError] =
    useState("");

  const submit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();
    setLocalError("");

    if (
      !name.trim() ||
      !address.trim() ||
      !city.trim()
    ) {
      setLocalError(
        "All property fields are required.",
      );
      return;
    }

    try {
      setBusy(true);

      await updateProperty(
        property.propertyId,
        {
          propertyName:
            name.trim(),
          propertyType: type,
          address:
            address.trim(),
          city: city.trim(),
        },
      );

      await onSaved();
    } catch (err) {
      const message = apiError(
        err,
        "Unable to update property.",
      );

      setLocalError(message);
      setError("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      title="Edit property"
      description="Update the basic property information."
      onClose={onClose}
    >
      <form
        onSubmit={submit}
        className="space-y-4 p-5 sm:p-6"
      >
        {localError && (
          <div className="rounded-lg border border-[#E7D4C7] bg-[#FBF0E9] p-3 text-xs text-[#8A624D]">
            {localError}
          </div>
        )}

        <Field
          label="Property name"
          value={name}
          onChange={setName}
        />

        <div>
          <span className="text-xs font-medium text-[#304B35]">
            Property type
          </span>

          <div className="mt-2 grid grid-cols-3 gap-2">
            {PROPERTY_TYPES.map(
              (item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() =>
                    setType(item)
                  }
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    type === item
                      ? "border-[#1D4435] bg-[#1D4435] text-white shadow-sm"
                      : "border-[#E3E6DE] bg-white text-[#40543E] hover:border-[#C7D3C7]"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          </div>
        </div>

        <Field
          label="Address"
          value={address}
          onChange={setAddress}
        />

        <Field
          label="City"
          value={city}
          onChange={setCity}
        />

        <div className="flex justify-end gap-2 border-t border-[#EEF0E9] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3.5 py-2 text-xs font-medium text-[#55755A] hover:bg-[#F2F4EC]"
          >
            Cancel
          </button>

          <button
            disabled={busy}
            className="rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#295640] disabled:opacity-50"
          >
            {busy
              ? "Saving…"
              : "Save changes"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function RoomEditModal({
  room,
  onClose,
  onSaved,
  setError,
}: {
  room: Room;
  onClose: () => void;
  onSaved: () => Promise<void>;
  setError: (value: string) => void;
}) {
  const [number, setNumber] =
    useState(room.roomNumber);

  const [type, setType] =
    useState<RoomType>(
      room.roomType,
    );

  const [busy, setBusy] =
    useState(false);

  const [localError, setLocalError] =
    useState("");

  const submit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();
    setLocalError("");

    if (!number.trim()) {
      setLocalError(
        "Room number is required.",
      );
      return;
    }

    try {
      setBusy(true);

      await updateRoom(
        room.roomId,
        {
          roomNumber:
            number.trim(),
          roomType: type,
        },
      );

      await onSaved();
    } catch (err) {
      const message = apiError(
        err,
        "Unable to update room.",
      );

      setLocalError(message);
      setError("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      title={`Edit room ${room.roomNumber}`}
      description="Change the room number or sharing type."
      onClose={onClose}
    >
      <form
        onSubmit={submit}
        className="space-y-4 p-5 sm:p-6"
      >
        {localError && (
          <div className="rounded-lg border border-[#E7D4C7] bg-[#FBF0E9] p-3 text-xs text-[#8A624D]">
            {localError}
          </div>
        )}

        <Field
          label="Room number"
          value={number}
          onChange={setNumber}
        />

        <div>
          <span className="text-xs font-medium text-[#304B35]">
            Room type
          </span>

          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                "Single",
                "Sharing",
              ] as RoomType[]
            ).map((item) => (
              <button
                type="button"
                key={item}
                onClick={() =>
                  setType(item)
                }
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  type === item
                    ? "border-[#1D4435] bg-[#1D4435] text-white shadow-sm"
                    : "border-[#E3E6DE] bg-white text-[#40543E] hover:border-[#C7D3C7]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
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
            disabled={busy}
            className="rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#295640] disabled:opacity-50"
          >
            {busy
              ? "Saving…"
              : "Save changes"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function BedEditModal({
  bed,
  onClose,
  onSaved,
  setError,
}: {
  bed: Bed;
  onClose: () => void;
  onSaved: () => Promise<void>;
  setError: (value: string) => void;
}) {
  const [number, setNumber] =
    useState(bed.bedNumber);

  const [rent, setRent] =
    useState(
      String(bed.monthlyRent),
    );

  const [busy, setBusy] =
    useState(false);

  const [localError, setLocalError] =
    useState("");

  const submit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();
    setLocalError("");

    const amount = Number(rent);

    if (
      !number.trim() ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      setLocalError(
        "Enter a valid bed number and monthly rent.",
      );
      return;
    }

    try {
      setBusy(true);

      await updateBed(
        bed.bedId,
        {
          bedNumber:
            number.trim(),
          monthlyRent: amount,
        },
      );

      await onSaved();
    } catch (err) {
      const message = apiError(
        err,
        "Unable to update bed.",
      );

      setLocalError(message);
      setError("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      title={`Edit bed ${bed.bedNumber}`}
      description="Rent changes apply to new check-ins; active tenant rent stays fixed."
      onClose={onClose}
    >
      <form
        onSubmit={submit}
        className="space-y-4 p-5 sm:p-6"
      >
        {localError && (
          <div className="rounded-lg border border-[#E7D4C7] bg-[#FBF0E9] p-3 text-xs text-[#8A624D]">
            {localError}
          </div>
        )}

        <Field
          label="Bed number"
          value={number}
          onChange={setNumber}
        />

        <Field
          label="Monthly rent"
          value={rent}
          onChange={setRent}
          type="number"
        />

        <div className="flex justify-end gap-2 border-t border-[#EEF0E9] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3.5 py-2 text-xs font-medium text-[#55755A] hover:bg-[#F2F4EC]"
          >
            Cancel
          </button>

          <button
            disabled={busy}
            className="rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#295640] disabled:opacity-50"
          >
            {busy
              ? "Saving…"
              : "Save changes"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ConfirmModal({
  title,
  description,
  confirmLabel,
  danger,
  busy,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <ModalShell
      title={title}
      description={description}
      onClose={onClose}
    >
      <div className="p-5 sm:p-6">
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-3.5 py-2 text-xs font-medium text-[#55755A] hover:bg-[#F2F4EC]"
          >
            Cancel
          </button>

          <button
            disabled={busy}
            onClick={onConfirm}
            className={`rounded-lg px-3.5 py-2 text-xs font-medium text-white shadow-sm disabled:opacity-50 ${
              danger
                ? "bg-[#A2634B] hover:bg-[#8D543F]"
                : "bg-[#1D4435] hover:bg-[#295640]"
            }`}
          >
            {busy
              ? "Working…"
              : confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}