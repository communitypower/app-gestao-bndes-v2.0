export function enforceJsonApiHeaders(headersInit?: HeadersInit) {
  const headers = new Headers(headersInit);
  headers.set("Accept", "application/json");
  return headers;
}
