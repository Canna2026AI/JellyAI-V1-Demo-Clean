// Knowledge service boundary.
// Uses the real local backend when available and falls back to Mock data for
// static-file preview.

const KnowledgeService = {
  baseUrl: "",

  async request(path, options = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      credentials: "include",
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

  statusLabel(status) {
    return status === "active" || status === "enabled" || status === "启用" ? "启用" : status === "indexing" ? "索引中" : "停用";
  },

  nowLabel() {
    return new Date().toLocaleString("zh-CN", { hour12: false });
  },

  mapKnowledgeBase(row) {
    const metadata = row.metadata || {};
    const type = row.kind || metadata.type || "多模态";
    const updatedAt = row.updatedAt ? new Date(row.updatedAt).toLocaleString("zh-CN", { hour12: false }) : this.nowLabel();
    return {
      id: row.id,
      name: row.name,
      description: row.description || "",
      type,
      sourceType: metadata.sourceType || type,
      status: this.statusLabel(row.status),
      enabled: row.status !== "disabled" && row.status !== "inactive" && row.status !== "停用",
      documentCount: Number(row.documentCount || 0),
      chunkCount: Number(row.vectorCount || 0),
      embeddingStatus: metadata.embeddingStatus || "已完成",
      size: metadata.size || `${Number(row.vectorCount || 0).toLocaleString("zh-CN")} vectors`,
      updatedAt,
      createdAt: row.createdAt ? new Date(row.createdAt).toLocaleString("zh-CN", { hour12: false }) : updatedAt,
      icon: metadata.icon || "◎",
      documents: Array.isArray(metadata.documents) ? metadata.documents : [],
    };
  },

  async listKnowledgeBases(params = {}) {
    try {
      const qs = new URLSearchParams(params).toString();
      const payload = await this.request(`/api/app/knowledge-bases${qs ? `?${qs}` : ""}`);
      const items = (payload.knowledgeBases || []).map((row) => this.mapKnowledgeBase(row));
      return { items, total: items.length, page: 1, pageSize: items.length || 1, totalPages: 1 };
    } catch (error) {
      console.info("Knowledge API unavailable, using local mock data.", error.message);
    }
    const items = window.KnowledgeMock?.listKnowledgeBases(params) || [];
    return { items, total: items.length, page: 1, pageSize: items.length || 1, totalPages: 1 };
  },

  async getKnowledgeBase(id) {
    return window.KnowledgeMock?.getKnowledgeBase(id) || null;
  },

  async createKnowledgeBase(payload) {
    try {
      const result = await this.request("/api/app/knowledge-bases", {
        method: "POST",
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
          kind: payload.type || payload.sourceType || "多模态",
          documentCount: payload.documentCount || 1,
          vectorCount: payload.chunkCount || 0,
          metadata: {
            sourceType: payload.sourceType,
            size: payload.size,
            icon: payload.icon,
            documents: payload.documents || [],
            vectorStore: "mock",
          },
        }),
      });
      return this.mapKnowledgeBase(result.knowledgeBase);
    } catch (error) {
      console.warn("Knowledge create API failed, using local mock:", error.message);
    }
    return window.KnowledgeMock?.createKnowledgeBase(payload) || null;
  },

  async updateKnowledgeBase(id, payload) {
    return window.KnowledgeMock?.updateKnowledgeBase(id, payload) || null;
  },

  async deleteKnowledgeBase(id) {
    return window.KnowledgeMock?.deleteKnowledgeBase(id) || false;
  },

  async listDocuments(id) {
    const kb = window.KnowledgeMock?.getKnowledgeBase(id);
    return { items: kb?.documents || [], total: kb?.documents?.length || 0 };
  },

  async deleteDocument(id, documentId) {
    void id;
    void documentId;
    return { ok: true };
  },

  async listChunks(id, params = {}) {
    void params;
    const kb = window.KnowledgeMock?.getKnowledgeBase(id);
    const items = (kb?.documents || []).flatMap((doc) => (doc.chunks || []).map((chunk) => ({ ...chunk, documentId: doc.id, documentName: doc.name })));
    return { items, total: items.length, page: 1, pageSize: items.length || 1, totalPages: 1 };
  },

  async toggleKnowledgeBase(id) {
    return window.KnowledgeMock?.toggleKnowledgeBase(id) || null;
  },

  async uploadDocument(file, options = {}) {
    const payload = await this.fileToPayload(file, options);
    return payload;
  },

  async previewChunks(payload) {
    return window.KnowledgeMock?.previewChunks(payload) || [];
  },

  async reindexKnowledgeBase(id, options = {}) {
    void options;
    return window.KnowledgeMock?.reindexKnowledgeBase(id) || null;
  },

  async searchKnowledge(params = {}) {
    void params;
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
