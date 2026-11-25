import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  ConciergeBell,
  FileText,
  Home as HomeIcon,
  KeyRound,
  Loader2,
  Menu as MenuIcon,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Utensils,
  Wifi,
  Wrench,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  cancelGuestRequest,
  createGuestOrder,
  createGuestRequest,
  getGuestBill,
  getGuestContext,
  getGuestMenu,
  getGuestRequests,
  getGuestServices,
  getGuestTaskStatus,
  rateGuestTask,
  type GuestBillItem,
  type GuestContext,
  type GuestDepartment,
  type GuestMenuItem,
  type GuestRequestItem,
  type GuestService,
  type PaymentMode,
} from "../../api/guest.api";

import {
  clearGuestSession,
  getGuestBedToken,
  getGuestSessionToken,
} from "../../utils/guestSession";

/* =========================================================
   TYPES
========================================================= */

type GuestTab =
  | "home"
  | "services"
  | "food"
  | "requests"
  | "more";

type MoreView =
  | "overview"
  | "bill";

interface TrackingItem {
  trackingToken: string;
  title: string;
  status: string;
  assignedStaffName?: string | null;
  rating?: number | null;
  createdAt?: string;
  completedAt?: string | null;
}

/* =========================================================
   CONSTANTS
========================================================= */

const TRACKING_STORAGE_KEY =
  "roomease_guest_tracking_tokens";

const SERVICE_DEPARTMENTS = [
  "Housekeeping",
  "Maintenance",
  "IT",
  "Other",
] as const;

const DEPARTMENT_META: Record<
  GuestDepartment,
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
      <ConciergeBell className="h-4 w-4" />
    ),
  },

  FnB: {
    label: "Food & Beverage",
    description:
      "Food and drinks",
    icon: (
      <Utensils className="h-4 w-4" />
    ),
  },
};

/* =========================================================
   HELPERS
========================================================= */

