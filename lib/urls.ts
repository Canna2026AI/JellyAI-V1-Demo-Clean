export function getCustomerWebUrl(path = "/") {
  const base = (process.env.CUSTOMER_WEB_URL || "http://127.0.0.1:3001").replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

export function getAdminWebUrl(path = "/") {
  const base = (process.env.ADMIN_WEB_URL || "http://localhost:3000").replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
