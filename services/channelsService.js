// Browser client for the local channels backend.

const channelsService = (() => {
  const apiBase = window.JELLY_CHANNELS_API_BASE || "";
  const token = window.JELLY_CHANNELS_API_TOKEN || window.localStorage?.getItem("jellyApiToken") || "jelly-demo-token";

  async function request(path, options = {}) {
    const headers = {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.auth === false ? {} : { Authorization: `Bearer ${token}` }),
    };
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
      const message = payload?.error?.message || payload?.message || `请求失败：${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  }

  async function health() {
    return request("/api/health", { auth: false });
  }

  async function listChannels(params = {}) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value);
    }
    const suffix = query.toString() ? `?${query}` : "";
    const payload = await request(`/api/channels${suffix}`, { auth: false });
    return payload.channels || [];
  }

  async function connectChannel(channelId, formValues) {
    return request(`/api/channels/${encodeURIComponent(channelId)}/connect`, {
      method: "POST",
      body: JSON.stringify(formValues),
      headers: { "X-Jelly-Actor": "demo-user" },
    });
  }

  async function testChannel(channelId, formValues) {
    return request(`/api/channels/${encodeURIComponent(channelId)}/test`, {
      method: "POST",
      body: JSON.stringify(formValues),
    });
  }

  async function deleteAccount(channelId, accountId) {
    return request(`/api/channels/${encodeURIComponent(channelId)}/accounts/${encodeURIComponent(accountId)}`, {
      method: "DELETE",
      headers: { "X-Jelly-Actor": "demo-user" },
    });
  }

  return {
    health,
    listChannels,
    connectChannel,
    testChannel,
    deleteAccount,
  };
})();

window.channelsService = channelsService;
