export type Item = {
  id: string;
  kind: string;
  version: number;
  updated: string;
  [key: string]: any;
};
export type Site = { settings: Record<string, any>; [key: string]: any };
export async function api(path: string, method = "GET", data?: unknown) {
  const form = data instanceof FormData;
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "X-Requested-With": "agency-platform",
      ...(!form && data !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
    },
    body: data === undefined ? undefined : form ? data : JSON.stringify(data),
  });
  if (!response.ok) {
    let message =
      response.status === 403
        ? "The server rejected this request. Ask the website owner to check the allowed website address in the backend configuration."
        : response.status === 404
          ? "This service is unavailable. The backend may need to be updated before you can continue."
          : response.status >= 500
            ? "The website service is temporarily unavailable. Please try again shortly."
            : `The request could not be completed (HTTP ${response.status}). Please try again.`;
    try {
      const error = await response.json();
      message =
        typeof error.detail === "string" && error.detail !== "Not Found"
          ? error.detail
          : (Array.isArray(error.detail)
              ? error.detail
                  .map((x: { msg: string }) => x.msg)
                  .filter(Boolean)
                  .join("; ")
              : "") || message;
    } catch {}
    throw new Error(message);
  }
  return response.status === 204 ? null : response.json();
}
export async function getSite(): Promise<Site> {
  const response = await fetch(
    `${process.env.BACKEND_URL || "http://127.0.0.1:8100"}/api/public/site`,
    { cache: "no-store" },
  );
  if (!response.ok)
    throw new Error(
      "The content service is unavailable. Please try again shortly.",
    );
  return response.json();
}
