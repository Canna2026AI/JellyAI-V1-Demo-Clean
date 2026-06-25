// Settings and product teaching events.

function bindSettingsEvents() {
document.querySelectorAll("[data-teach-sub]").forEach((el) =>
    el.addEventListener("click", () => setState({ teachSub: el.dataset.teachSub }))
  );
  document.querySelectorAll("[data-settings-sub]").forEach((el) =>
    el.addEventListener("click", () => setState({ settingsSub: el.dataset.settingsSub }))
  );
}

function bindSettingsModalEvents() {
  // Settings modal actions are handled by the shared data-modal-ok callback.
}
