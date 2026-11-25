import {
  ArrowLeft,
  BedDouble,
  Building2,
} from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  addRoom,
  getProperty,
  type PropertyDetail,
  type RoomType,
} from "../../api/properties.api";

export default function AddRoom() {
  const navigate = useNavigate();
  const { propertyId } = useParams();

  const [property, setProperty] =
    useState<PropertyDetail | null>(null);

  const [roomNumber, setRoomNumber] =
    useState("");

  const [roomType, setRoomType] =
    useState<RoomType>("Sharing");

  const [bedCount, setBedCount] =
    useState(2);

  const [monthlyRent, setMonthlyRent] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [loadingProperty, setLoadingProperty] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!propertyId) return;

    getProperty(propertyId)
      .then(setProperty)
      .catch((err) => {
        console.error(err);
        setError(
          "Unable to load property details."
        );
      })
      .finally(() => {
        setLoadingProperty(false);
      });
  }, [propertyId]);

  const isApartment =
    property?.propertyType === "Apartment";

  useEffect(() => {
    if (isApartment) {
      setRoomType("Single");
      setBedCount(1);
    }
  }, [isApartment]);

  const submit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (!propertyId) return;

    setError("");

    if (!roomNumber.trim()) {
      setError("Please enter room/unit number.");
      return;
    }

    const rent = Number(monthlyRent);

    if (!Number.isFinite(rent) || rent <= 0) {
      setError(
        "Please enter a valid monthly rent."
      );
      return;
    }

    try {
      setLoading(true);

      await addRoom({
        propertyId,
        roomNumber: roomNumber.trim(),
        roomType: isApartment
          ? "Single"
          : roomType,
        bedCount: isApartment
          ? 1
          : bedCount,
        monthlyRent: rent,
      });

      navigate(
        `/properties/${propertyId}`,
        { replace: true }
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Unable to create room."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingProperty) {
    return (
      <div className="min-h-screen bg-[#F7F6F0] p-6">
        <div className="mx-auto max-w-xl">
          <div className="h-10 w-40 animate-pulse rounded bg-[#E3E6DE]" />
          <div className="mt-8 h-96 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F6F0]">
        <p className="text-xs font-medium text-[#A2634B]">
          {error || "Property not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">

        {/* HEADER */}
        <header className="mb-6">
          <button
            onClick={() =>
              navigate(
                `/properties/${propertyId}`
              )
            }
            className="inline-flex items-center gap-2 text-xs font-medium text-[#55755A] hover:text-[#1D4435]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Property
          </button>
        </header>

        <main className="mx-auto max-w-3xl">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1D4435] text-white shadow-sm">
              <BedDouble className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-xl font-medium tracking-tight text-[#294436] sm:text-2xl">
                Add Room
              </h1>

              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#7D887D]">
                <Building2 className="h-3.5 w-3.5 text-[#55755A]" />
                {property.propertyName}
              </p>
            </div>
          </div>

          <form
            onSubmit={submit}
            className="mt-6 rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-8"
          >
            {error && (
              <div className="mb-5 rounded-lg border border-[#E7D4C7] bg-[#FBF0E9] px-4 py-3 text-xs text-[#8A624D]">
                {error}
              </div>
            )}

            {/* ROOM NUMBER */}
            <div>
              <label className="block text-xs font-medium text-[#304B35]">
                {isApartment
                  ? "Unit number"
                  : "Room number"}
              </label>

              <input
                value={roomNumber}
                onChange={(e) =>
                  setRoomNumber(e.target.value)
                }
                placeholder={
                  isApartment
                    ? "e.g. A-101"
                    : "e.g. 101"
                }
                className="mt-2 h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3.5 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
              />
            </div>

            {/* NON APARTMENT */}
            {!isApartment && (
              <>
                <div className="mt-5">
                  <label className="block text-xs font-medium text-[#304B35]">
                    Room type
                  </label>

                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <Choice
                      title="Single"
                      description="1 bed"
                      selected={
                        roomType === "Single"
                      }
                      onClick={() => {
                        setRoomType("Single");
                        setBedCount(1);
                      }}
                    />

                    <Choice
                      title="Sharing"
                      description="Multiple beds"
                      selected={
                        roomType === "Sharing"
                      }
                      onClick={() =>
                        setRoomType("Sharing")
                      }
                    />
                  </div>
                </div>

                {roomType === "Sharing" && (
                  <div className="mt-5">
                    <label className="block text-xs font-medium text-[#304B35]">
                      Number of beds
                    </label>

                    <select
                      value={bedCount}
                      onChange={(e) =>
                        setBedCount(
                          Number(e.target.value)
                        )
                      }
                      className="mt-2 h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3.5 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:ring-4 focus:ring-[#E3EADF]"
                    >
                      {Array.from({ length: 19 }, (_, i) => i + 2).map(
                        (count) => (
                          <option key={count} value={count}>{count} beds</option>
                        )
                      )}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* RENT */}
            <div className="mt-5">
              <label className="block text-xs font-medium text-[#304B35]">
                Monthly rent per bed
              </label>

              <div className="relative mt-2">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#7D887D]">
                  ₹
                </span>

                <input
                  type="number"
                  min="1"
                  value={monthlyRent}
                  onChange={(e) =>
                    setMonthlyRent(e.target.value)
                  }
                  placeholder="6000"
                  className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 pl-8 pr-3.5 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
                />
              </div>
            </div>

            <p className="mt-2 text-[10px] text-[#8C9782]">
              Rent is stored per bed. Existing tenant agreements are not changed when this default is later edited.
            </p>

            {/* APARTMENT INFO */}
            {isApartment && (
              <div className="mt-5 rounded-lg border border-[#D5E2D5] bg-[#E8EFE8] p-3.5 text-xs text-[#356248]">
                Apartments automatically use one unit per room. Room type and bed count are fixed to Single / 1 bed.
              </div>
            )}

            <button
              disabled={loading}
              className="mt-6 h-10 w-full rounded-lg bg-[#1D4435] text-xs font-medium text-white shadow-sm transition hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating room..."
                : "Create Room"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}

function Choice({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3.5 text-left transition ${
        selected
          ? "border-[#1D4435] bg-[#1D4435] text-white shadow-sm"
          : "border-[#E3E6DE] bg-white text-[#40543E] hover:border-[#C7D3C7]"
      }`}
    >
      <p className="text-xs font-medium">{title}</p>

      <p
        className={`mt-0.5 text-[10px] ${
          selected
            ? "text-[#C4D0C5]"
            : "text-[#7D887D]"
        }`}
      >
        {description}
      </p>
    </button>
  );
}