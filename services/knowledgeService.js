// Knowledge service boundary.
// Current implementation is intentionally Mock-only. Replace these methods with
// real HTTP calls when backend APIs are available.

const KnowledgeService = {
  async listKnowledgeBases(params = {}) {
    return window.KnowledgeMock?.listKnowledgeBases(params) || [];
  },

  async getKnowledgeBase(id) {
    return window.KnowledgeMock?.getKnowledgeBase(id) || null;
  },

  async createKnowledgeBase(payload) {
    return window.KnowledgeMock?.createKnowledgeBase(payload) || null;
  },

  async updateKnowledgeBase(id, payload) {
    return window.KnowledgeMock?.updateKnowledgeBase(id, payload) || null;
  },

  async deleteKnowledgeBase(id) {
    return window.KnowledgeMock?.deleteKnowledgeBase(id) || false;
  },

  async toggleKnowledgeBase(id) {
    return window.KnowledgeMock?.toggleKnowledgeBase(id) || null;
  },

  async uploadDocument(file, options = {}) {
    return window.KnowledgeMock?.uploadDocument(file, options) || null;
  },

  async previewChunks(payload) {
    return window.KnowledgeMock?.previewChunks(payload) || [];
  },

  async reindexKnowledgeBase(id) {
    return window.KnowledgeMock?.reindexKnowledgeBase(id) || null;
  },
};

if (typeof window !== "undefined") window.KnowledgeService = KnowledgeService;
