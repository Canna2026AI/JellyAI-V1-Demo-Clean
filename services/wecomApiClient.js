// Browser client for the real WeCom backend. Falls back silently when the API is absent.
(function initWecomApiClient() {
  const base = window.JELLY_WECOM_API_BASE || "";

  async function request(path, options = {}) {
    const response = await fetch(`${base}${path}`, {
      method: options.method || "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof body === "object" ? body.error || body.detail : body;
      throw new Error(message || `Request failed: ${response.status}`);
    }
    return body;
  }

  function get(path) {
    return request(path);
  }

  function post(path, body) {
    return request(path, { method: "POST", body });
  }

  function patch(path, body) {
    return request(path, { method: "PATCH", body });
  }

  function del(path) {
    return request(path, { method: "DELETE" });
  }

  window.wecomApi = {
    get,
    post,
    patch,
    delete: del,
    bootstrap: () => get("/api/wecom/bootstrap"),
    health: () => get("/api/health"),
  };
})();
