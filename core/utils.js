// Common HTML and rendering helpers shared by modules.

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function iconBox(text, cls = "assistant-icon") {
  return `<div class="${cls}">${escapeHtml(text)}</div>`;
}

function renderSelectOptions(options, selected) {
  return options.map((option) => `<option ${option === selected ? "selected" : ""}>${escapeHtml(option)}</option>`).join("");
}
