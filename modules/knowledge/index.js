// Knowledge module runtime service.

const knowledgeRuntime = {
  replace(items) {
    knowledgeBases.splice(0, knowledgeBases.length, ...items);
    if (typeof window !== "undefined") window.knowledgeBases = knowledgeBases;
  },

  async load(params = {}) {
    const { requestId, ...queryParams } = params;
    const result = await KnowledgeService.listKnowledgeBases({
      q: queryParams.q ?? state.knowledgeSearchQuery,
      status: queryParams.status ?? state.knowledgeStatusFilter,
      sort: queryParams.sort ?? state.knowledgeSort,
      page: 1,
      pageSize: 200,
      ...queryParams,
    });
    if (requestId && state.knowledgeLoadRequestId !== requestId) return result;
    this.replace(result.items || []);
    state.knowledgeBackendLoaded = true;
    state.knowledgeBackendError = "";
    return result;
  },

  list(params = {}) {
    const query = (params.query || "").trim().toLowerCase();
    const status = params.status || "全部状态";
    const sort = params.sort || "updatedDesc";
    let rows = knowledgeBases.filter((kb) => {
      const text = `${kb.name} ${kb.description} ${kb.type} ${kb.sourceType}`.toLowerCase();
      const queryMatched = !query || text.includes(query);
      const statusMatched = status === "全部状态" || kb.status === status;
      return queryMatched && statusMatched;
    });

    rows = rows.slice().sort((a, b) => {
      if (sort === "updatedAsc") return a.updatedAt.localeCompare(b.updatedAt);
      if (sort === "nameAsc") return a.name.localeCompare(b.name, "zh-Hans-CN");
      if (sort === "dataDesc") return b.chunkCount - a.chunkCount;
      return b.updatedAt.localeCompare(a.updatedAt);
    });

    return rows;
  },

  get(id) {
    if (!id) return knowledgeBases[0] || null;
    return knowledgeBases.find((kb) => kb.id === id) || null;
  },

  async create(draft) {
    const created = await KnowledgeService.createKnowledgeBase(draft);
    if (created) {
      knowledgeBases.unshift(created);
      return created;
    }
    const source = knowledgeSourceById(draft.sourceType || "text");
    const name = (draft.name || `${source.label}知识库`).trim();
    const documentName = draft.documentName || draft.uploadName || `${name}.${source.id === "website" ? "url" : source.id}`;
    const chunks = knowledgeDefaultChunks(source.label, documentName);
    const kb = {
      id: `kb-${Date.now()}`,
      name,
      description: draft.description || `${source.label}来源知识库`,
      type: source.id === "website" ? "网站" : source.id === "text" ? "文本" : "文档",
      sourceType: source.label,
      status: "启用",
      enabled: true,
      documentCount: 1,
      chunkCount: chunks.length,
      embeddingStatus: "已完成",
      size: draft.size || "20KB",
      updatedAt: knowledgeNow(),
      createdAt: knowledgeNow(),
      icon: source.icon,
      documents: [
        {
          id: `doc-${Date.now()}`,
          name: documentName,
          type: source.label,
          status: "已完成",
          size: draft.size || "20KB",
          updatedAt: knowledgeNow(),
          chunks,
        },
      ],
    };
    knowledgeBases.unshift(kb);
    return kb;
  },

  async update(id, patch) {
    const updated = await KnowledgeService.updateKnowledgeBase(id, patch);
    const kb = this.get(id);
    if (!kb) return null;
    Object.assign(kb, updated || patch, { updatedAt: updated?.updatedAt || knowledgeNow() });
    return kb;
  },

  async remove(id) {
    await KnowledgeService.deleteKnowledgeBase(id);
    const index = knowledgeBases.findIndex((kb) => kb.id === id);
    if (index < 0) return false;
    knowledgeBases.splice(index, 1);
    return true;
  },

  async toggle(id) {
    const updated = await KnowledgeService.toggleKnowledgeBase(id);
    const kb = this.get(id);
    if (!kb) return null;
    Object.assign(kb, updated || {});
    if (!updated) {
      kb.enabled = !kb.enabled;
      kb.status = kb.enabled ? "启用" : "停用";
      kb.updatedAt = knowledgeNow();
    }
    return kb;
  },

  reindexLocal(id) {
    const kb = this.get(id);
    if (!kb) return null;
    kb.status = "索引中";
    kb.embeddingStatus = "处理中";
    kb.updatedAt = knowledgeNow();
    return kb;
  },

  async reindex(id) {
    this.reindexLocal(id);
    const updated = await KnowledgeService.reindexKnowledgeBase(id, {
      segmentMode: state.knowledgeSegmentMode,
      vectorMode: state.knowledgeVectorMode,
    });
    const kb = this.get(id);
    if (kb && updated) Object.assign(kb, updated);
    return kb;
  },

  completeReindex(id) {
    const kb = this.get(id);
    if (!kb) return null;
    kb.status = kb.enabled ? "启用" : "停用";
    kb.embeddingStatus = "已完成";
    kb.documents.forEach((doc) => {
      doc.status = "已完成";
      doc.updatedAt = knowledgeNow();
      doc.chunks.forEach((chunk) => {
        chunk.embedding = "已完成";
      });
    });
    kb.updatedAt = knowledgeNow();
    return kb;
  },
};
