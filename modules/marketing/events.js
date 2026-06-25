// AI WeChat marketing page events.

function bindMarketingEvents() {
document.querySelectorAll("[data-workbench-filter]").forEach((el) =>
    el.addEventListener("click", () => showToast(`${el.textContent.trim()}视图已切换`))
  );
  document.querySelectorAll("[data-marketing-tag-sub]").forEach((el) =>
    el.addEventListener("click", () => {
      const next = el.dataset.marketingTagSub;
      setState({ marketingSub: "tags", marketingTagSub: next, marketingTagTab: next === "wechat" ? "enterprise" : "customer", keywordTagTab: "rules" });
    })
  );
  document.querySelectorAll("[data-marketing-tag-tab]").forEach((el) =>
    el.addEventListener("click", () => setState({ marketingTagTab: el.dataset.marketingTagTab }))
  );
  document.querySelectorAll("[data-keyword-tag-tab]").forEach((el) =>
    el.addEventListener("click", () => setState({ keywordTagTab: el.dataset.keywordTagTab }))
  );
  document.querySelectorAll("[data-message-blast-sub]").forEach((el) =>
    el.addEventListener("click", () => setState({ marketingSub: "blast", messageBlastSub: el.dataset.messageBlastSub, messageBlastTab: "tasks" }))
  );
  document.querySelectorAll("[data-message-blast-tab]").forEach((el) =>
    el.addEventListener("click", () => setState({ messageBlastTab: el.dataset.messageBlastTab }))
  );
  document.querySelectorAll("[data-auto-friend-sub]").forEach((el) =>
    el.addEventListener("click", () => setState({ marketingSub: "friend", autoFriendSub: el.dataset.autoFriendSub }))
  );
  document.querySelectorAll("[data-operation-sub]").forEach((el) =>
    el.addEventListener("click", () => setState({ marketingSub: "operation", operationSub: el.dataset.operationSub, operationTab: "content" }))
  );
  document.querySelectorAll("[data-operation-top-tab]").forEach((el) =>
    el.addEventListener("click", () => setState({ operationTab: el.dataset.operationTopTab }))
  );
  document.querySelectorAll("[data-operation-tab]").forEach((el) =>
    el.addEventListener("click", () => setState({ operationTab: el.dataset.operationTab }))
  );
  document.querySelectorAll("[data-group-manage-sub]").forEach((el) =>
    el.addEventListener("click", () => setState({ marketingSub: "groups", groupManageSub: el.dataset.groupManageSub, groupManageTab: "welcome" }))
  );
  document.querySelectorAll("[data-group-manage-tab]").forEach((el) =>
    el.addEventListener("click", () => setState({ groupManageTab: el.dataset.groupManageTab }))
  );
  document.querySelectorAll("[data-marketing-account-tab]").forEach((el) =>
    el.addEventListener("click", () => setState({ marketingAccountTab: el.dataset.marketingAccountTab }))
  );
  document.querySelectorAll("[data-material-scope]").forEach((el) =>
    el.addEventListener("click", () => setState({ materialScope: el.dataset.materialScope }))
  );
  document.querySelectorAll("[data-material-type]").forEach((el) =>
    el.addEventListener("click", () => setState({ materialType: el.dataset.materialType }))
  );
  document.querySelectorAll("[data-anti-seal-tab]").forEach((el) =>
    el.addEventListener("click", () => setState({ antiSealTab: el.dataset.antiSealTab }))
  );

const marketingNew = document.querySelector("[data-marketing-rule-new]");
  if (marketingNew) marketingNew.addEventListener("click", () => setState({ marketingRuleView: "form", marketingRuleId: null }));
  document.querySelectorAll("[data-marketing-rule-edit]").forEach((el) =>
    el.addEventListener("click", () => setState({ marketingRuleView: "form", marketingRuleId: el.dataset.marketingRuleEdit }))
  );
  const marketingBack = document.querySelector("[data-marketing-back]");
  if (marketingBack) marketingBack.addEventListener("click", () => setState({ marketingRuleView: "list", marketingRuleId: null }));
  const marketingSave = document.querySelector("[data-marketing-save]");
  if (marketingSave) marketingSave.addEventListener("click", () => {
    showToast("聚合对话规则已保存");
    setState({ marketingRuleView: "list", marketingRuleId: null });
  });
  document.querySelectorAll("[data-marketing-option]").forEach((el) =>
    el.addEventListener("click", () => {
      const select = el.closest(".fake-select");
      if (select) {
        const summary = select.querySelector("summary");
        if (summary) summary.innerHTML = `${el.dataset.marketingOption}<span>⌄</span>`;
        select.removeAttribute("open");
      }
      showToast(`已选择：${el.dataset.marketingOption}`);
    })
  );
}

function bindMarketingModalEvents() {
  // Marketing modals rely on shared modal OK handlers.
}
