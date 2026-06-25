// Contacts page events.

function bindContactEvents() {
document.querySelectorAll("[data-contacts-sub]").forEach((el) =>
    el.addEventListener("click", () => setState({ contactsSub: el.dataset.contactsSub }))
  );
}

function bindContactModalEvents() {
  // Contact modal actions are handled by the shared data-modal-ok callback.
}
