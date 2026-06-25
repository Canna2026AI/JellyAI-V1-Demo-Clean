// Analytics module renderers.

function renderAnalytics() {
  const data = analyticsData[state.analyticsTab];
  return `
    <section class="analytics-shell">
      <aside class="analytics-subnav">
        <div class="subnav-title">数据分析</div>
        ${analyticsTabs
          .map(([id, label]) => `<div class="subnav-item ${state.analyticsTab === id ? "active" : ""}" data-analytics-tab="${id}">${label}</div>`)
          .join("")}
      </aside>
      <main class="analytics-main">
        <div class="toolbar analytics-head">
          <h1 class="page-title">${data.title}</h1>
          <div style="display:flex; align-items:center; gap:10px">
            ${state.analyticsExported ? `<span class="tag green">已生成导出文件</span>` : ""}
            <button class="button" data-analytics-export>⇩ 导出</button>
          </div>
        </div>
        ${renderAnalyticsFilters(data)}
        ${renderAnalyticsMetrics(data)}
        ${renderAnalyticsChart(data)}
        ${renderAnalyticsDetails(data)}
      </main>
    </section>`;
}

function renderAnalyticsFilters(data) {
  return `<div class="analytics-filters">
    ${data.filters
      .map(
        (filter) => `<button class="select-like" data-analytics-filter="${filter}">
          <span>${filter}</span><span>⌄</span>
        </button>`
      )
      .join("")}
    <div class="range-tabs">
      ${[
        ["7", "近7天"],
        ["14", "近14天"],
        ["30", "近30天"],
      ]
        .map(([id, label]) => `<button class="${state.analyticsRange === id ? "active" : ""}" data-analytics-range="${id}">${label}</button>`)
        .join("")}
    </div>
    <button class="date-range">▣ 开始日期 <span>-</span> 结束日期</button>
  </div>`;
}

function renderAnalyticsMetrics(data) {
  return `<div class="analytics-metrics">
    ${data.metrics
      .map(
        ([label, value, unit]) => `<div class="metric-card">
          <div class="metric-label">${label} ⓘ</div>
          <div><span class="metric-number">${adjustAnalyticsValue(value)}</span><span class="metric-unit">${unit}</span></div>
        </div>`
      )
      .join("")}
  </div>`;
}

function renderAnalyticsChart(data) {
  const labels = getAnalyticsDates();
  const lines = [0, 0.2, 0.4, 0.6, 0.8, 1].reverse();
  return `<div class="analytics-chart-card">
    <div class="chart-title">${data.chartTitle}</div>
    <div class="chart-area" style="--ymax:${data.yMax}">
      <div class="y-axis">
        ${lines.map((n) => `<span>${formatAxisValue(n * data.yMax)}</span>`).join("")}
      </div>
      <div class="chart-grid">
        ${lines.map(() => `<div class="grid-line"></div>`).join("")}
        <div class="bar-stage">
          ${labels
            .map((label, index) => `<div class="bar-group" data-analytics-day="${label}">
              <div class="bars">
                ${data.values[index]
                  .map((value, seriesIndex) => `<span class="bar" style="height:${Math.max(3, (value / data.yMax) * 130)}px; background:${data.legend[seriesIndex][1]}"></span>`)
                  .join("")}
              </div>
              <span class="x-label">${label}</span>
            </div>`)
            .join("")}
        </div>
      </div>
    </div>
    <div class="chart-legend">
      ${data.legend.map(([label, color]) => `<span><i style="background:${color}"></i>${label}</span>`).join("")}
    </div>
  </div>`;
}

function renderAnalyticsDetails(data) {
  const rows = {
    ai_chat: [
      ["物流客服助手", "企业微信托管", "2", "6", "1", "2026-06-18"],
      ["演示AI助手", "网站页面", "0", "0", "0", "2026-06-17"],
    ],
    artificial_chat: [
      ["Kelvin", "企业微信托管", "1", "24", "未解决", "2026-06-18"],
      ["Canna", "网站页面", "0", "0", "已解决", "2026-06-17"],
    ],
    user_data: [
      ["欧诚国际物流&集简云对接群", "企业微信托管", "新用户", "有会话", "Kelvin", "2026-06-18"],
      ["演示联系人", "网站页面", "新用户", "有会话", "AI", "2026-06-18"],
    ],
    ai_flows: [
      ["企业微信消息自动回复", "企业微信托管", "0", "0", "0", "2026-06-18"],
      ["报价转人工流程", "聚合对话", "0", "0", "0", "2026-06-17"],
    ],
  }[state.analyticsTab];
  const headers = {
    ai_chat: ["对象", "渠道", "会话", "消息", "转人工", "日期"],
    artificial_chat: ["坐席", "渠道", "会话", "消息", "状态", "日期"],
    user_data: ["用户", "渠道", "类型", "会话状态", "跟进人", "日期"],
    ai_flows: ["流程", "触发来源", "执行", "成功", "失败", "日期"],
  }[state.analyticsTab];
  return `<div class="analytics-table table-card">
    <div class="table-caption">${data.title}明细</div>
    <table>
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${row.map((cell, i) => `<td>${i === 4 && (cell === "未解决" || cell === "已解决") ? `<span class="tag ${cell === "已解决" ? "green" : "orange"}">${cell}</span>` : cell}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  </div>`;
}

function adjustAnalyticsValue(value) {
  const multiplier = state.analyticsRange === "30" ? 3 : state.analyticsRange === "14" ? 1.6 : 1;
  return Number.isInteger(value * multiplier) ? value * multiplier : Math.round(value * multiplier);
}

function getAnalyticsDates() {
  if (state.analyticsRange === "7") return ["2026-06-12", "2026-06-13", "2026-06-14", "2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18", "2026-06-19"];
  if (state.analyticsRange === "14") return ["06-06", "06-08", "06-10", "06-12", "06-14", "06-16", "06-18", "06-19"];
  return ["05-21", "05-25", "05-29", "06-02", "06-06", "06-10", "06-14", "06-19"];
}

function formatAxisValue(value) {
  return Number.isInteger(value) ? value : value.toFixed(1);
}
