import api from "./axios";

async function downloadCsv(
  url: string,
  params: Record<string, string | undefined>,
  fallbackName: string,
) {
  const response = await api.get(url, {
    params,
    responseType: "blob",
  });

  const blob = new Blob([response.data], {
    type: "text/csv;charset=utf-8;",
  });

  const contentDisposition = response.headers[
    "content-disposition"
  ] as string | undefined;

  const match = contentDisposition?.match(
    /filename\*?=(?:UTF-8''|" )?([^;"]+)/i,
  );

  const filename = match?.[1]
    ? decodeURIComponent(match[1].replace(/"/g, "").trim())
    : fallbackName;

  const urlObject = window.URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = urlObject;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.URL.revokeObjectURL(urlObject);
}

export const exportTenantsCsv = async (
  propertyId?: string,
) => {
  return downloadCsv(
    "/api/Export/tenants",
    {
      propertyId: propertyId || undefined,
    },
    `tenants_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`,
  );
};

export const exportPaymentsCsv = async (
  tenantId: string,
) => {
  if (!tenantId) {
    throw new Error(
      "Tenant is required for payment export.",
    );
  }

  return downloadCsv(
    `/api/Export/payments/${tenantId}`,
    {},
    `payments_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`,
  );
};

export const exportExpensesCsv = async (
  propertyId: string,
) => {
  if (!propertyId) {
    throw new Error(
      "Property is required for expense export.",
    );
  }

  return downloadCsv(
    `/api/Export/expenses/${propertyId}`,
    {},
    `expenses_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`,
  );
};