// JellyAI V1 Demo startup entry. Keep this file small: initialize data, then render.

(async function startApp() {
  try {
    if (typeof initConversationBackendState === "function") {
      await initConversationBackendState();
    }
  } catch (error) {
    console.warn("Conversation backend initialization failed:", error.message);
  }
  render();
})();
