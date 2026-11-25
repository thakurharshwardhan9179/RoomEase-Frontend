import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Utensils,
  X,
} from "lucide-react";

import {
  addMenuItem,
  getMenuByProperty,
  updateMenuItem,
  type MenuItem,
} from "../../api/menu.api";

interface MenuForm {
  name: string;
  category: string;
  price: string;
  isActive: boolean;
}

const emptyForm: MenuForm = {
  name: "",
  category: "",
  price: "",
  isActive: true,
};

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [form, setForm] = useState<MenuForm>(emptyForm);

  const [propertyId, setPropertyId] = useState("");

  useEffect(() => {
    const storedPropertyId = localStorage.getItem(
      "roomease_property_id"
    );

    if (storedPropertyId) {
      setPropertyId(storedPropertyId);
    }
  }, []);

  const loadMenu = useCallback(async () => {
    if (!propertyId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getMenuByProperty(propertyId);

      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to load menu items."
      );
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const openAddForm = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEditForm = (item: MenuItem) => {
    setEditingItem(item);

    setForm({
      name: item.name || "",
      category: item.category || "",
      price:
        item.price !== null && item.price !== undefined
          ? String(item.price)
          : "",
      isActive: item.isActive,
    });

    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingItem(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!propertyId) {
      setError(
        "No property selected. Please select a property first."
      );
      return;
    }

    const name = form.name.trim();

    if (!name) {
      setError("Menu item name is required.");
      return;
    }

    let price: number | undefined;

    if (form.price.trim()) {
      price = Number(form.price);

      if (!Number.isFinite(price) || price < 0) {
        setError("Please enter a valid price.");
        return;
      }
    }

    try {
      setSaving(true);
      setError("");

      if (editingItem) {
        await updateMenuItem(editingItem.menuItemId, {
          name,
          category: form.category.trim() || undefined,
          price,
          isActive: form.isActive,
        });
      } else {
        await addMenuItem({
          propertyId,
          name,
          category: form.category.trim() || undefined,
          price,
        });
      }

      closeForm();
      await loadMenu();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to save menu item."
      );
    } finally {
      setSaving(false);
    }
  };

  const activeCount = items.filter(
    (item) => item.isActive
  ).length;

  const inactiveCount = items.filter(
    (item) => !item.isActive
  ).length;

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Utensils className="h-4 w-4 text-[#55755A]" />

              <span className="text-xs font-medium text-[#7D887D]">
                F&B
              </span>
            </div>

            <h1 className="mt-1 text-xl font-medium tracking-tight text-[#294436] sm:text-2xl">
              Menu
            </h1>

            <p className="mt-0.5 text-xs text-[#859083]">
              Manage food and beverage items available to guests.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadMenu}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E3E6DE] bg-white px-3.5 py-2 text-xs font-medium text-[#40543E] shadow-sm hover:bg-[#F2F4EC] disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#295640]"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
              Total Items
            </p>

            <p className="mt-2 text-2xl font-medium tracking-tight text-[#294436]">
              {items.length}
            </p>
          </div>

          <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
              Active Items
            </p>

            <p className="mt-2 text-2xl font-medium tracking-tight text-[#356248]">
              {activeCount}
            </p>
          </div>

          <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
              Inactive Items
            </p>

            <p className="mt-2 text-2xl font-medium tracking-tight text-[#7D887D]">
              {inactiveCount}
            </p>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] px-4 py-3 text-xs font-medium text-[#8A624D]">
            {error}
          </div>
        )}

        {/* MENU LIST */}
        <div className="overflow-hidden rounded-xl border border-[#E3E6DE] bg-white shadow-sm">
          <div className="border-b border-[#EEF0E9] px-5 py-4">
            <h2 className="text-xs font-medium text-[#294436]">
              Menu Items
            </h2>

            <p className="mt-0.5 text-xs text-[#859083]">
              Active items can be shown on the guest menu.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-12 text-xs text-[#7D887D]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading menu...
            </div>
          ) : items.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Utensils className="mx-auto h-8 w-8 text-[#7D887D]" />

              <h3 className="mt-3 text-xs font-medium text-[#294436]">
                No menu items
              </h3>

              <p className="mt-0.5 text-xs text-[#859083]">
                Add your first food or beverage item.
              </p>

              <button
                type="button"
                onClick={openAddForm}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#295640]"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#EEF0E9]">
              {items.map((item) => (
                <div
                  key={item.menuItemId}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xs font-medium text-[#294436]">
                        {item.name}
                      </h3>

                      <span
                        className={`rounded-md px-2 py-0.5 text-[9px] font-medium ${
                          item.isActive
                            ? "bg-[#E8EFE8] text-[#356248]"
                            : "bg-[#EDF1F3] text-[#5C7180]"
                        }`}
                      >
                        {item.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-[#859083]">
                      {item.category && (
                        <span>{item.category}</span>
                      )}

                      {item.price !== null &&
                        item.price !== undefined && (
                          <span className="font-medium text-[#36503E]">
                            ₹{Number(item.price).toFixed(2)}
                          </span>
                        )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditForm(item)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E3E6DE] bg-white px-3 py-1.5 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC]"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#EEF0E9] px-5 py-4">
              <div>
                <h2 className="text-sm font-medium text-[#294436]">
                  {editingItem
                    ? "Edit Menu Item"
                    : "Add Menu Item"}
                </h2>

                <p className="mt-0.5 text-xs text-[#859083]">
                  Enter the food or beverage details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-1.5 text-[#7D887D] hover:bg-[#F2F4EC] hover:text-[#294436] disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-5 sm:p-6"
            >
              <div>
                <label className="block text-xs font-medium text-[#304B35]">
                  Item Name
                </label>

                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Example: Paneer Sandwich"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#304B35]">
                  Category
                </label>

                <input
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  placeholder="Example: Breakfast"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#304B35]">
                  Price
                </label>

                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#7D887D]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    placeholder="120"
                    className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 pl-7 pr-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
                    disabled={saving}
                  />
                </div>
              </div>

              {editingItem && (
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[#E3E6DE] bg-[#F7F6F0]/60 px-3.5 py-3">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                    disabled={saving}
                    className="h-4 w-4 rounded border-[#DFE4DA] text-[#1D4435] focus:ring-[#E3EADF]"
                  />

                  <span className="text-xs font-medium text-[#304B35]">
                    Item is active
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-2 border-t border-[#EEF0E9] pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg px-3.5 py-2 text-xs font-medium text-[#55755A] hover:bg-[#F2F4EC] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4435] px-4 py-2 text-xs font-medium text-white hover:bg-[#295640] disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {editingItem
                        ? "Save Changes"
                        : "Add Item"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}