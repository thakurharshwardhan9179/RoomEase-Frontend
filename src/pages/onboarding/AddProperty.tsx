import {
  ArrowRight,
  Building2,
  Check,
  MapPin,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addProperty } from "../../api/properties.api";

type PropertyType = "PG" | "Hostel" | "Apartment";

export default function AddProperty() {
  const navigate = useNavigate();

  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] =
    useState<PropertyType>("PG");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setError("");

    if (!propertyName.trim()) {
      setError("Please enter your property name.");
      return;
    }

    if (!address.trim()) {
      setError("Please enter your property address.");
      return;
    }

    if (!city.trim()) {
      setError("Please enter your city.");
      return;
    }

    try {
      setLoading(true);

      const response = await addProperty({
        propertyName: propertyName.trim(),
        propertyType,
        address: address.trim(),
        city: city.trim(),
      });

      if (response?.propertyId) {
        localStorage.setItem(
          "roomease_property_id",
          response.propertyId
        );
      }

      navigate("/properties", {
        replace: true,
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Unable to create property. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">

      {/* HEADER */}
      <header className="border-b border-[#E3E6DE] bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1D4435] font-medium text-white shadow-sm">
              R
            </div>

            <div>
              <h1 className="text-xs font-medium text-[#294436]">
                RoomEase
              </h1>

              <p className="text-[10px] text-[#859083]">
                Property Management
              </p>
            </div>
          </div>

          <div className="text-xs font-medium text-[#7D887D]">
            Step 2 of 3
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

        {/* PROGRESS */}
        <div className="mx-auto mb-8 max-w-3xl">
          <div className="flex items-center">

            <ProgressStep
              number="1"
              label="Documents"
              completed
            />

            <div className="h-px flex-1 bg-[#1D4435]" />

            <ProgressStep
              number="2"
              label="Property"
              active
            />

            <div className="h-px flex-1 bg-[#E3E6DE]" />

            <ProgressStep
              number="3"
              label="Setup"
            />

          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">

          {/* LEFT CONTENT */}
          <div className="pt-2">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1D4435] shadow-sm">
              <Building2 className="h-5 w-5 text-white" />
            </div>

            <h1 className="mt-4 text-xl font-medium tracking-tight text-[#294436] sm:text-2xl">
              Add your first property
            </h1>

            <p className="mt-2 max-w-xl text-xs leading-5 text-[#859083]">
              Tell us about your PG, hostel or apartment.
              You can add rooms and tenants once your
              property is created.
            </p>

            <div className="mt-6 space-y-3.5">

              <Benefit
                title="Manage rooms & beds"
                description="Keep track of vacant and occupied spaces."
              />

              <Benefit
                title="Manage tenants"
                description="Check-in, transfer and checkout tenants easily."
              />

              <Benefit
                title="Track rent"
                description="Record payments and see outstanding balances."
              />

            </div>
          </div>

          {/* FORM */}
          <div className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5">
              <h2 className="text-xs font-medium text-[#294436]">
                Property details
              </h2>

              <p className="mt-0.5 text-xs text-[#859083]">
                Enter the basic details of your property.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-[#E7D4C7] bg-[#FBF0E9] px-3.5 py-3 text-xs font-medium text-[#8A624D]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* PROPERTY NAME */}
              <div>
                <label className="block text-xs font-medium text-[#304B35]">
                  Property name
                </label>

                <input
                  value={propertyName}
                  onChange={(e) =>
                    setPropertyName(e.target.value)
                  }
                  placeholder="e.g. RoomEase PG"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
                />
              </div>

              {/* PROPERTY TYPE */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-[#304B35]">
                  Property type
                </label>

                <div className="mt-1.5 grid grid-cols-3 gap-2">

                  <PropertyTypeButton
                    type="PG"
                    selected={propertyType === "PG"}
                    onClick={() =>
                      setPropertyType("PG")
                    }
                  />

                  <PropertyTypeButton
                    type="Hostel"
                    selected={propertyType === "Hostel"}
                    onClick={() =>
                      setPropertyType("Hostel")
                    }
                  />

                  <PropertyTypeButton
                    type="Apartment"
                    selected={propertyType === "Apartment"}
                    onClick={() =>
                      setPropertyType("Apartment")
                    }
                  />

                </div>
              </div>

              {/* ADDRESS */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-[#304B35]">
                  Address
                </label>

                <div className="relative mt-1.5">
                  <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7D887D]" />

                  <input
                    value={address}
                    onChange={(e) =>
                      setAddress(e.target.value)
                    }
                    placeholder="Street, area or locality"
                    className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 pl-9 pr-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
                  />
                </div>
              </div>

              {/* CITY */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-[#304B35]">
                  City
                </label>

                <input
                  value={city}
                  onChange={(e) =>
                    setCity(e.target.value)
                  }
                  placeholder="e.g. Indore"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
                />
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] text-xs font-medium text-white shadow-sm transition hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating property...
                  </>
                ) : (
                  <>
                    Create property
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>

            </form>

            <p className="mt-4 text-center text-[11px] text-[#859083]">
              You can add more properties later from the
              dashboard.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProgressStep({
  number,
  label,
  active = false,
  completed = false,
}: {
  number: string;
  label: string;
  active?: boolean;
  completed?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">

      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium ${
          active
            ? "bg-[#1D4435] text-white shadow-sm"
            : completed
              ? "bg-[#1D4435] text-white shadow-sm"
              : "border border-[#E3E6DE] bg-white text-[#7D887D]"
        }`}
      >
        {completed ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          number
        )}
      </div>

      <span
        className={`hidden text-xs font-medium sm:block ${
          active || completed
            ? "text-[#294436]"
            : "text-[#859083]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function PropertyTypeButton({
  type,
  selected,
  onClick,
}: {
  type: PropertyType;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-lg border px-2.5 py-2.5 text-xs font-medium transition ${
        selected
          ? "border-[#1D4435] bg-[#1D4435] text-white shadow-sm"
          : "border-[#E3E6DE] bg-white text-[#40543E] hover:border-[#C7D3C7]"
      }`}
    >
      {type}

      {selected && (
        <span className="absolute right-1.5 top-1.5">
          <Check className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}

function Benefit({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E8EFE8] text-[#356248]">
        <Check className="h-3.5 w-3.5" />
      </div>

      <div>
        <p className="text-xs font-medium text-[#294436]">
          {title}
        </p>

        <p className="mt-0.5 text-[11px] text-[#859083]">
          {description}
        </p>
      </div>
    </div>
  );
}