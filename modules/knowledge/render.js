// Knowledge base module renderers.

function renderStandaloneKnowledge() {
  return `<section class="module-layout">
    ${renderAiSubnav("knowledge")}
    ${renderKnowledgeManager()}
  </section>`;
}

function renderKnowledgeManager() {
  ensureKnowledgeState();
  const rows = knowledgeRuntime.list({
    query: state.knowledgeSearchQuery,
    status: state.knowledgeStatusFilter,
    sort: state.knowledgeSort,
  });
  const page = knowledgePaginate(rows, state.knowledgePage, state.knowledgePageSize);
  const selected = knowledgeRuntime.get(state.knowledgeSelectedId) || rows[0] || null;
  const totalDocs = knowledgeBases.reduce((sum, kb) => sum + kb.documentCount, 0);
  const totalChunks = knowledgeBases.reduce((sum, kb) => sum + kb.chunkCount, 0);

  return `<div class="module-content ai-manager-page knowledge-manager-page">
    <div class="knowledge-list-head">
      <div>
        <h1 class="page-title">知识库列表</h1>
        <div class="subtle">您可以通过上传文档，数据库，网站页面等方式创建知识内容，AI应用可以基于此知识进行对话 <button class="link-button">了解更多</button></div>
      </div>
      <div class="capacity">空间容量： ${knowledgeTotalSize()} / 1024M</div>
    </div>
    <div class="knowledge-summary-strip">
      <div><span>知识库</span><b>${knowledgeBases.length}</b></div>
      <div><span>文档</span><b>${totalDocs}</b></div>
      <div><span>Chunk</span><b>${totalChunks}</b></div>
      <div><span>索引状态</span><b>${knowledgeBases.filter((kb) => kb.embeddingStatus === "已完成").length}/${knowledgeBases.length}</b></div>
    </div>
    <div class="knowledge-tools">
      <button class="button primary" data-page="knowledgeCreate">＋ 新增知识库</button>
      <input class="input search-input" placeholder="搜索名称、类型或描述" value="${escapeHtml(state.knowledgeSearchQuery)}" data-knowledge-search />
      <select class="select knowledge-select" data-knowledge-status>
        ${knowledgeStatusOptions.map((option) => `<option ${option === state.knowledgeStatusFilter ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
      </select>
      <select class="select knowledge-select" data-knowledge-sort>
        ${knowledgeSortOptions.map((option) => `<option value="${option.id}" ${option.id === state.knowledgeSort ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
      </select>
    </div>
    ${state.knowledgeLoading ? `<div class="knowledge-loading">Loading...</div>` : ""}
    <div class="knowledge-console">
      <section class="knowledge-list-panel">
        ${page.items.length ? page.items.map(renderKnowledgeListCard).join("") : renderKnowledgeEmpty()}
        ${renderKnowledgePagination(rows.length, page.page, page.totalPages)}
      </section>
      <section class="knowledge-detail-panel">
        ${selected ? renderKnowledgeDetail(selected) : `<div class="empty">请选择或创建知识库</div>`}
      </section>
    </div>
  </div>`;
}

function renderKnowledgeListCard(kb) {
  const selected = state.knowledgeSelectedId === kb.id;
  return `<article class="knowledge-card knowledge-list-card ${selected ? "active" : ""}" data-knowledge-select="${escapeHtml(kb.id)}">
    <div class="knowledge-card-top">
      <div class="knowledge-card-icon">${escapeHtml(kb.icon)}</div>
      <div>
        <div class="knowledge-card-name">${escapeHtml(kb.name)}</div>
        <div class="subtle">${escapeHtml(kb.description)}</div>
      </div>
      ${knowledgeStatusTag(kb.status)}
    </div>
    <div class="knowledge-card-count">▧ ${knowledgeFormatCount(kb)}</div>
    <div class="knowledge-card-meta">
      <span>${escapeHtml(kb.sourceType)}</span>
      <span>${escapeHtml(kb.size)}</span>
      <span>更新 ${escapeHtml(kb.updatedAt)}</span>
    </div>
    <div class="knowledge-card-footer">
      ${knowledgeEmbeddingTag(kb.embeddingStatus)}
      <div>
        <button class="button ghost small" data-knowledge-toggle="${escapeHtml(kb.id)}">${kb.enabled ? "停用" : "启用"}</button>
        <button class="button ghost small" data-knowledge-edit="${escapeHtml(kb.id)}">编辑</button>
        <button class="button ghost small" data-knowledge-reindex="${escapeHtml(kb.id)}" ${state.knowledgeActionLoadingId === kb.id ? "disabled" : ""}>${state.knowledgeActionLoadingId === kb.id ? "Loading" : "重新索引"}</button>
        <button class="button ghost small" data-knowledge-delete="${escapeHtml(kb.id)}">删除</button>
      </div>
    </div>
  </article>`;
}

function renderKnowledgeEmpty() {
  return `<div class="empty knowledge-empty">
    <div class="empty-icon">▤</div>
    <div>暂无匹配知识库</div>
    <span class="subtle">调整搜索或筛选条件，或新增一个知识库。</span>
  </div>`;
}

function renderKnowledgePagination(total, page, totalPages) {
  return `<div class="knowledge-pagination">
    <span>共 ${total} 条 · 第 ${page}/${totalPages} 页</span>
    <div>
      <button class="button small" data-knowledge-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>上一页</button>
      <button class="button small" data-knowledge-page="${page + 1}" ${page >= totalPages ? "disabled" : ""}>下一页</button>
    </div>
  </div>`;
}

function renderKnowledgeDetail(kb) {
  return `<div class="knowledge-detail">
    <div class="knowledge-detail-head">
      <div>
        <h2>${escapeHtml(kb.name)}</h2>
        <p>${escapeHtml(kb.description)}</p>
      </div>
      <div class="knowledge-detail-actions">
        <button class="button" data-knowledge-toggle="${escapeHtml(kb.id)}">${kb.enabled ? "停用" : "启用"}</button>
        <button class="button" data-knowledge-edit="${escapeHtml(kb.id)}">编辑</button>
        <button class="button primary" data-knowledge-reindex="${escapeHtml(kb.id)}">重新索引</button>
      </div>
    </div>
    <div class="knowledge-detail-stats">
      <div><span>状态</span>${knowledgeStatusTag(kb.status)}</div>
      <div><span>Embedding</span>${knowledgeEmbeddingTag(kb.embeddingStatus)}</div>
      <div><span>更新时间</span><b>${escapeHtml(kb.updatedAt)}</b></div>
      <div><span>数据量</span><b>${knowledgeFormatCount(kb)}</b></div>
    </div>
    <div class="knowledge-detail-section">
      <h3>文档</h3>
      ${kb.documents.length ? kb.documents.map(renderKnowledgeDocument).join("") : `<div class="empty">暂无文档</div>`}
    </div>
    <div class="knowledge-detail-section">
      <h3>Chunk 预览</h3>
      ${renderKnowledgeChunks(kb)}
    </div>
  </div>`;
}

function renderKnowledgeDocument(doc) {
  return `<div class="knowledge-document-row">
    <div><b>${escapeHtml(doc.name)}</b><span>${escapeHtml(doc.type)} · ${escapeHtml(doc.size)}</span></div>
    <div>${knowledgeStatusTag(doc.status)}</div>
    <div>${escapeHtml(doc.updatedAt)}</div>
    <div>${doc.chunks.length} Chunk</div>
  </div>`;
}

function renderKnowledgeChunks(kb) {
  const chunks = kb.documents.flatMap((doc) => doc.chunks.map((chunk) => ({ ...chunk, docName: doc.name }))).slice(0, 6);
  if (!chunks.length) return `<div class="empty">暂无 Chunk</div>`;
  return chunks
    .map(
      (chunk) => `<div class="preview-chunk">
        <div class="preview-chunk-head"><span>${escapeHtml(chunk.id)}</span><span>${chunk.chars}字符 · ${escapeHtml(chunk.embedding)}</span></div>
        <div class="subtle">${escapeHtml(chunk.docName)}</div>
        <div>${escapeHtml(chunk.text)}</div>
      </div>`
    )
    .join("");
}

function renderKnowledgeCreatePage() {
  ensureKnowledgeState();
  return `
    <section class="module-layout knowledge-create-shell">
      ${renderAiSubnav("knowledge")}
      <div class="knowledge-create-page">
        <div class="knowledge-breadcrumb">自有知识库  ›  新增知识库</div>
        <div class="knowledge-create-body">
          ${renderKnowledgeCreateStepper()}
          <div class="knowledge-work-area">${renderKnowledgeCreateContent()}</div>
        </div>
        <div class="knowledge-footer">
          <button class="button" data-knowledge-prev>上一步</button>
          <button class="button primary" data-knowledge-next ${state.knowledgeCreateStep === 1 && !state.knowledgeCreateType ? "disabled" : ""}>${state.knowledgeCreateStep === 4 ? "确认" : "下一步"}</button>
        </div>
      </div>
    </section>`;
}

function renderKnowledgeCreateStepper() {
  const steps = ["添加数据", "上传文件", "数据处理", "完成"];
  return `<aside class="vertical-stepper">
    ${steps
      .map((label, index) => {
        const n = index + 1;
        const status = state.knowledgeCreateStep === n ? "active" : state.knowledgeCreateStep > n ? "done" : "";
        return `<div class="k-step ${status}">
          <span class="k-step-circle">${state.knowledgeCreateStep > n ? "✓" : n}</span>
          <span>${label}</span>
        </div>`;
      })
      .join("")}
  </aside>`;
}

function renderKnowledgeCreateContent() {
  if (state.knowledgeCreateStep === 1) return renderContentTypeStep();
  if (state.knowledgeCreateStep === 2) return renderKnowledgeDataStep();
  if (state.knowledgeCreateStep === 3) return renderSegmentStep();
  return renderKnowledgeCompleteStep();
}

function renderContentTypeStep() {
  return `<div class="knowledge-step-content">
    <h3>选择内容类型</h3>
    <div class="knowledge-type-grid">
      ${knowledgeSupportedSources.map((source) => renderKnowledgeTypeCard(source)).join("")}
    </div>
  </div>`;
}

function renderKnowledgeTypeCard(source) {
  const active = state.knowledgeCreateType === source.id;
  return `<div class="knowledge-type-card ${active ? "active" : ""}" data-knowledge-type="${escapeHtml(source.id)}">
    <span class="knowledge-source-icon">${escapeHtml(source.icon)}</span>
    <div>
      <b>${escapeHtml(source.label)}</b>
      <div class="subtle">${escapeHtml(source.description)}</div>
    </div>
  </div>`;
}

function renderKnowledgeDataStep() {
  if (state.knowledgeCreateType === "website") return renderWebsiteUploadStep();
  if (state.knowledgeCreateType === "text") return renderTextUploadStep();
  return renderFileUploadStep();
}

function renderTextUploadStep() {
  return `<div class="knowledge-form-panel">
    <div class="form-row">
      <div class="label">文本名称 <span style="color:var(--red)">*</span></div>
      <input class="input" style="width:100%" placeholder="请输入" value="${escapeHtml(state.knowledgeCreateDraft.name || "物流售后 FAQ")}" data-knowledge-draft="name">
    </div>
    <div class="form-row">
      <div class="label">文本来源</div>
      <input class="input" style="width:100%" placeholder="请输入" value="${escapeHtml(state.knowledgeCreateDraft.description || "人工整理文本")}" data-knowledge-draft="description">
    </div>
    <div class="form-row">
      <div class="label">文本内容 <span style="color:var(--red)">*</span></div>
      <div class="editor-toolbar kb-toolbar">
        <b>H</b><b>B</b><i>I</i><span>S</span><span>•</span><span>1.</span><span>≡</span><span>🔗</span><span>▧</span><span>▦</span><span>⌄</span><span>↶</span><span>↷</span>
      </div>
      <div class="rich-editor kb-editor" contenteditable="true" data-knowledge-text>促销-欧洲海运普船(卡派)的派送时效为开船后45天左右。

欧洲海运包税线路：深圳装柜 → 盐田港 → 鹿特丹港落港 → 荷兰/比利时清关 → 再通过快递或卡车派送至欧洲仓库或商业地址。

收货限制：仅接收普货，拒收皮革、纺织品、包包、服装、鞋子、螺丝、玩具、纯玻璃、纯塑料以及税率超过6%的产品。</div>
    </div>
  </div>`;
}

function renderWebsiteUploadStep() {
  return `<div class="knowledge-form-panel website-form-panel">
    <div class="blue-tip">我们会自动收集网站中的页面列表和页面文本内容，页面最大数量不超过500个</div>
    <div class="form-row">
      <div class="label">网站名称</div>
      <input class="input" style="width:100%" placeholder="请输入" value="${escapeHtml(state.knowledgeCreateDraft.name || "官网帮助中心")}" data-knowledge-draft="name">
    </div>
    <div class="form-row">
      <div class="label">网站链接 <span style="color:var(--red)">*</span></div>
      <textarea class="textarea website-textarea" style="width:100%" placeholder="请输入网页链接，每个网页链接必须单独一行" data-knowledge-draft="description">https://example.com/help</textarea>
      <div class="hint">请包含完整的网站地址，包括http开头，例如：https://jijyun.cn</div>
    </div>
    <div class="or-line"><span>或</span></div>
    <div class="form-row">
      <div class="label">网站地图(SiteMap)</div>
      <input class="input" style="width:100%" placeholder="请输入" value="https://example.com/sitemap.xml">
      <div class="hint">Mock 会记录采集任务，真实后端需要异步抓取、去重、清洗和索引。</div>
    </div>
    <div class="form-row inline-row">
      <div>
        <div class="label">支持动态页面内容获取</div>
        <div class="hint">动态页面获取需要使用额外的内容获取工具，有额外费用</div>
      </div>
      <span class="switch" data-switch></span>
    </div>
  </div>`;
}

function renderFileUploadStep() {
  const source = knowledgeSourceById(state.knowledgeCreateType);
  return `<div class="knowledge-form-panel">
    <div class="upload-drop knowledge-file-drop ${state.knowledgeUpload?.status === "失败" ? "error" : ""}" data-knowledge-file-upload>
      <b>将 ${escapeHtml(source.label)} 文件拖拽至此区域或 <span>选择文件上传</span></b>
      <p>支持 PDF、Word、Excel、TXT、CSV。Mock 上传会展示进度、状态和失败提示。</p>
    </div>
    ${renderKnowledgeUploadState()}
  </div>`;
}

function renderKnowledgeUploadState() {
  const upload = state.knowledgeUpload;
  if (!upload) return `<div class="hint">当前未选择文件。点击上传区域可模拟上传。</div>`;
  return `<div class="knowledge-upload-state">
    <div class="knowledge-upload-row">
      <div><b>${escapeHtml(upload.name)}</b><span>${escapeHtml(upload.status)}</span></div>
      <b>${upload.progress}%</b>
    </div>
    <div class="knowledge-progress"><span style="width:${upload.progress}%"></span></div>
    ${upload.error ? `<div class="knowledge-upload-error">${escapeHtml(upload.error)}</div>` : ""}
  </div>`;
}

const knowledgePreviewChunks = [
  ["#001", "72字符", "问题: 什么是物流?　答案: 物流是指物品从供应地到接收地的实体流动过程，包括运输、储存、装卸、搬运、包装、流通加工、配送、信息处理等基本功能。"],
  ["#002", "51字符", "问题: 下单渠道：倔强青铜-欧海经济BS-DD，注意事项　答案: 单件计费重不足12KG按12KG计算"],
  ["#003", "16字符", "一票一件额外加收100RMB/票"],
  ["#004", "49字符", "重货优惠1:200减0.2 1:250减0.5 1:330减1 单票计费重小于200KG无优惠"],
  ["#005", "49字符", "问题: 欧洲海运包税运行线路　答案: 深圳装柜-盐田-鹿特丹落港-荷兰/比利时清关-快递/卡车派送"],
];

function renderSegmentStep() {
  const custom = state.knowledgeSegmentMode === "custom";
  return `<div class="segment-layout knowledge-vector-layout">
    <div class="segment-main">
      <div class="knowledge-vector-intro">
        <h3>分段与清洗设置</h3>
        <p>支持自动分段、自定义分段和逐行向量。Mock 会生成 Chunk 预览，真实后端接入后在此提交分段参数和清洗规则。
          <a href="./assets/templates/knowledge-row-vector-template.xlsx" download="知识库文件导入模板.xlsx" data-template-download>下载"逐行向量"示例文件</a>
        </p>
      </div>
      <div class="knowledge-file-meta">
        <span class="excel-file-icon">K</span>
        <div><b>${escapeHtml(state.knowledgeUpload?.name || state.knowledgeCreateDraft.name || "物流问答库.xlsx")}</b><small>${escapeHtml(state.knowledgeUpload?.size || "0.01M")}</small></div>
        <label class="vector-radio"><input type="radio" name="knowledge-vector" data-vector-mode="row" ${state.knowledgeVectorMode === "row" ? "checked" : ""}> 逐行向量</label>
        <label class="vector-radio"><input type="radio" name="knowledge-vector" data-vector-mode="segment" ${state.knowledgeVectorMode === "segment" ? "checked" : ""}> 分段向量</label>
      </div>
      <h3 class="segment-section-title">分段设置</h3>
      <div class="segment-card ${!custom ? "active" : ""}" data-segment-mode="auto">
        <span class="segment-icon">▤</span>
        <div><b>自动分段与清洗</b><div class="subtle">自动设置分段规则与预处理规则，如果不了解这些参数建议选择此项</div></div>
      </div>
      <div class="segment-card ${custom ? "active expanded" : ""}" data-segment-mode="custom">
        <span class="segment-icon dark">⌘</span>
        <div style="flex:1">
          <b>自定义</b>
          <div class="subtle">自定义分段规则、分段长度以及预处理规则等参数</div>
          ${custom ? renderCustomSegmentSettings() : ""}
        </div>
      </div>
    </div>
    <aside class="preview-pane">
      <h3>分段预览</h3>
      ${renderSegmentPreview(custom || state.knowledgePreview || state.knowledgeVectorMode === "row")}
    </aside>
  </div>`;
}

function renderCustomSegmentSettings() {
  const rules = [
    "替换掉连续的空格，换行符和制表符",
    "删除所有URL",
    "删除所有电子邮件地址",
    "删除所有电话号码",
    "删除身份证号码",
    "删除银行卡号码",
  ];
  return `<div class="segment-expanded-body">
    <div class="form-row">
      <div class="label"><span style="color:var(--red)">*</span> 分段标识符</div>
      <input class="input" style="width:100%" value="\\n" placeholder="请输入">
      <div class="hint">通过您输入的标识符对数据集内容进行切割分段，支持输入文本、数字、符号、字符串转义符，如：\\n</div>
    </div>
    <div class="form-row">
      <div class="label"><span style="color:var(--red)">*</span> 分段最大长度</div>
      <input class="input" style="width:100%" value="2000" placeholder="请输入">
      <div class="hint">对您提供的数据集进行分割，便于向量化处理，分段最大长度为2000，最小长度为800。</div>
    </div>
    <div class="label">文本预处理规则</div>
    <div class="rule-list">
      ${rules.map((rule, index) => `<label><input type="checkbox" ${index === 0 ? "checked" : ""}> ${escapeHtml(rule)}</label>`).join("")}
    </div>
    <div class="segment-actions">
      <button class="button" data-reset-segment>重置</button>
      <button class="button primary" data-generate-preview>生成预览</button>
    </div>
  </div>`;
}

function renderSegmentPreview(visible) {
  if (!visible) return `<div class="empty preview-empty">选择分段方式后生成 Chunk 预览</div>`;
  return knowledgePreviewChunks
    .map(
      ([id, count, text]) => `<div class="preview-chunk">
        <div class="preview-chunk-head"><span>${id}</span><span>${count}</span></div>
        <div>${escapeHtml(text)}</div>
      </div>`
    )
    .join("");
}

function renderKnowledgeCompleteStep() {
  const source = knowledgeSourceById(state.knowledgeCreateType);
  return `<div class="knowledge-complete">
    <span class="complete-icon">✓</span>
    <h3>知识库创建完成</h3>
    <div class="form-row" style="width:100%">
      <div class="label">知识库名称 <span style="color:var(--red)">*</span></div>
      <input class="input" style="width:100%" placeholder="请输入知识库名称" value="${escapeHtml(state.knowledgeCreateDraft.name || `${source.label}知识库`)}" data-knowledge-final-name>
    </div>
    <div class="complete-summary">
      <div><span>来源</span><b>${escapeHtml(source.label)}</b></div>
      <div><span>分段</span><b>${state.knowledgeSegmentMode === "custom" ? "自定义" : state.knowledgeVectorMode === "row" ? "逐行" : "自动"}</b></div>
      <div><span>Embedding</span><b>Mock完成</b></div>
    </div>
  </div>`;
}
