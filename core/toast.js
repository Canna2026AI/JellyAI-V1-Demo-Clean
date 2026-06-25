// Shared Toast API for the static V1 demo.

const toastEl = document.getElementById("toast");

function showToast(text) {
  if (!toastEl) return;
  toastEl.textContent = text;
  toastEl.classList.add("show");
  window.setTimeout(() => toastEl.classList.remove("show"), 1800);
}
