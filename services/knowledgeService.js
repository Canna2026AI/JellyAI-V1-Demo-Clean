// Knowledge service boundary.
// Uses the real local backend when available and falls back to Mock data for
// static-file preview.

const KnowledgeService = {
  baseUrl: "",
  backendAvailable: null,

  async request(path, options = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  async canUseBackend() {
    if (this.backendAvailable !== null) return this.backendAvailable;
    try {
      await this.request("/api/health");
      this.backendAvailable = true;
    } catch (_) {
      this.backendAvailable = false;
    }
    return this.backendAvailable;
  },

  async listKnowledgeBases(params = {}) {
    if (await this.canUseBackend()) {
      const qs = new URLSearchParams(params).toString();
      return this.request(`/api/knowledge-bases${qs ? `?${qs}` : ""}`);
    }
    const items = window.KnowledgeMock?.listKnowledgeBases(params) || [];
    return { items, total: items.length, page: 1, pageSize: items.length || 1, totalPages: 1 };
  },

  async getKnowledgeBase(id) {
    if (await this.canUseBackend()) return this.request(`/api/knowledge-bases/${encodeURIComponent(id)}`);
    return window.KnowledgeMock?.getKnowledgeBase(id) || null;
  },

  async createKnowledgeBase(payload) {
    if (await this.canUseBackend()) {
      return this.request("/api/knowledge-bases", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    return window.KnowledgeMock?.createKnowledgeBase(payload) || null;
  },

  async updateKnowledgeBase(id, payload) {
    if (await this.canUseBackend()) {
      return this.request(`/api/knowledge-bases/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    }
    return window.KnowledgeMock?.updateKnowledgeBase(id, payload) || null;
  },

  async deleteKnowledgeBase(id) {
    if (await this.canUseBackend()) {
      return this.request(`/api/knowledge-bases/${encodeURIComponent(id)}`, { method: "DELETE" });
    }
    return window.KnowledgeMock?.deleteKnowledgeBase(id) || false;
  },

  async listDocuments(id) {
    if (await this.canUseBackend()) return this.request(`/api/knowledge-bases/${encodeURIComponent(id)}/documents`);
    const kb = window.KnowledgeMock?.getKnowledgeBase(id);
    return { items: kb?.documents || [], total: kb?.documents?.length || 0 };
  },

  async deleteDocument(id, documentId) {
    if (await this.canUseBackend()) {
      return this.request(`/api/knowledge-bases/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentId)}`, {
        method: "DELETE",
      });
    }
    return { ok: true };
  },

  async listChunks(id, params = {}) {
    if (await this.canUseBackend()) {
      const qs = new URLSearchParams(params).toString();
      return this.request(`/api/knowledge-bases/${encodeURIComponent(id)}/chunks${qs ? `?${qs}` : ""}`);
    }
    const kb = window.KnowledgeMock?.getKnowledgeBase(id);
    const items = (kb?.documents || []).flatMap((doc) => (doc.chunks || []).map((chunk) => ({ ...chunk, documentId: doc.id, documentName: doc.name })));
    return { items, total: items.length, page: 1, pageSize: items.length || 1, totalPages: 1 };
  },

  async toggleKnowledgeBase(id) {
    if (await this.canUseBackend()) {
      return this.request(`/api/knowledge-bases/${encodeURIComponent(id)}/toggle`, { method: "POST", body: "{}" });
    }
    return window.KnowledgeMock?.toggleKnowledgeBase(id) || null;
  },

  async uploadDocument(file, options = {}) {
    const payload = await this.fileToPayload(file, options);
    if (options.knowledgeBaseId && (await this.canUseBackend())) {
      return this.request(`/api/knowledge-bases/${encodeURIComponent(options.knowledgeBaseId)}/documents`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    return payload;
  },

  async previewChunks(payload) {
    if (await this.canUseBackend()) {
      const result = await this.request("/api/chunks/preview", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return result.items || [];
    }
    return window.KnowledgeMock?.previewChunks(payload) || [];
  },

  async reindexKnowledgeBase(id, options = {}) {
    if (await this.canUseBackend()) {
      return this.request(`/api/knowledge-bases/${encodeURIComponent(id)}/reindex`, {
        method: "POST",
        body: JSON.stringify(options),
      });
    }
    return window.KnowledgeMock?.reindexKnowledgeBase(id) || null;
  },

  async searchKnowledge(params = {}) {
    if (await this.canUseBackend()) {
      const qs = new URLSearchParams(params).toString();
      return this.request(`/api/knowledge-search/debug${qs ? `?${qs}` : ""}`);
    }
    return { items: [], total: 0 };
  },

  async fileToPayload(file, options = {}) {
    const contentBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
      reader.onerror = () => reject(new Error("文件读取失败"));
      reader.readAsDataURL(file);
    });
    return {
      ...options,
      fileName: file.name,
      documentName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      contentBase64,
    };
  },
};

if (typeof window !== "undefined") window.KnowledgeService = KnowledgeService;
