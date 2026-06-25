// Analytics page events.

function bindAnalyticsEvents() {
document.querySelectorAll("[data-analytics-tab]").forEach((el) =>
    el.addEventListener("click", () => setState({ analyticsTab: el.dataset.analyticsTab, analyticsExported: false }))
  );
  document.querySelectorAll("[data-analytics-range]").forEach((el) =>
    el.addEventListener("click", () => setState({ analyticsRange: el.dataset.analyticsRange }))
  );
  document.querySelectorAll("[data-analytics-filter]").forEach((el) =>
    el.addEventListener("click", () => showToast(`${el.dataset.analyticsFilter}筛选已应用`))
  );
  document.querySelectorAll("[data-analytics-day]").forEach((el) =>
    el.addEventListener("click", () => showToast(`${el.dataset.analyticsDay} 数据点已选中`))
  );
  const dateRange = document.querySelector(".date-range");
  if (dateRange) dateRange.addEventListener("click", () => showToast("日期范围选择器已打开"));
  const analyticsExport = document.querySelector("[data-analytics-export]");
  if (analyticsExport) {
    analyticsExport.addEventListener("click", () => {
      state.analyticsExported = true;
      showToast(`${analyticsData[state.analyticsTab].title}报表已导出`);
      render();
    });
  }
}