function apiError(
  error: any,
  fallback: string,
) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function money(value: number) {
  return `₹${Number(
    value || 0,
  ).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function normalizeStatus(
  status?: string,
) {
  return (
    status
      ?.replace(/[\s_-]/g, "")
      .toLowerCase() || ""
  );
}

function statusLabel(
  status?: string,
) {
  switch (
    normalizeStatus(status)
  ) {
    case "open":
      return "Requested";

    case "inprogress":
      return "In Progress";

    case "completed":
      return "Completed";

    case "cancelled":
    case "canceled":
      return "Cancelled";

    default:
      return status || "Unknown";
  }
}

function statusClasses(
  status?: string,
) {
  switch (
    normalizeStatus(status)
  ) {
    case "open":
      return "border-[#F7EEDC] bg-[#F7EEDC]/60 text-[#9B712F]";

    case "inprogress":
      return "border-[#EDF1F3] bg-[#EDF1F3] text-[#5C7180]";

    case "completed":
      return "border-[#D5E2D5] bg-[#E8EFE8] text-[#356248]";

    case "cancelled":
    case "canceled":
      return "border-[#E7D4C7] bg-[#FBF0E9] text-[#A2634B]";

    default:
      return "border-[#E3E6DE] bg-[#F7F6F0] text-[#7D887D]";
  }
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

/* =========================================================
   TRACKING STORAGE
========================================================= */

function readTrackingTokens(): string[] {
  try {
    const raw =
      sessionStorage.getItem(
        TRACKING_STORAGE_KEY,
      );

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (value): value is string =>
        typeof value === "string" &&
        value.trim().length > 0,
    );
  } catch {
    return [];
  }
}

function saveTrackingTokens(
  tokens: string[],
) {
  const unique =
    Array.from(
      new Set(
        tokens.filter(
          (token) =>
            typeof token === "string" &&
            token.trim().length > 0,
        ),
      ),
    );

  sessionStorage.setItem(
    TRACKING_STORAGE_KEY,
    JSON.stringify(unique),
  );
}

function addTrackingTokens(
  tokens: string[],
) {
  if (tokens.length === 0) {
    return;
  }

  saveTrackingTokens([
    ...readTrackingTokens(),
    ...tokens,
  ]);
}

function removeTrackingToken(
  token: string,
) {
  saveTrackingTokens(
    readTrackingTokens().filter(
      (item) => item !== token,
    ),
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function Guest() {
  const navigate = useNavigate();

  /* =======================================================
      DATA
  ======================================================= */

  const [context, setContext] =
    useState<GuestContext | null>(
      null,
    );

  const [services, setServices] =
    useState<GuestService[]>([]);

  const [menu, setMenu] =
    useState<GuestMenuItem[]>([]);

  const [requests, setRequests] =
    useState<GuestRequestItem[]>([]);

  const [billItems, setBillItems] =
    useState<GuestBillItem[]>([]);

  const [billTotal, setBillTotal] =
    useState(0);

  const [trackingItems, setTrackingItems] =
    useState<TrackingItem[]>([]);

  /* =======================================================
      NAVIGATION
  ======================================================= */

  const [activeTab, setActiveTab] =
    useState<GuestTab>("home");

  const [moreView, setMoreView] =
    useState<MoreView>("overview");

  /* =======================================================
      SERVICES
  ======================================================= */

  const [selectedServices, setSelectedServices] =
    useState<string[]>([]);

  const [details, setDetails] =
    useState("");

  const [detailsFocused, setDetailsFocused] =
    useState(false);

  const [
    expandedDepartments,
    setExpandedDepartments,
  ] = useState<Record<
    string,
    boolean
  >>({});

  /* =======================================================
      FOOD
  ======================================================= */

  const [cart, setCart] =
    useState<
      Record<string, number>
    >({});

  const [paymentMode, setPaymentMode] =
    useState<PaymentMode>("Cash");

  /* =======================================================
      LOADING
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [servicesLoading, setServicesLoading] =
    useState(false);

  const [menuLoading, setMenuLoading] =
    useState(false);

  const [requestsLoading, setRequestsLoading] =
    useState(false);

  const [billLoading, setBillLoading] =
    useState(false);

  const [trackingLoading, setTrackingLoading] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [ordering, setOrdering] =
    useState(false);

  const [cancellingTaskId, setCancellingTaskId] =
    useState<string | null>(null);

  /* =======================================================
      UI STATE
  ======================================================= */

  const [serviceSuccess, setServiceSuccess] =
    useState(false);

  const [orderSuccess, setOrderSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
      RATING
  ======================================================= */

  const [ratingTask, setRatingTask] =
    useState<string | null>(null);

  const [selectedRating, setSelectedRating] =
    useState(0);

  const [ratingSubmitting, setRatingSubmitting] =
    useState(false);

  /* =======================================================
      DERIVED DATA
  ======================================================= */

  const groupedServices = useMemo(() => {
    const groups: Record<
      GuestDepartment,
      GuestService[]
    > = {
      Housekeeping: [],
      Maintenance: [],
      IT: [],
      FnB: [],
      Other: [],
    };

    for (
      const service of services
    ) {
      if (
        !groups[service.department]
      ) {
        continue;
      }

      groups[
        service.department
      ].push(service);
    }

    for (
      const department of Object.keys(
        groups,
      ) as GuestDepartment[]
    ) {
      groups[department].sort(
        (a, b) =>
          Number(a.sortOrder || 0) -
          Number(b.sortOrder || 0),
      );
    }

    return groups;
  }, [services]);

  const selectedItems = useMemo(
    () =>
      selectedServices
        .map((serviceId) =>
          services.find(
            (service) =>
              service.serviceId ===
              serviceId,
          ),
        )
        .filter(
          (
            service,
          ): service is GuestService =>
            Boolean(service),
        ),
    [
      selectedServices,
      services,
    ],
  );

  const needsDetailedDescription =
    selectedItems.some(
      (service) =>
        service.department ===
          "Maintenance" ||
        service.department === "IT",
    );

  const hasMaintenance =
    selectedItems.some(
      (service) =>
        service.department ===
        "Maintenance",
    );

  const hasIT =
    selectedItems.some(
      (service) =>
        service.department === "IT",
    );

  const detailPlaceholder =
    hasMaintenance
      ? "Example: AC is running but not cooling..."
      : hasIT
        ? "Example: Wi-Fi is not connecting on my phone..."
        : "Example: Please come after 6 PM...";

  const cartItems = useMemo(
    () =>
      menu
        .map((item) => ({
          item,
          quantity:
            cart[item.menuItemId] || 0,
        }))
        .filter(
          (entry) =>
            entry.quantity > 0,
        ),
    [cart, menu],
  );

  const cartItemCount = useMemo(
    () =>
      cartItems.reduce(
        (sum, entry) =>
          sum + entry.quantity,
        0,
      ),
    [cartItems],
  );

  const cartTotal = useMemo(
    () =>
      cartItems.reduce(
        (
          total,
          entry,
        ) =>
          total +
          Number(
            entry.item.price || 0,
          ) *
            entry.quantity,
        0,
      ),
    [cartItems],
  );

  const openRequestCount =
    useMemo(
      () =>
        requests.filter(
          (item) =>
            ![
              "completed",
              "cancelled",
              "canceled",
            ].includes(
              normalizeStatus(
                item.status,
              ),
            ),
        ).length,
      [requests],
    );

  const activeRequests =
    useMemo(
      () =>
        requests
          .filter(
            (item) =>
              ![
                "completed",
                "cancelled",
                "canceled",
              ].includes(
                normalizeStatus(
                  item.status,
                ),
              ),
          )
          .slice(0, 2),
      [requests],
    );

  const recentRequests =
    useMemo(
      () =>
        [...requests]
          .sort(
            (a, b) =>
              new Date(
                b.createdAt || 0,
              ).getTime() -
              new Date(
                a.createdAt || 0,
              ).getTime(),
          )
          .slice(0, 3),
      [requests],
    );

  const availableQuickServices =
    useMemo(
      () =>
        [...services]
          .sort(
            (a, b) =>
              Number(a.sortOrder || 0) -
              Number(b.sortOrder || 0),
          )
          .slice(0, 6),
      [services],
    );

  /* =======================================================
      SESSION ERROR
  ======================================================= */

  const handleGuestSessionError = (
    guestError: any,
  ) => {
    const status =
      guestError?.response?.status;

    if (
      status !== 401 &&
      status !== 403
    ) {
      return false;
    }

    const bedToken =
      getGuestBedToken();

    clearGuestSession();

    if (bedToken) {
      navigate(
        `/guest/access?bedToken=${encodeURIComponent(
          bedToken,
        )}`,
        {
          replace: true,
        },
      );
    } else {
      navigate(
        "/guest/access",
        {
          replace: true,
        },
      );
    }

    return true;
  };

  /* =======================================================
      API LOADERS
  ======================================================= */

  const loadContext =
    async () => {
      const data =
        await getGuestContext();

      setContext(data);

      return data;
    };

  const loadServices =
    async () => {
      try {
        setServicesLoading(
          true,
        );

        const data =
          await getGuestServices();

        const ordered = [
          ...data,
        ].sort(
          (a, b) =>
            Number(a.sortOrder || 0) -
            Number(b.sortOrder || 0),
        );

        setServices(
          ordered,
        );

        const expanded: Record<
          string,
          boolean
        > = {};

        for (
          const service of ordered
        ) {
          expanded[
            service.department
          ] = true;
        }

        setExpandedDepartments(
          expanded,
        );
      } catch (
        guestError: any
      ) {
        if (
          handleGuestSessionError(
            guestError,
          )
        ) {
          return;
        }

        setServices([]);

        setError(
          apiError(
            guestError,
            "Unable to load guest services.",
          ),
        );
      } finally {
        setServicesLoading(
          false,
        );
      }
    };

  const loadMenu =
    async () => {
      try {
        setMenuLoading(
          true,
        );

        const data =
          await getGuestMenu();

        setMenu(data);
      } catch (
        guestError: any
      ) {
        if (
          handleGuestSessionError(
            guestError,
          )
        ) {
          return;
        }

        setMenu([]);

        setError(
          apiError(
            guestError,
            "Unable to load food menu.",
          ),
        );
      } finally {
        setMenuLoading(
          false,
        );
      }
    };

  const loadGuestRequests =
    async () => {
      try {
        setRequestsLoading(
          true,
        );

        const response =
          await getGuestRequests();

        setRequests(
          Array.isArray(
            response.items,
          )
            ? response.items
            : [],
        );
      } catch (
        guestError: any
      ) {
        if (
          handleGuestSessionError(
            guestError,
          )
        ) {
          return;
        }

        setError(
          apiError(
            guestError,
            "Unable to load your requests.",
          ),
        );
      } finally {
        setRequestsLoading(
          false,
        );
      }
    };

  const loadBill =
    async () => {
      try {
        setBillLoading(
          true,
        );

        const response =
          await getGuestBill();

        const items =
          Array.isArray(
            response.items,
          )
            ? response.items
            : [];

        setBillItems(items);

        const responseTotal =
          typeof response.totalAmount ===
          "number"
            ? response.totalAmount
            : typeof response.total ===
                "number"
              ? response.total
              : items.reduce(
                  (
                    sum,
                    item,
                  ) =>
                    sum +
                    Number(
                      item.amount ||
                        0,
                    ),
                  0,
                );

        setBillTotal(
          Number(
            responseTotal || 0,
          ),
        );
      } catch (
        guestError: any
      ) {
        if (
          handleGuestSessionError(
            guestError,
          )
        ) {
          return;
        }

        setError(
          apiError(
            guestError,
            "Unable to load your bill.",
          ),
        );
      } finally {
        setBillLoading(
          false,
        );
      }
    };

  const loadTracking =
    async () => {
      const tokens =
        readTrackingTokens();

      if (tokens.length === 0) {
        setTrackingItems([]);
        return;
      }

      try {
        setTrackingLoading(
          true,
        );

        const results =
          await Promise.all(
            tokens.map(
              async (
                trackingToken,
              ) => {
                try {
                  const item =
                    await getGuestTaskStatus(
                      trackingToken,
                    );

                  return {
                    trackingToken,
                    ...item,
                  };
                } catch (
                  guestError: any
                ) {
                  if (
                    guestError?.response
                      ?.status ===
                    404
                  ) {
                    return null;
                  }

                  throw guestError;
                }
              },
            ),
          );

        const validResults =
          results.filter(
            (
              value,
            ): value is TrackingItem =>
              value !== null,
          );

        const removedTokens =
          tokens.filter(
            (token) =>
              !validResults.some(
                (item) =>
                  item.trackingToken ===
                  token,
              ),
          );

        for (
          const token of removedTokens
        ) {
          removeTrackingToken(
            token,
          );
        }

        setTrackingItems(
          validResults,
        );
      } catch (
        guestError: any
      ) {
        if (
          handleGuestSessionError(
            guestError,
          )
        ) {
          return;
        }

        setError(
          apiError(
            guestError,
            "Unable to load request tracking.",
          ),
        );
      } finally {
        setTrackingLoading(
          false,
        );
      }
    };

  const loadGuest =
    async () => {
      const sessionToken =
        getGuestSessionToken();

      if (!sessionToken) {
        setLoading(false);

        setError(
          "Guest session has expired. Please enter your stay code again.",
        );

        return;
      }

      try {
        setLoading(true);
        setError("");

        await loadContext();

        await Promise.all([
          loadServices(),
          loadMenu(),
          loadGuestRequests(),
          loadBill(),
        ]);

        await loadTracking();
      } catch (
        guestError: any
      ) {
        console.error(
          guestError,
        );

        if (
          handleGuestSessionError(
            guestError,
          )
        ) {
          return;
        }

        setError(
          apiError(
            guestError,
            "Unable to load guest portal.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
      EFFECTS
  ======================================================= */

  useEffect(() => {
    void loadGuest();
  }, []);

  useEffect(() => {
    if (
      activeTab ===
      "requests"
    ) {
      void loadGuestRequests();
      void loadTracking();
    }

    if (
      activeTab ===
        "food" &&
      menu.length === 0
    ) {
      void loadMenu();
    }

    if (
      activeTab ===
        "more" &&
      moreView ===
        "bill"
    ) {
      void loadBill();
    }
  }, [
    activeTab,
    moreView,
  ]);

  useEffect(() => {
    const interval =
      window.setInterval(() => {
        if (
          getGuestSessionToken()
        ) {
          void loadGuestRequests();
          void loadTracking();
        }
      }, 15000);

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, []);

  /* =======================================================
      ACTIONS
  ======================================================= */

  const toggleDepartment = (
    department: string,
  ) => {
    setExpandedDepartments(
      (previous) => ({
        ...previous,
        [department]:
          !previous[department],
      }),
    );
  };

  const toggleService = (
    serviceId: string,
  ) => {
    setServiceSuccess(false);

    setSelectedServices(
      (previous) =>
        previous.includes(
          serviceId,
        )
          ? previous.filter(
              (id) =>
                id !==
                serviceId,
            )
          : [
              ...previous,
              serviceId,
            ],
    );
  };

  const updateCart = (
    menuItemId: string,
    nextQuantity: number,
  ) => {
    setOrderSuccess(false);

    setCart(
      (previous) => {
        const next = {
          ...previous,
        };

        if (
          nextQuantity <= 0
        ) {
          delete next[
            menuItemId
          ];
        } else {
          next[
            menuItemId
          ] = nextQuantity;
        }

        return next;
      },
    );
  };

  const submitServices =
    async () => {
      if (
        selectedServices.length ===
        0
      ) {
        setError(
          "Please select at least one service.",
        );
        return;
      }

      try {
        setSubmitting(true);
        setError("");
        setServiceSuccess(false);

        const responses =
          await Promise.all(
            selectedServices.map(
              (serviceId) =>
                createGuestRequest({
                  serviceId,
                  description:
                    details.trim() ||
                    undefined,
                }),
            ),
          );

        const tokens =
          responses
            .map(
              (response) =>
                response.guestTrackingToken,
            )
            .filter(
              (
                token,
              ): token is string =>
                Boolean(token),
            );

        addTrackingTokens(
          tokens,
        );

        setSelectedServices([]);
        setDetails("");
        setDetailsFocused(false);
        setServiceSuccess(true);

        await Promise.all([
          loadGuestRequests(),
          loadTracking(),
        ]);
      } catch (
        guestError: any
      ) {
        if (
          handleGuestSessionError(
            guestError,
          )
        ) {
          return;
        }

        setError(
          apiError(
            guestError,
            "Unable to submit service request.",
          ),
        );
      } finally {
        setSubmitting(
          false,
        );
      }
    };

  const submitOrder =
    async () => {
      if (
        cartItems.length === 0
      ) {
        setError(
          "Please add at least one food item.",
        );
        return;
      }

      if (
        paymentMode ===
          "AddToBill" &&
        context?.hasActiveGuest ===
          false
      ) {
        setError(
          "Add to Bill is available only while your stay is active.",
        );
        return;
      }

      try {
        setOrdering(true);
        setError("");
        setOrderSuccess(false);

        const response =
          await createGuestOrder(
            {
              items:
                cartItems.map(
                  (entry) => ({
                    menuItemId:
                      entry.item
                        .menuItemId,
                    quantity:
                      entry.quantity,
                  }),
                ),
              paymentMode,
            },
          );

        if (
          response.guestTrackingToken
        ) {
          addTrackingTokens([
            response.guestTrackingToken,
          ]);
        }

        setCart({});
        setOrderSuccess(true);

        await Promise.all([
          loadGuestRequests(),
          loadTracking(),
          paymentMode ===
          "AddToBill"
            ? loadBill()
            : Promise.resolve(),
        ]);
      } catch (
        guestError: any
      ) {
        if (
          handleGuestSessionError(
            guestError,
          )
        ) {
          return;
        }

        setError(
          apiError(
            guestError,
            "Unable to place food order.",
          ),
        );
      } finally {
        setOrdering(
          false,
        );
      }
    };

  const cancelRequest =
    async (
      taskId: string,
    ) => {
      const confirmed =
        window.confirm(
          "Are you sure you want to cancel this request?",
        );

      if (!confirmed) {
        return;
      }

      try {
        setCancellingTaskId(
          taskId,
        );
        setError("");

        await cancelGuestRequest(
          taskId,
        );

        await Promise.all([
          loadGuestRequests(),
          loadTracking(),
        ]);
      } catch (
        guestError: any
      ) {
        if (
          handleGuestSessionError(
            guestError,
          )
        ) {
          return;
        }

        setError(
          apiError(
            guestError,
            "Unable to cancel request.",
          ),
        );
      } finally {
        setCancellingTaskId(
          null,
        );
      }
    };

  const openRating = (
    trackingToken: string,
  ) => {
    setRatingTask(
      trackingToken,
    );

    setSelectedRating(0);
    setError("");
  };

  const closeRating = () => {
    if (ratingSubmitting) {
      return;
    }

    setRatingTask(null);
    setSelectedRating(0);
  };

  const submitRating =
    async () => {
      if (
        !ratingTask ||
        selectedRating < 1 ||
        selectedRating > 5
      ) {
        setError(
          "Please select a rating from 1 to 5 stars.",
        );
        return;
      }

      try {
        setRatingSubmitting(
          true,
        );
        setError("");

        await rateGuestTask(
          ratingTask,
          selectedRating,
        );

        setRatingTask(null);
        setSelectedRating(0);

        await Promise.all([
          loadGuestRequests(),
          loadTracking(),
        ]);
      } catch (
        guestError: any
      ) {
        if (
          handleGuestSessionError(
            guestError,
          )
        ) {
          return;
        }

        setError(
          apiError(
            guestError,
            "Unable to submit rating.",
          ),
        );
      } finally {
        setRatingSubmitting(
          false,
        );
      }
    };

  /* =======================================================
      QUICK ACTIONS
  ======================================================= */

  const quickAction =
    (
      service: GuestService,
    ) => {
      setActiveTab(
        "services",
      );

      setServiceSuccess(false);

      setSelectedServices(
        (previous) =>
          previous.includes(
            service.serviceId,
          )
            ? previous
            : [
                ...previous,
                service.serviceId,
              ],
      );

      setError("");

      window.requestAnimationFrame(
        () => {
          const target =
            document.getElementById(
              "guest-service-request",
            );

          target?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        },
      );
    };

  const goToBill = () => {
    setMoreView("bill");
    setActiveTab("more");
    setError("");
  };

  const goToStay = () => {
    setMoreView("overview");
    setActiveTab("more");
    setError("");
  };

  /* =======================================================
      LOADING STATE
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F0] p-4 sm:p-6">
        <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-[#E3E6DE] text-center w-full">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#356248]" />
            <p className="mt-3 text-xs font-medium text-[#294436]">
              Loading guest portal...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
      SESSION ERROR
  ======================================================= */

  if (
    error &&
    !context
  ) {
    return (
      <div className="min-h-screen bg-[#F7F6F0] px-5 py-12 text-[#2C4136]">
        <div className="mx-auto max-w-md">
          <div className="rounded-xl border border-[#E7D4C7] bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-[#FBF0E9] text-[#A2634B]">
              <X className="h-5 w-5" />
            </div>

            <h1 className="mt-4 text-sm font-medium text-[#294436]">
              Guest session unavailable
            </h1>

            <p className="mt-1 text-xs leading-5 text-[#859083]">
              {error}
            </p>

            <button
              type="button"
              onClick={() => {
                const bedToken =
                  getGuestBedToken();

                if (bedToken) {
                  navigate(
                    `/guest/access?bedToken=${encodeURIComponent(
                      bedToken,
                    )}`,
                    {
                      replace: true,
                    },
                  );
                } else {
                  navigate(
                    "/guest/access",
                    {
                      replace: true,
                    },
                  );
                }
              }}
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-4 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-[#295640]"
            >
              Enter Stay Code
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
      MAIN UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      <div className="mx-auto min-h-screen max-w-lg px-4 pb-32 pt-4 sm:px-5">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="overflow-hidden rounded-xl bg-[#1D4435] p-5 text-white shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>

                <p className="text-xs font-medium tracking-tight">
                  RoomEase
                </p>
              </div>

              <p className="mt-4 text-[9px] font-medium uppercase tracking-[0.12em] text-[#A3C1AD]">
                {activeTab ===
                "home"
                  ? "Guest Home"
                  : activeTab ===
                      "services"
                    ? "Guest Services"
                    : activeTab ===
                        "food"
                      ? "Food & Beverage"
                      : activeTab ===
                          "requests"
                        ? "Request Center"
                        : moreView ===
                            "bill"
                          ? "Stay Charges"
                          : "Your Stay"}
              </p>

              <h1 className="mt-0.5 truncate text-lg font-medium tracking-tight sm:text-xl">
                {activeTab ===
                "home"
                  ? `Hello${
                      context?.guestName
                        ? `, ${context.guestName.split(" ")[0]}`
                        : ""
                    } 👋`
                  : activeTab ===
                      "requests"
                    ? "Track your requests"
                    : activeTab ===
                        "services"
                      ? "What do you need?"
                      : activeTab ===
                          "food"
                        ? "Order something good"
                        : moreView ===
                            "bill"
                          ? "My Bill"
                          : "Your stay"}
              </h1>

              <p className="mt-1 text-xs text-white/80">
                {context?.propertyName ||
                  "RoomEase Property"}
                {" · "}
                Room {context?.roomNumber}
                {" · "}
                Bed {context?.bedNumber}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                void loadGuest();
              }}
              disabled={loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 transition hover:bg-white/20 disabled:opacity-50"
              aria-label="Refresh guest portal"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading
                    ? "animate-spin"
                    : ""
                }`}
              />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-white/15 bg-white/10 px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#A3C1AD]">
                {context?.guestName
                  ? "Guest"
                  : "Current stay"}
              </p>

              <p className="mt-0.5 truncate text-xs font-medium text-white">
                {context?.guestName ||
                  "Guest Portal"}
              </p>
            </div>

            <div
              className={`shrink-0 rounded-md px-2 py-0.5 text-[9px] font-medium ${
                context?.hasActiveGuest ===
                false
                  ? "bg-[#FBF0E9] text-[#A2634B]"
                  : "bg-[#E8EFE8] text-[#356248]"
              }`}
            >
              {context?.hasActiveGuest ===
              false
                ? "Stay inactive"
                : "Active stay"}
            </div>
          </div>
        </header>

        {/* =================================================
            GLOBAL ERROR
        ================================================= */}

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] p-3.5 text-xs text-[#8A624D]">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F7EEDC] text-[#9B712F]">
              <X className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-medium text-[#294436]">
                Something went wrong
              </p>

              <p className="mt-0.5 leading-4 text-[#859083]">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="rounded-lg p-1 text-[#A17255] hover:bg-white"
              aria-label="Dismiss error"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* =================================================
            HOME
        ================================================= */}

        {activeTab ===
          "home" && (
          <>
            {/* QUICK ACTIONS */}
            <section className="mt-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                    Quick actions
                  </p>

                  <h2 className="mt-0.5 text-base font-medium text-[#294436]">
                    How can we help?
                  </h2>

                  <p className="mt-0.5 text-xs text-[#859083]">
                    Tap a service to request it instantly.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      "services",
                    )
                  }
                  className="text-xs font-medium text-[#356248] hover:text-[#1D4435]"
                >
                  View all
                </button>
              </div>
            </section>

            <section className="mt-3 grid grid-cols-2 gap-3">
              {availableQuickServices.length >
              0 ? (
                availableQuickServices.map(
                  (
                    service,
                  ) => (
                    <button
                      key={
                        service.serviceId
                      }
                      type="button"
                      onClick={() =>
                        quickAction(
                          service,
                        )
                      }
                      className="group rounded-xl border border-[#E3E6DE] bg-white p-3.5 text-left shadow-sm transition hover:border-[#92AA92] hover:shadow"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8EFE8] text-[#356248] transition group-hover:bg-[#1D4435] group-hover:text-white">
                        {DEPARTMENT_META[
                          service.department
                        ]?.icon || (
                          <ConciergeBell className="h-4 w-4" />
                        )}
                      </div>

                      <p className="mt-3 line-clamp-2 text-xs font-medium text-[#294436]">
                        {service.name}
                      </p>

                      <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-[#859083]">
                        {service.description ||
                          DEPARTMENT_META[
                            service.department
                          ]?.description ||
                          "Property service"}
                      </p>

                      <div className="mt-3 flex items-center gap-1 text-[10px] font-medium text-[#55755A]">
                        Request
                        <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  ),
                )
              ) : (
                <div className="col-span-2 rounded-xl border border-dashed border-[#DFE4DA] bg-white p-6 text-center">
                  <ConciergeBell className="mx-auto h-7 w-7 text-[#7D887D]" />

                  <p className="mt-2 text-xs font-medium text-[#294436]">
                    No services available
                  </p>

                  <p className="mt-0.5 text-[11px] text-[#859083]">
                    No guest services are currently enabled.
                  </p>
                </div>
              )}
            </section>

            {/* SECONDARY QUICK ACTIONS */}
            <section className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  setActiveTab(
                    "food",
                  )
                }
                className="rounded-xl border border-[#E3E6DE] bg-white p-3 text-left shadow-sm"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F7EEDC] text-[#9B712F]">
                  <Utensils className="h-3.5 w-3.5" />
                </div>

                <p className="mt-2 text-xs font-medium text-[#294436]">
                  Food
                </p>

                <p className="mt-0.5 text-[10px] text-[#859083]">
                  Order now
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveTab(
                    "requests",
                  )
                }
                className="relative rounded-xl border border-[#E3E6DE] bg-white p-3 text-left shadow-sm"
              >
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#EDF1F3] text-[#5C7180]">
                  <Clock3 className="h-3.5 w-3.5" />

                  {openRequestCount >
                    0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#A2634B] px-1 text-[8px] font-medium text-white">
                      {openRequestCount}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs font-medium text-[#294436]">
                  Requests
                </p>

                <p className="mt-0.5 text-[10px] text-[#859083]">
                  Track status
                </p>
              </button>

              <button
                type="button"
                onClick={goToBill}
                className="rounded-xl border border-[#E3E6DE] bg-white p-3 text-left shadow-sm"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
                  <FileText className="h-3.5 w-3.5" />
                </div>

                <p className="mt-2 text-xs font-medium text-[#294436]">
                  Bill
                </p>

                <p className="mt-0.5 truncate text-[10px] text-[#859083]">
                  {money(
                    billTotal,
                  )}
                </p>
              </button>
            </section>

            {/* ACTIVE REQUESTS */}
            <section className="mt-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                    Live updates
                  </p>

                  <h2 className="mt-0.5 text-sm font-medium text-[#294436]">
                    Active requests
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      "requests",
                    )
                  }
                  className="text-xs font-medium text-[#356248] hover:text-[#1D4435]"
                >
                  See all
                </button>
              </div>

              {activeRequests.length ===
              0 ? (
                <div className="mt-2.5 rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8EFE8] text-[#356248]">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs font-medium text-[#294436]">
                        You're all caught up
                      </p>

                      <p className="mt-0.5 text-[11px] text-[#859083]">
                        No active requests right now.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2.5 space-y-2.5">
                  {activeRequests.map(
                    (item) => (
                      <RequestMiniCard
                        key={
                          item.taskId
                        }
                        item={
                          item
                        }
                        onClick={() =>
                          setActiveTab(
                            "requests",
                          )
                        }
                      />
                    ),
                  )}
                </div>
              )}
            </section>

            {/* STAY SNAPSHOT */}
            <section className="mt-5">
              <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
                    <KeyRound className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                      Your stay
                    </p>

                    <p className="mt-0.5 truncate text-xs font-medium text-[#294436]">
                      {context?.propertyName ||
                        "RoomEase Property"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={goToStay}
                    className="shrink-0 text-xs font-medium text-[#356248] hover:text-[#1D4435]"
                  >
                    View
                  </button>
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-2">
                  <StayInfo
                    label="Room"
                    value={
                      context?.roomNumber ||
                      "—"
                    }
                  />

                  <StayInfo
                    label="Bed"
                    value={
                      context?.bedNumber ||
                      "—"
                    }
                  />
                </div>
              </div>
            </section>

            {/* RECENT ACTIVITY */}
            <section className="mt-5">
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                  Recent activity
                </p>

                <h2 className="mt-0.5 text-sm font-medium text-[#294436]">
                  Your latest updates
                </h2>
              </div>

              {recentRequests.length ===
              0 ? (
                <div className="mt-2.5 rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-[#294436]">
                    No activity yet
                  </p>

                  <p className="mt-0.5 text-[11px] text-[#859083]">
                    Your requests and food orders will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-2.5 overflow-hidden rounded-xl border border-[#E3E6DE] bg-white shadow-sm">
                  {recentRequests.map(
                    (
                      item,
                      index,
                    ) => (
                      <button
                        key={
                          item.taskId
                        }
                        type="button"
                        onClick={() =>
                          setActiveTab(
                            "requests",
                          )
                        }
                        className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[#FAFBF7] ${
                          index !==
                          recentRequests.length -
                            1
                            ? "border-b border-[#EEF0E9]"
                            : ""
                        }`}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
                          {item.title
                            .toLowerCase()
                            .includes(
                              "food",
                            ) ? (
                            <Utensils className="h-4 w-4" />
                          ) : (
                            <ConciergeBell className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-[#294436]">
                            {item.title}
                          </p>

                          {item.createdAt && (
                            <p className="mt-0.5 text-[10px] text-[#8C9782]">
                              {formatDate(
                                item.createdAt,
                              )}
                            </p>
                          )}
                        </div>

                        <span
                          className={`shrink-0 rounded-md border px-2 py-0.5 text-[9px] font-medium ${statusClasses(
                            item.status,
                          )}`}
                        >
                          {statusLabel(
                            item.status,
                          )}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {/* =================================================
            SERVICES
        ================================================= */}

        {activeTab ===
          "services" && (
          <section className="mt-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
                  Guest services
                </p>

                <h2 className="mt-0.5 text-base font-medium text-[#294436]">
                  What do you need?
                </h2>

                <p className="mt-0.5 text-xs text-[#859083]">
                  Select one or more services and send your request.
                </p>
              </div>

              {selectedItems.length >
                0 && (
                <div className="shrink-0 rounded-md bg-[#1D4435] px-2.5 py-1 text-[10px] font-medium text-white">
                  {selectedItems.length}{" "}
                  selected
                </div>
              )}
            </div>

            {servicesLoading ? (
              <LoadingCard text="Loading available services…" />
            ) : services.length ===
              0 ? (
              <EmptyCard
                icon={
                  <ConciergeBell className="mx-auto h-7 w-7 text-[#7D887D]" />
                }
                title="No services available"
                description="There are currently no guest services enabled for your property."
              />
            ) : (
              <div className="mt-4 space-y-5">
                {SERVICE_DEPARTMENTS.map(
                  (department) => {
                    const items =
                      groupedServices[
                        department
                      ];

                    if (
                      items.length ===
                      0
                    ) {
                      return null;
                    }

                    const departmentInfo =
                      DEPARTMENT_META[
                        department
                      ];

                    const isExpanded =
                      expandedDepartments[
                        department
                      ] !==
                      false;

                    return (
                      <section
                        key={
                          department
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            toggleDepartment(
                              department,
                            )
                          }
                          className="mb-2.5 flex w-full items-center gap-2.5 text-left"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#356248] shadow-sm ring-1 ring-[#E3E6DE]">
                            {
                              departmentInfo.icon
                            }
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs font-medium text-[#294436]">
                              {
                                departmentInfo.label
                              }
                            </h3>

                            <p className="text-[11px] text-[#859083]">
                              {
                                departmentInfo.description
                              }
                            </p>
                          </div>

                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#7D887D] ring-1 ring-[#E3E6DE]">
                            {isExpanded ? (
                              <span className="text-xs font-medium">
                                −
                              </span>
                            ) : (
                              <span className="text-xs font-medium">
                                +
                              </span>
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="grid grid-cols-2 gap-2.5">
                            {items.map(
                              (
                                service,
                              ) => {
                                const selected =
                                  selectedServices.includes(
                                    service.serviceId,
                                  );

                                return (
                                  <button
                                    key={
                                      service.serviceId
                                    }
                                    type="button"
                                    onClick={() =>
                                      toggleService(
                                        service.serviceId,
                                      )
                                    }
                                    className={`group relative min-h-[130px] rounded-xl border p-3.5 text-left transition ${
                                      selected
                                        ? "border-[#1D4435] bg-[#1D4435] text-white shadow-sm"
                                        : "border-[#E3E6DE] bg-white text-[#2C4136] shadow-sm hover:border-[#92AA92]"
                                    }`}
                                  >
                                    {/* CHECK */}
                                    <div
                                      className={`absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full ${
                                        selected
                                          ? "bg-white text-[#1D4435]"
                                          : "border border-[#DFE4DA] bg-[#F7F6F0]/50 text-transparent"
                                      }`}
                                    >
                                      <Check className="h-3 w-3" />
                                    </div>

                                    {/* ICON */}
                                    <div
                                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                        selected
                                          ? "bg-white/15 text-white"
                                          : "bg-[#F2F4EC] text-[#55755A]"
                                      }`}
                                    >
                                      {
                                        departmentInfo.icon
                                      }
                                    </div>

                                    {/* TEXT */}
                                    <div className="mt-3 pr-4">
                                      <p className="line-clamp-2 text-xs font-medium">
                                        {
                                          service.name
                                        }
                                      </p>

                                      {service.description && (
                                        <p
                                          className={`mt-0.5 line-clamp-2 text-[10px] leading-4 ${
                                            selected
                                              ? "text-white/80"
                                              : "text-[#859083]"
                                          }`}
                                        >
                                          {
                                            service.description
                                          }
                                        </p>
                                      )}
                                    </div>

                                    {/* SELECTED */}
                                    {selected && (
                                      <div className="mt-2.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[#A3C1AD]">
                                        Selected
                                      </div>
                                    )}
                                  </button>
                                );
                              },
                            )}
                          </div>
                        )}
                      </section>
                    );
                  },
                )}
              </div>
            )}

            {/* =================================================
                SELECTED SERVICES
            ================================================= */}

            {selectedItems.length >
              0 && (
              <section
                id="guest-service-request"
                className="sticky bottom-[4.75rem] z-20 mt-5 overflow-hidden rounded-xl border border-[#E3E6DE] bg-white shadow-xl"
              >
                {/* SUMMARY */}
                <div className="flex items-center justify-between gap-3 border-b border-[#EEF0E9] bg-[#F7F6F0]/60 px-4 py-3">
                  <div>
                    <p className="text-xs font-medium text-[#294436]">
                      Ready to request
                    </p>

                    <p className="mt-0.5 text-[11px] text-[#859083]">
                      {
                        selectedItems.length
                      }{" "}
                      service
                      {selectedItems.length !==
                      1
                        ? "s"
                        : ""}{" "}
                      selected
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedServices(
                        [],
                      );
                      setDetails("");
                      setDetailsFocused(
                        false,
                      );
                      setServiceSuccess(
                        false,
                      );
                    }}
                    className="rounded-lg px-2.5 py-1 text-xs font-medium text-[#A2634B] hover:bg-[#FBF0E9]"
                  >
                    Clear
                  </button>
                </div>

                {/* CHIPS */}
                <div className="flex flex-wrap gap-1.5 px-4 pt-3.5">
                  {selectedItems.map(
                    (service) => {
                      const maintenance =
                        service.department ===
                        "Maintenance";

                      const it =
                        service.department ===
                        "IT";

                      return (
                        <button
                          key={
                            service.serviceId
                          }
                          type="button"
                          onClick={() =>
                            toggleService(
                              service.serviceId,
                            )
                          }
                          className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition ${
                            maintenance
                              ? "bg-[#F7EEDC] text-[#9B712F]"
                              : it
                                ? "bg-[#EDF1F3] text-[#5C7180]"
                                : "bg-[#E8EFE8] text-[#356248]"
                          }`}
                        >
                          {
                            service.name
                          }

                          <span className="ml-1 opacity-60">
                            ×
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>

                {/* NOTE */}
                <div className="px-4 pt-3.5">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label
                      htmlFor="guest-service-note"
                      className="text-xs font-medium text-[#304B35]"
                    >
                      {needsDetailedDescription
                        ? "Tell us what happened"
                        : "Add a note"}
                    </label>

                    <span className="text-[10px] text-[#8C9782]">
                      Optional
                    </span>
                  </div>

                  {needsDetailedDescription && (
                    <div className="mb-2.5 rounded-lg border border-[#F7EEDC] bg-[#F7EEDC]/60 px-3 py-2.5 text-[11px] leading-4 text-[#9B712F]">
                      A little more detail helps the property team resolve the issue faster.
                    </div>
                  )}

                  <div
                    className={`rounded-lg border bg-[#F7F6F0]/50 transition ${
                      detailsFocused
                        ? "border-[#92AA92] bg-white ring-4 ring-[#E3EADF]"
                        : "border-[#DFE4DA]"
                    }`}
                  >
                    <textarea
                      id="guest-service-note"
                      value={details}
                      onFocus={() =>
                        setDetailsFocused(
                          true,
                        )
                      }
                      onBlur={() =>
                        setDetailsFocused(
                          false,
                        )
                      }
                      onChange={(
                        event,
                      ) =>
                        setDetails(
                          event.target
                            .value,
                        )
                      }
                      rows={3}
                      maxLength={500}
                      placeholder={
                        detailPlaceholder
                      }
                      className="w-full resize-none rounded-lg bg-transparent px-3 py-2.5 text-xs leading-5 text-[#36503E] outline-none placeholder:text-[#8C9782]"
                    />

                    <div className="flex items-center justify-between border-t border-[#EEF0E9] px-3 py-1.5 text-[10px] text-[#8C9782]">
                      <p>
                        {needsDetailedDescription
                          ? "Describe the problem clearly"
                          : "You can add timing or instructions"}
                      </p>

                      <p>
                        {details.length}/500
                      </p>
                    </div>
                  </div>
                </div>

                {/* SUBMIT */}
                <div className="p-4">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={
                      submitServices
                    }
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-4 py-3 text-xs font-medium text-white shadow-sm transition hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Sending request…
                      </>
                    ) : (
                      <>
                        Request{" "}
                        {
                          selectedItems.length
                        }{" "}
                        service
                        {selectedItems.length !==
                        1
                          ? "s"
                          : ""}{" "}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </section>
            )}

            {/* SUCCESS */}
            {serviceSuccess && (
              <SuccessCard
                title="Request sent successfully"
                description="Your selected services have been sent to the property team."
                buttonLabel="Track my request"
                onClick={() => {
                  setServiceSuccess(
                    false,
                  );
                  setActiveTab(
                    "requests",
                  );
                }}
              />
            )}
          </section>
        )}

        {/* =================================================
            FOOD
        ================================================= */}

        {activeTab ===
          "food" && (
          <section className="mt-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#9B712F]">
                  Food & Beverage
                </p>

                <h2 className="mt-0.5 text-base font-medium text-[#294436]">
                  What would you like?
                </h2>

                <p className="mt-0.5 text-xs text-[#859083]">
                  Choose your food and place an order directly from your room.
                </p>
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F7EEDC] text-[#9B712F]">
                <Utensils className="h-4 w-4" />
              </div>
            </div>

            {menuLoading ? (
              <LoadingCard text="Loading today's menu…" />
            ) : menu.length ===
              0 ? (
              <EmptyCard
                icon={
                  <Utensils className="mx-auto h-7 w-7 text-[#7D887D]" />
                }
                title="Menu unavailable"
                description="No food items are currently available."
              />
            ) : (
              <>
                {/* MENU */}
                <div className="mt-4 space-y-2.5">
                  {menu.map(
                    (item) => {
                      const quantity =
                        cart[
                          item.menuItemId
                        ] || 0;

                      return (
                        <div
                          key={
                            item.menuItemId
                          }
                          className="rounded-xl border border-[#E3E6DE] bg-white p-3.5 shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
                              <ShoppingBag className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  {item.category && (
                                    <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                                      {
                                        item.category
                                      }
                                    </p>
                                  )}

                                  <h3 className="mt-0.5 text-xs font-medium text-[#294436]">
                                    {
                                      item.name
                                    }
                                  </h3>
                                </div>

                                <p className="shrink-0 text-xs font-medium text-[#294436]">
                                  {money(
                                    item.price,
                                  )}
                                </p>
                              </div>

                              <div className="mt-3 flex items-center justify-between">
                                <span className="text-[11px] text-[#859083]">
                                  Quantity
                                </span>

                                <div className="flex items-center gap-1.5 rounded-lg border border-[#DFE4DA] p-0.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateCart(
                                        item.menuItemId,
                                        quantity -
                                          1,
                                      )
                                    }
                                    className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F7F6F0] text-[#40543E] transition hover:bg-[#E3E6DE]"
                                    aria-label={`Decrease ${item.name}`}
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>

                                  <span className="w-6 text-center text-xs font-medium text-[#294436]">
                                    {
                                      quantity
                                    }
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateCart(
                                        item.menuItemId,
                                        quantity +
                                          1,
                                      )
                                    }
                                    className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1D4435] text-white"
                                    aria-label={`Increase ${item.name}`}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>

                {/* CART */}
                {cartItems.length >
                  0 && (
                  <section className="mt-4 overflow-hidden rounded-xl border border-[#E3E6DE] bg-white shadow-sm">
                    <div className="border-b border-[#EEF0E9] bg-[#F7F6F0]/60 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-[#294436]">
                            Your order
                          </p>

                          <p className="mt-0.5 text-[11px] text-[#859083]">
                            {
                              cartItemCount
                            }{" "}
                            item
                            {cartItemCount !==
                            1
                              ? "s"
                              : ""}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setCart(
                              {},
                            )
                          }
                          className="text-xs font-medium text-[#A2634B]"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5 p-4">
                      {cartItems.map(
                        (
                          entry,
                        ) => (
                          <div
                            key={
                              entry.item
                                .menuItemId
                            }
                            className="flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[#294436]">
                                {
                                  entry
                                    .item
                                    .name
                                }
                              </p>

                              <p className="mt-0.5 text-[11px] text-[#859083]">
                                {
                                  entry.quantity
                                }{" "}
                                ×{" "}
                                {money(
                                  entry
                                    .item
                                    .price,
                                )}
                              </p>
                            </div>

                            <p className="shrink-0 font-medium text-[#294436]">
                              {money(
                                Number(
                                  entry
                                    .item
                                    .price ||
                                    0,
                                ) *
                                  entry.quantity,
                              )}
                            </p>
                          </div>
                        ),
                      )}
                    </div>

                    <div className="border-t border-[#EEF0E9] px-4 py-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#304B35]">
                          Total
                        </span>

                        <span className="text-sm font-medium text-[#294436]">
                          {money(
                            cartTotal,
                          )}
                        </span>
                      </div>

                      <div className="mt-3.5">
                        <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                          Payment
                        </p>

                        <div className="mt-1.5 grid grid-cols-2 gap-2">
                          <PaymentOption
                            label="Cash"
                            selected={
                              paymentMode ===
                              "Cash"
                            }
                            onClick={() =>
                              setPaymentMode(
                                "Cash",
                              )
                            }
                          />

                          <PaymentOption
                            label="Add to Bill"
                            selected={
                              paymentMode ===
                              "AddToBill"
                            }
                            onClick={() =>
                              setPaymentMode(
                                "AddToBill",
                              )
                            }
                          />
                        </div>

                        {paymentMode ===
                          "AddToBill" && (
                          <div className="mt-2.5 rounded-lg border border-[#F7EEDC] bg-[#F7EEDC]/60 p-3 text-[11px] leading-4 text-[#9B712F]">
                            This order will be added to your current stay charges.
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={
                          ordering
                        }
                        onClick={
                          submitOrder
                        }
                        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-4 py-3 text-xs font-medium text-white shadow-sm transition hover:bg-[#295640] disabled:opacity-50"
                      >
                        {ordering ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Placing order…
                          </>
                        ) : (
                          <>
                            Place order
                            <ArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </section>
                )}

                {orderSuccess && (
                  <SuccessCard
                    title="Order placed successfully"
                    description="Your food order has been sent to the property team."
                    buttonLabel="Track order"
                    onClick={() => {
                      setOrderSuccess(
                        false,
                      );
                      setActiveTab(
                        "requests",
                      );
                    }}
                  />
                )}
              </>
            )}
          </section>
        )}

        {/* =================================================
            REQUESTS
        ================================================= */}

        {activeTab ===
          "requests" && (
          <section className="mt-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
                  Request center
                </p>

                <h2 className="mt-0.5 text-base font-medium text-[#294436]">
                  My Requests
                </h2>

                <p className="mt-0.5 text-xs text-[#859083]">
                  Track your services and food orders in one place.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  void loadGuestRequests();
                  void loadTracking();
                }}
                disabled={
                  requestsLoading ||
                  trackingLoading
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E3E6DE] bg-white text-[#40543E] shadow-sm hover:bg-[#F2F4EC]"
                title="Refresh requests"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    requestsLoading ||
                    trackingLoading
                      ? "animate-spin"
                      : ""
                  }`}
                />
              </button>
            </div>

            {requests.length >
              0 && (
              <div className="mt-3.5 flex items-center justify-between rounded-xl border border-[#E3E6DE] bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EDF1F3] text-[#5C7180]">
                    <Clock3 className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-[#294436]">
                      {openRequestCount >
                      0
                        ? `${openRequestCount} active request${
                            openRequestCount !==
                            1
                              ? "s"
                              : ""
                          }`
                        : "No active requests"}
                    </p>

                    <p className="mt-0.5 text-[10px] text-[#8C9782]">
                      Updates refresh automatically
                    </p>
                  </div>
                </div>

                {trackingLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7D887D]" />
                )}
              </div>
            )}

            {requestsLoading ? (
              <LoadingCard text="Loading your requests…" />
            ) : requests.length ===
              0 ? (
              <EmptyCard
                icon={
                  <Clock3 className="mx-auto h-7 w-7 text-[#7D887D]" />
                }
                title="No requests yet"
                description="Your service requests and food orders will appear here."
                buttonLabel="Request a service"
                onClick={() =>
                  setActiveTab(
                    "services",
                  )
                }
              />
            ) : (
              <div className="mt-3.5 space-y-3">
                {requests.map(
                  (item) => {
                    const normalized =
                      normalizeStatus(
                        item.status,
                      );

                    const completed =
                      normalized ===
                      "completed";

                    const cancelled =
                      normalized ===
                        "cancelled" ||
                      normalized ===
                        "canceled";

                    let currentStage = 1;

                    if (
                      completed
                    ) {
                      currentStage = 4;
                    } else if (
                      normalized ===
                      "inprogress"
                    ) {
                      currentStage = 3;
                    } else if (
                      item.assignedStaffName
                    ) {
                      currentStage = 2;
                    }

                    if (
                      cancelled
                    ) {
                      currentStage = 1;
                    }

                    return (
                      <article
                        key={
                          item.taskId
                        }
                        className="overflow-hidden rounded-xl border border-[#E3E6DE] bg-white shadow-sm"
                      >
                        {/* CARD HEADER */}
                        <div className="border-b border-[#EEF0E9] p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                cancelled
                                  ? "bg-[#FBF0E9] text-[#A2634B]"
                                  : completed
                                    ? "bg-[#E8EFE8] text-[#356248]"
                                    : "bg-[#EDF1F3] text-[#5C7180]"
                              }`}
                            >
                              {item.title
                                .toLowerCase()
                                .includes(
                                  "food",
                                ) ? (
                                <Utensils className="h-4 w-4" />
                              ) : (
                                <ConciergeBell className="h-4 w-4" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="truncate text-xs font-medium text-[#294436]">
                                    {
                                      item.title
                                    }
                                  </h3>

                                  {item.createdAt && (
                                    <p className="mt-0.5 text-[10px] text-[#8C9782]">
                                      Requested{" "}
                                      {formatDate(
                                        item.createdAt,
                                      )}
                                    </p>
                                  )}
                                </div>

                                <span
                                  className={`shrink-0 rounded-md border px-2 py-0.5 text-[9px] font-medium ${statusClasses(
                                    item.status,
                                  )}`}
                                >
                                  {statusLabel(
                                    item.status,
                                  )}
                                </span>
                              </div>

                              {item.description && (
                                <p className="mt-2.5 rounded-lg bg-[#F7F6F0]/60 px-3 py-2 text-xs leading-5 text-[#40543E]">
                                  {
                                    item.description
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* PROGRESS */}
                        {!cancelled ? (
                          <div className="p-4">
                            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                              Service progress
                            </p>

                            <div className="mt-3">
                              <RequestTimeline
                                currentStage={
                                  currentStage
                                }
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="p-4">
                            <div className="rounded-lg border border-[#E7D4C7] bg-[#FBF0E9] p-3.5">
                              <div className="flex items-start gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F7EEDC] text-[#A2634B]">
                                  <X className="h-3.5 w-3.5" />
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-[#8A624D]">
                                    Request cancelled
                                  </p>

                                  <p className="mt-0.5 text-[11px] text-[#A17255]">
                                    This request is no longer active.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* STAFF */}
                        {item.assignedStaffName &&
                          !cancelled && (
                            <div className="mx-4 mb-3 rounded-lg border border-[#E3E6DE] bg-[#F7F6F0]/60 p-3">
                              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                                Assigned staff
                              </p>

                              <p className="mt-0.5 text-xs font-medium text-[#294436]">
                                {
                                  item.assignedStaffName
                                }
                              </p>

                              {normalized ===
                                "inprogress" && (
                                <p className="mt-0.5 text-[10px] text-[#5C7180]">
                                  Your request is currently being handled.
                                </p>
                              )}
                            </div>
                          )}

                        {/* COMPLETED */}
                        {completed && (
                          <div className="mx-4 mb-3 rounded-lg border border-[#D5E2D5] bg-[#E8EFE8] p-3">
                            <div className="flex items-start gap-2.5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#356248] shadow-sm">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </div>

                              <div>
                                <p className="text-xs font-medium text-[#356248]">
                                  Service completed
                                </p>

                                {item.completedAt && (
                                  <p className="mt-0.5 text-[10px] text-[#356248]/80">
                                    Completed{" "}
                                    {formatDate(
                                      item.completedAt,
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ACTIONS */}
                        <div className="p-4 pt-0">
                          {item.canCancel &&
                            !completed &&
                            !cancelled && (
                              <button
                                type="button"
                                disabled={
                                  cancellingTaskId ===
                                  item.taskId
                                }
                                onClick={() =>
                                  void cancelRequest(
                                    item.taskId,
                                  )
                                }
                                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#E7D4C7] bg-[#FBF0E9] px-3.5 py-2.5 text-xs font-medium text-[#A2634B] transition hover:bg-[#F7EEDC] disabled:opacity-50"
                              >
                                {cancellingTaskId ===
                                item.taskId ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Cancelling…
                                  </>
                                ) : (
                                  <>
                                    <X className="h-3.5 w-3.5" />
                                    Cancel Request
                                  </>
                                )}
                              </button>
                            )}

                          {!item.canCancel &&
                            !completed &&
                            !cancelled && (
                              <p className="text-center text-[10px] text-[#859083]">
                                This request can no longer be cancelled.
                              </p>
                            )}

                          {completed &&
                            item.rating ==
                              null &&
                            item.guestTrackingToken && (
                              <button
                                type="button"
                                onClick={() =>
                                  openRating(
                                    item.guestTrackingToken!,
                                  )
                                }
                                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#F7EEDC] bg-[#F7EEDC] px-3.5 py-2.5 text-xs font-medium text-[#9B712F] transition hover:bg-[#F2E5CE]"
                              >
                                <Star className="h-3.5 w-3.5" />
                                Rate this service
                              </button>
                            )}

                          {item.rating !=
                            null && (
                            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-[#E8EFE8] px-3.5 py-2.5 text-xs font-medium text-[#356248]">
                              <Star className="h-3.5 w-3.5 fill-current text-[#9B712F]" />
                              <span>
                                You rated this service{" "}
                                {
                                  item.rating
                                }
                                /5
                              </span>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            )}

            {/* OLD TRACKING FALLBACK */}
            {trackingItems.length >
              0 && (
              <section className="mt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                      Tracking
                    </p>

                    <h3 className="mt-0.5 text-xs font-medium text-[#294436]">
                      Recent task updates
                    </h3>
                  </div>

                  {trackingLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7D887D]" />
                  )}
                </div>

                <div className="mt-2.5 space-y-2.5">
                  {trackingItems.map(
                    (
                      item,
                    ) => (
                      <div
                        key={
                          item.trackingToken
                        }
                        className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
                            {item.title
                              .toLowerCase()
                              .includes(
                                "food",
                              ) ? (
                              <Utensils className="h-4 w-4" />
                            ) : (
                              <ConciergeBell className="h-4 w-4" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="truncate text-xs font-medium text-[#294436]">
                                {
                                  item.title
                                }
                              </h4>

                              <span
                                className={`shrink-0 rounded-md border px-2 py-0.5 text-[9px] font-medium ${statusClasses(
                                  item.status,
                                )}`}
                              >
                                {statusLabel(
                                  item.status,
                                )}
                              </span>
                            </div>

                            {item.assignedStaffName && (
                              <p className="mt-1 text-[11px] text-[#859083]">
                                Staff:{" "}
                                <span className="font-medium text-[#294436]">
                                  {
                                    item.assignedStaffName
                                  }
                                </span>
                              </p>
                            )}

                            {item.createdAt && (
                              <p className="mt-0.5 text-[10px] text-[#8C9782]">
                                Created{" "}
                                {formatDate(
                                  item.createdAt,
                                )}
                              </p>
                            )}

                            {item.completedAt && (
                              <p className="mt-0.5 text-[10px] text-[#8C9782]">
                                Completed{" "}
                                {formatDate(
                                  item.completedAt,
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        {normalizeStatus(
                          item.status,
                        ) ===
                          "completed" &&
                          item.rating ==
                            null && (
                            <button
                              type="button"
                              onClick={() =>
                                openRating(
                                  item.trackingToken,
                                )
                              }
                              className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#F7EEDC] bg-[#F7EEDC] px-3.5 py-2.5 text-xs font-medium text-[#9B712F]"
                            >
                              <Star className="h-3.5 w-3.5" />
                              Rate this task
                            </button>
                          )}

                        {item.rating !=
                          null && (
                          <div className="mt-3.5 flex items-center gap-1.5 rounded-lg bg-[#E8EFE8] px-3 py-2 text-xs font-medium text-[#356248]">
                            <Star className="h-3.5 w-3.5 fill-current text-[#9B712F]" />

                            <span>
                              Rated{" "}
                              {
                                item.rating
                              }
                              /5
                            </span>
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </section>
            )}
          </section>
        )}

        {/* =================================================
            MORE
        ================================================= */}

        {activeTab ===
          "more" && (
          <section className="mt-5">
            {moreView ===
            "overview" ? (
              <>
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
                    Your stay
                  </p>

                  <h2 className="mt-0.5 text-base font-medium text-[#294436]">
                    More
                  </h2>

                  <p className="mt-0.5 text-xs text-[#859083]">
                    Stay information, billing and access details.
                  </p>
                </div>

                {/* BILL */}
                <button
                  type="button"
                  onClick={
                    goToBill
                  }
                  className="mt-4 flex w-full items-center gap-3.5 rounded-xl border border-[#E3E6DE] bg-white p-4 text-left shadow-sm transition hover:border-[#92AA92]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
                    <FileText className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium text-[#294436]">
                        My Bill
                      </p>

                      <span className="text-xs font-medium text-[#294436]">
                        {money(
                          billTotal,
                        )}
                      </span>
                    </div>

                    <p className="mt-0.5 text-[11px] text-[#859083]">
                      View pending stay charges
                    </p>
                  </div>

                  <ArrowRight className="h-4 w-4 shrink-0 text-[#7D887D]" />
                </button>

                {/* STAY */}
                <div className="mt-3.5 rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
                      <HomeIcon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#294436]">
                        My Stay
                      </p>

                      <p className="mt-0.5 text-[11px] text-[#859083]">
                        Current room and property details
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <StayInfo
                      label="Property"
                      value={
                        context?.propertyName ||
                        "—"
                      }
                    />

                    <StayInfo
                      label="Room"
                      value={
                        context?.roomNumber ||
                        "—"
                      }
                    />

                    <StayInfo
                      label="Bed"
                      value={
                        context?.bedNumber ||
                        "—"
                      }
                    />

                    <StayInfo
                      label="Guest"
                      value={
                        context?.guestName ||
                        "—"
                      }
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-lg bg-[#F7F6F0]/60 px-3 py-2.5 text-xs border border-[#E3E6DE]">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-3.5 w-3.5 text-[#7D887D]" />

                      <span className="font-medium text-[#304B35]">
                        RoomEase guest access
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-medium ${
                        context?.hasActiveGuest ===
                        false
                          ? "text-[#A2634B]"
                          : "text-[#356248]"
                      }`}
                    >
                      {context?.hasActiveGuest ===
                      false
                        ? "Inactive"
                        : "Connected"}
                    </span>
                  </div>
                </div>

                {/* SECURITY */}
                <div className="mt-3.5 rounded-xl border border-[#D5E2D5] bg-[#E8EFE8] p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#356248]" />

                    <div>
                      <p className="text-xs font-medium text-[#356248]">
                        Secure guest access
                      </p>

                      <p className="mt-0.5 text-[11px] leading-4 text-[#356248]/90">
                        Your portal is connected to the current RoomEase guest session for your stay.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* BACK */}
                <button
                  type="button"
                  onClick={() =>
                    setMoreView(
                      "overview",
                    )
                  }
                  className="flex items-center gap-1.5 text-xs font-medium text-[#55755A] hover:text-[#1D4435]"
                >
                  <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                  Back
                </button>

                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
                      Stay charges
                    </p>

                    <h2 className="mt-0.5 text-base font-medium text-[#294436]">
                      My Bill
                    </h2>

                    <p className="mt-0.5 text-xs text-[#859083]">
                      Pending Add to Bill charges for your current stay.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void loadBill()
                    }
                    disabled={
                      billLoading
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E3E6DE] bg-white text-[#40543E] shadow-sm hover:bg-[#F2F4EC]"
                    title="Refresh bill"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        billLoading
                          ? "animate-spin"
                          : ""
                      }`}
                    />
                  </button>
                </div>

                {billLoading ? (
                  <LoadingCard text="Loading your bill…" />
                ) : (
                  <>
                    <div className="mt-3.5 rounded-xl bg-[#1D4435] p-4 text-white shadow-sm">
                      <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#A3C1AD]">
                        Current total
                      </p>

                      <p className="mt-1 text-2xl font-medium tracking-tight">
                        {money(
                          billTotal,
                        )}
                      </p>

                      <p className="mt-1 text-[11px] text-white/80">
                        This includes pending Add to Bill charges.
                      </p>
                    </div>

                    {billItems.length ===
                    0 ? (
                      <EmptyCard
                        icon={
                          <ShoppingBag className="mx-auto h-7 w-7 text-[#7D887D]" />
                        }
                        title="No pending charges"
                        description="Your pending charges will appear here."
                      />
                    ) : (
                      <div className="mt-3.5 space-y-2.5">
                        {billItems.map(
                          (
                            item,
                            index,
                          ) => (
                            <div
                              key={
                                item.id ||
                                item.chargeId ||
                                `bill-${index}`
                              }
                              className="rounded-xl border border-[#E3E6DE] bg-white p-3.5 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="text-xs font-medium text-[#294436]">
                                    {item.description ||
                                      item.title ||
                                      "Guest charge"}
                                  </h3>

                                  {item.createdAt && (
                                    <p className="mt-0.5 text-[10px] text-[#8C9782]">
                                      {formatDate(
                                        item.createdAt,
                                      )}
                                    </p>
                                  )}
                                </div>

                                <p className="shrink-0 text-xs font-medium text-[#294436]">
                                  {money(
                                    item.amount,
                                  )}
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </section>
        )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="mt-8 text-center text-[10px] text-[#8C9782]">
          RoomEase Guest Portal
        </footer>
      </div>

      {/* =================================================
          BOTTOM NAV
      ================================================= */}

      <nav className="fixed bottom-3 left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-[#E3E6DE] bg-white/95 p-1 shadow-lg backdrop-blur">
        <div className="grid grid-cols-5 gap-1">
          <BottomNavButton
            label="Home"
            icon={
              <HomeIcon className="h-4 w-4" />
            }
            active={
              activeTab ===
              "home"
            }
            onClick={() =>
              setActiveTab(
                "home",
              )
            }
          />

          <BottomNavButton
            label="Services"
            icon={
              <Sparkles className="h-4 w-4" />
            }
            active={
              activeTab ===
              "services"
            }
            onClick={() =>
              setActiveTab(
                "services",
              )
            }
          />

          <BottomNavButton
            label="Food"
            icon={
              <Utensils className="h-4 w-4" />
            }
            active={
              activeTab ===
              "food"
            }
            badge={
              cartItemCount >
              0
                ? cartItemCount
                : undefined
            }
            onClick={() =>
              setActiveTab(
                "food",
              )
            }
          />

          <BottomNavButton
            label="Requests"
            icon={
              <Clock3 className="h-4 w-4" />
            }
            active={
              activeTab ===
              "requests"
            }
            badge={
              openRequestCount >
              0
                ? openRequestCount
                : undefined
            }
            onClick={() =>
              setActiveTab(
                "requests",
              )
            }
          />

          <BottomNavButton
            label="More"
            icon={
              <MenuIcon className="h-4 w-4" />
            }
            active={
              activeTab ===
              "more"
            }
            onClick={() => {
              setMoreView(
                "overview",
              );
              setActiveTab(
                "more",
              );
            }}
          />
        </div>
      </nav>

      {/* =================================================
          RATING MODAL
      ================================================= */}

      {ratingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl border border-[#E3E6DE]">
            <div className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-[#F7EEDC] text-[#9B712F]">
                <Star className="h-5 w-5 fill-current" />
              </div>

              <h2 className="mt-3 text-sm font-medium text-[#294436]">
                Rate your service
              </h2>

              <p className="mt-0.5 text-xs text-[#859083]">
                How was your experience?
              </p>
            </div>

            <div className="mt-5 flex items-center justify-center gap-1">
              {[
                1,
                2,
                3,
                4,
                5,
              ].map(
                (rating) => (
                  <button
                    key={
                      rating
                    }
                    type="button"
                    onClick={() =>
                      setSelectedRating(
                        rating,
                      )
                    }
                    className="rounded-lg p-1.5 transition hover:bg-[#F7EEDC]"
                    aria-label={`Rate ${rating} out of 5`}
                  >
                    <Star
                      className={`h-7 w-7 ${
                        rating <=
                        selectedRating
                          ? "fill-current text-[#9B712F]"
                          : "text-[#DFE4DA]"
                      }`}
                    />
                  </button>
                ),
              )}
            </div>

            <p className="mt-2 text-center text-xs font-medium text-[#7D887D]">
              {selectedRating
                ? `${selectedRating}/5`
                : "Select a rating"}
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={
                  closeRating
                }
                disabled={
                  ratingSubmitting
                }
                className="flex-1 rounded-lg border border-[#E3E6DE] px-3.5 py-2 text-xs font-medium text-[#55755A] hover:bg-[#F2F4EC] disabled:opacity-40"
              >
                Close
              </button>

              <button
                type="button"
                disabled={
                  ratingSubmitting ||
                  selectedRating ===
                    0
                }
                onClick={
                  submitRating
                }
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#295640] disabled:opacity-40"
              >
                {ratingSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Star className="h-3.5 w-3.5" />
                )}

                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function RequestTimeline({
  currentStage,
}: {
  currentStage: number;
}) {
  const steps = [
    {
      number: 1,
      label: "Requested",
    },
    {
      number: 2,
      label: "Assigned",
    },
    {
      number: 3,
      label: "In Progress",
    },
    {
      number: 4,
      label: "Completed",
    },
  ];

  return (
    <div className="space-y-0">
      {steps.map(
        (step, index) => {
          const done =
            step.number <
            currentStage;

          const current =
            step.number ===
            currentStage;

          const last =
            index ===
            steps.length - 1;

          return (
            <div
              key={
                step.number
              }
              className="flex items-start gap-2.5"
            >
              <div className="flex w-5 shrink-0 flex-col items-center">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    done ||
                    current
                      ? "border-[#1D4435] bg-[#1D4435] text-white"
                      : "border-[#DFE4DA] bg-white text-[#7D887D]"
                  }`}
                >
                  {done ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <span className="text-[9px] font-medium">
                      {step.number}
                    </span>
                  )}
                </div>

                {!last && (
                  <div
                    className={`h-6 w-px ${
                      done
                        ? "bg-[#1D4435]"
                        : "bg-[#DFE4DA]"
                    }`}
                  />
                )}
              </div>

              <div className="min-w-0 pb-4">
                <p
                  className={`text-xs font-medium ${
                    done ||
                    current
                      ? "text-[#294436]"
                      : "text-[#859083]"
                  }`}
                >
                  {step.label}
                </p>

                {current && (
                  <p className="mt-0.5 text-[10px] text-[#55755A]">
                    Current status
                  </p>
                )}
              </div>
            </div>
          );
        },
      )}
    </div>
  );
}

