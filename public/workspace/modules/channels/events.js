// Channels page events.

function bindChannelEvents() {
document.querySelectorAll("[data-channel-category]").forEach((el) =>
    el.addEventListener("click", () => setState({ channelCategory: el.dataset.channelCategory }))
  );
  const channelSearch = document.querySelector("[data-channel-search]");
  if (channelSearch) channelSearch.addEventListener("input", () => {
    const query = channelSearch.value;
    setState({ channelSearchQuery: query });
    const nextInput = document.querySelector("[data-channel-search]");
    nextInput?.focus();
    nextInput?.setSelectionRange(query.length, query.length);
  });
  const channelReset = document.querySelector("[data-channel-reset]");
  if (channelReset) channelReset.addEventListener("click", () => setState({ channelSearchQuery: "" }));
  document.querySelectorAll("[data-channel-action]").forEach((el) =>
    el.addEventListener("click", () => showToast(`${el.dataset.channelAction}暂未开放，开发中（Demo）`))
  );
}
