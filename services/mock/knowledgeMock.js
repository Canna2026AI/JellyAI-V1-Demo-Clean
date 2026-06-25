// Mock implementation for the knowledge service boundary.

const KnowledgeMock = {
  listKnowledgeBases(params = {}) {
    const query = (params.query || "").trim().toLowerCase();
    const status = params.status || "全部状态";
    return (window.knowledgeBases || []).filter((kb) => {
      const text = `${kb.name} ${kb.description} ${kb.type} ${kb.sourceType}`.toLowerCase();
      return (!query || text.includes(query)) && (status === "全部状态" || kb.status === status);
    });
  },

  getKnowledgeBase(id) {
    return (window.knowledgeBases || []).find((kb) => kb.id === id) || null;
  },

  createKnowledgeBase(payload) {
    return {
      id: `kb-${Date.now()}`,
      status: "启用",
      enabled: true,
      embeddingStatus: "已完成",
      documentCount: 1,
      chunkCount: 3,
      updatedAt: new Date().toISOString(),
      ...payload,
    };
  },

  updateKnowledgeBase(id, payload) {
    return { id, ...payload, updatedAt: new Date().toISOString() };
  },

  deleteKnowledgeBase(id) {
    return Boolean(id);
  },

  toggleKnowledgeBase(id) {
    const kb = this.getKnowledgeBase(id);
    if (!kb) return null;
    return { ...kb, enabled: !kb.enabled, status: kb.enabled ? "停用" : "启用" };
  },

  uploadDocument(file, options = {}) {
    return {
      id: `upload-${Date.now()}`,
      name: file?.name || options.name || "mock-file.pdf",
      status: "已完成",
      progress: 100,
      size: options.size || "20KB",
    };
  },

  previewChunks(payload = {}) {
    const source = payload.text || payload.name || "Mock 知识内容";
    return [
      { id: "preview-1", chars: source.length, text: source },
      { id: "preview-2", chars: 36, text: "自动清洗连续空格、URL、邮箱和无效符号。" },
      { id: "preview-3", chars: 28, text: "按分段规则生成可向量化 Chunk。" },
    ];
  },

  reindexKnowledgeBase(id) {
    return { id, status: "索引中", embeddingStatus: "处理中" };
  },
};

if (typeof window !== "undefined") window.KnowledgeMock = KnowledgeMock;