function BottomNavButton({
  label,
  icon,
  active,
  badge,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition ${
        active
          ? "bg-[#1D4435] text-white shadow-sm"
          : "text-[#7D887D] hover:bg-[#F2F4EC] hover:text-[#294436]"
      }`}
    >
      {icon}

      <span className="truncate text-[9px] font-medium sm:text-[10px]">
        {label}
      </span>

      {badge !==
        undefined &&
        badge > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#A2634B] px-1 text-[8px] font-medium text-white">
            {badge}
          </span>
        )}
    </button>
  );
}

function RequestMiniCard({
  item,
  onClick,
}: {
  item: GuestRequestItem;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-[#E3E6DE] bg-white p-3.5 text-left shadow-sm transition hover:border-[#92AA92] hover:shadow"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
          {item.title
            .toLowerCase()
            .includes(
              "food",
            ) ? (
            <Utensils className="h-4 w-4" />
          ) : (
            <ConciergeBell className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="truncate text-xs font-medium text-[#294436]">
              {item.title}
            </h3>

            <span
              className={`shrink-0 rounded-md border px-2 py-0.5 text-[9px] font-medium ${statusClasses(
                item.status,
              )}`}
            >
              {statusLabel(
                item.status,
              )}
            </span>
          </div>

          {item.assignedStaffName ? (
            <p className="mt-1 text-[11px] text-[#859083]">
              Staff:{" "}
              <span className="font-medium text-[#294436]">
                {
                  item.assignedStaffName
                }
              </span>
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-[#8C9782]">
              Waiting for staff assignment
            </p>
          )}
        </div>

        <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[#7D887D]" />
      </div>
    </button>
  );
}

function StayInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-[#F7F6F0]/60 p-2.5 border border-[#E3E6DE]">
      <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
        {label}
      </p>

      <p className="mt-0.5 line-clamp-2 text-xs font-medium text-[#294436]">
        {value}
      </p>
    </div>
  );
}

function LoadingCard({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mt-4 rounded-xl border border-[#E3E6DE] bg-white p-8 text-center shadow-sm">
      <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#7D887D]" />

      <p className="mt-2.5 text-xs text-[#859083]">
        {text}
      </p>
    </div>
  );
}

function EmptyCard({
  icon,
  title,
  description,
  buttonLabel,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  buttonLabel?: string;
  onClick?: () => void;
}) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[#DFE4DA] bg-white p-8 text-center">
      {icon}

      <h3 className="mt-3 text-xs font-medium text-[#294436]">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-[#859083]">
        {description}
      </p>

      {buttonLabel &&
        onClick && (
          <button
            type="button"
            onClick={onClick}
            className="mt-4 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#295640]"
          >
            {buttonLabel}
          </button>
        )}
    </div>
  );
}

function SuccessCard({
  title,
  description,
  buttonLabel,
  onClick,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <section className="mt-4 rounded-xl border border-[#D5E2D5] bg-[#E8EFE8] p-4">
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#356248] shadow-sm">
          <CheckCircle2 className="h-4 w-4" />
        </div>

        <div>
          <h3 className="text-xs font-medium text-[#356248]">
            {title}
          </h3>

          <p className="mt-0.5 text-xs leading-4 text-[#356248]/90">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#295640]"
      >
        {buttonLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </section>
  );
}

function PaymentOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3.5 py-2.5 text-xs font-medium transition ${
        selected
          ? "border-[#1D4435] bg-[#1D4435] text-white shadow-sm"
          : "border-[#E3E6DE] bg-white text-[#40543E] hover:border-[#C7D3C7]"
      }`}
    >
      {label}
    </button>
  );
}