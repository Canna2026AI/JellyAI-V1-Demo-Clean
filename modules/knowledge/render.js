// Knowledge base module renderers.

function renderStandaloneKnowledge() {
  return `<section class="module-layout">
    ${renderAiSubnav("knowledge")}
    ${renderKnowledgeManager()}
  </section>`;
}

function renderKnowledgeCreatePage() {
  ensureKnowledgeCreateState();
  return `
    <section class="module-layout knowledge-create-shell">
      ${renderAiSubnav("knowledge")}
      <div class="knowledge-create-page">
        <div class="knowledge-breadcrumb">
          <button type="button" data-knowledge-breadcrumb="list">自有知识库</button>
          <span>›</span>
          <button type="button" data-knowledge-breadcrumb="create">新增知识库</button>
        </div>
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
        return `<button class="k-step ${status}" type="button" data-knowledge-step-jump="${n}">
          <span class="k-step-circle">${state.knowledgeCreateStep > n ? "✓" : n}</span>
          <span>${label}</span>
        </button>`;
      })
      .join("")}
  </aside>`;
}

function renderKnowledgeCreateContent() {
  if (state.knowledgeCreateStep === 1) return renderContentTypeStep();
  if (state.knowledgeCreateStep === 2) return renderTextUploadStep();
  if (state.knowledgeCreateStep === 3) return renderSegmentStep();
  return renderKnowledgeCompleteStep();
}

function renderContentTypeStep() {
  const primary = [
    ["文本", "文", "手动录入问答、说明、报价规则等文本内容"],
    ["整个网站", "网", "抓取网站页面并生成可检索知识"],
    ["文档文件", "档", "上传 PDF、Word、Excel、TXT 等文档"],
  ];
  const thirdParty = [
    ["集简云数据表", "数", "同步表格数据作为知识来源"],
    ["微信公众号(官方接口)", "微", "通过官方接口同步公众号素材"],
    ["微信公众号(页面采集)", "微", "采集公开页面内容并清洗入库"],
    ["飞书文档", "飞", "同步飞书文档内容"],
  ];
  return `<div class="knowledge-step-content">
    <h3>选择内容类型</h3>
    <div class="knowledge-type-grid">
      ${primary.map(([title, ico, desc]) => renderKnowledgeTypeCard(title, ico, desc)).join("")}
    </div>
    <div class="knowledge-group-title">第三方数据源</div>
    <div class="knowledge-type-grid">
      ${thirdParty.map(([title, ico, desc]) => renderKnowledgeTypeCard(title, ico, desc)).join("")}
    </div>
  </div>`;
}

function renderKnowledgeTypeCard(title, ico, desc) {
  const active = state.knowledgeCreateType === title;
  return `<div class="knowledge-type-card ${active ? "active" : ""}" data-knowledge-type="${title}">
    <span class="knowledge-source-icon">${ico}</span>
    <div>
      <b>${title}</b>
      <div class="subtle">${desc}</div>
    </div>
  </div>`;
}

function renderTextUploadStep() {
  if (state.knowledgeCreateType === "整个网站") return renderWebsiteUploadStep();
  if (state.knowledgeCreateType === "文档文件") return renderFileUploadStep();
  return `<div class="knowledge-form-panel">
    <div class="form-row">
      <div class="label">文本名称 <span style="color:var(--red)">*</span></div>
      <input class="input" style="width:100%" placeholder="请输入" value="欧洲海运物流问答">
    </div>
    <div class="form-row">
      <div class="label">文本来源</div>
      <input class="input" style="width:100%" placeholder="请输入" value="物流问答库">
    </div>
    <div class="form-row">
      <div class="label">文本内容 <span style="color:var(--red)">*</span></div>
      <div class="editor-toolbar kb-toolbar">
        <b>H</b><b>B</b><i>I</i><span>S</span><span>•</span><span>1.</span><span>≡</span><span>🔗</span><span>▧</span><span>▦</span><span>⌄</span><span>↶</span><span>↷</span>
      </div>
      <div class="rich-editor kb-editor" contenteditable="true">促销-欧洲海运普船(卡派)的派送时效为开船后45天左右。

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
      <input class="input" style="width:100%" placeholder="请输入" value="">
    </div>
    <div class="form-row">
      <div class="label">网站链接 <span style="color:var(--red)">*</span></div>
      <textarea class="textarea website-textarea" style="width:100%" placeholder="请输入网页链接，每个网页链接必须单独一行"></textarea>
      <div class="hint">请包含完整的网站地址，包括http开头，例如：https://jijyun.cn</div>
    </div>
    <div class="or-line"><span>或</span></div>
    <div class="form-row">
      <div class="label">网站地图(SiteMap) <span style="color:var(--red)">*</span></div>
      <input class="input" style="width:100%" placeholder="请输入">
      <div class="hint">请在此处填写网站地图的完整地址，示例：https://www.abc.com/site.xml</div>
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
  const file = state.knowledgeUploadedFile;
  return `<div class="knowledge-form-panel">
    <div class="upload-drop knowledge-file-drop ${state.knowledgeUploading ? "uploading" : ""}" data-knowledge-file-upload>
      <input type="file" data-knowledge-file-input accept=".xlsx,.xls,.csv,.txt,.md,.json,.pdf,.doc,.docx,.ppt,.pptx,.html" hidden>
      ${
        file
          ? `<div class="knowledge-uploaded-file"><span class="excel-file-icon">${escapeHtml(file.icon || knowledgeFileIcon(file.name))}</span><div><b>${escapeHtml(file.name)}</b><p>${formatKnowledgeFileSize(file.size)} · 已上传到本地知识库数据库</p></div></div><button class="button" type="button" data-knowledge-reupload>重新上传</button>`
          : `<b>${state.knowledgeUploading ? "正在上传并识别文件..." : "将文件拖拽至此区域或"} <span>${state.knowledgeUploading ? "" : "选择文件上传"}</span></b>
      <p>仅支持：EXCEL, PDF, DOCX, PPTX, JSON, CSV, EPUB, MD, MBOX, EML, HTML, TXT,<br>
      DOT, WPS, WPT, DOCM, DOTM, POTX, PPS, PPSX, DPS, DPT, PPTM, POTM, PPSM, XLT,<br>
      ET, ETT, XLSM, XLTM, LRC, C, CPP, H, ASM, S, JAVA, BAT, BAS, PRG, CMD格式。导入的数据<br>
      摘要单个大小20MB以内，EXCEL、CSV单个大小5M以内。</p>`
      }
    </div>
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
  ensureKnowledgeCreateState();
  const custom = state.knowledgeSegmentMode === "custom";
  const file = state.knowledgeUploadedFile || { name: "请先上传文件", size: 0, icon: "文" };
  return `<div class="segment-layout knowledge-vector-layout">
    <div class="segment-main">
      <div class="knowledge-vector-intro">
        <h3>表格文件向量化方式选择</h3>
        <p>选择表格文件处理方式：如果您的表格文件内容包含合并单元格等形式的内容，可选择“分段向量”方式。您的表格文件内容是逐行录入，例如问题在A列，回答在B列可选择“逐行向量”方式，
          <a href="./assets/templates/knowledge-row-vector-template.xlsx" download="知识库文件导入模板.xlsx" data-template-download>下载"逐行向量"示例文件</a>
        </p>
      </div>
      <div class="knowledge-file-meta">
        <span class="excel-file-icon">${escapeHtml(file.icon || knowledgeFileIcon(file.name))}</span>
        <div><b>${escapeHtml(file.name)}</b><small>${formatKnowledgeFileSize(file.size)}</small></div>
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
      ${renderSegmentPreview(custom)}
    </aside>
  </div>`;
}

function renderCustomSegmentSettings() {
  ensureKnowledgeCreateState();
  const config = state.knowledgeCustomSegment;
  const rules = [
    ["trimSpaces", "替换掉连续的空格，换行符和制表符"],
    ["removeUrls", "删除所有URL"],
    ["removeEmails", "删除所有电子邮件地址"],
    ["removePhones", "删除所有电话号码"],
    ["removeIds", "删除身份证号码"],
    ["removeCards", "删除银行卡号码"],
  ];
  return `<div class="segment-expanded-body">
    <div class="form-row">
      <div class="label"><span style="color:var(--red)">*</span> 分段标识符</div>
      <input class="input" style="width:100%" data-segment-delimiter value="${escapeHtml(config.delimiter)}" placeholder="请输入">
      <div class="hint">通过您输入的标识符对数据集内容进行切割分段，支持输入文本、数字、符号、字符串转义符，如：\\n</div>
    </div>
    <div class="form-row">
      <div class="label"><span style="color:var(--red)">*</span> 分段最大长度</div>
      <input class="input" style="width:100%" data-segment-max-length value="${escapeHtml(config.maxLength)}" placeholder="请输入">
      <div class="hint">对您提供的数据集进行分割，便于向量化处理，分段最大长度为2000，最小长度为800。</div>
    </div>
    <div class="label">文本预处理规则</div>
    <div class="rule-list">
      ${rules.map(([key, rule]) => `<label><input type="checkbox" data-segment-rule="${key}" ${config.rules?.[key] ? "checked" : ""}> ${rule}</label>`).join("")}
    </div>
    <div class="segment-actions">
      <button class="button" data-reset-segment>重置</button>
      <button class="button primary" data-generate-preview>生成预览</button>
    </div>
  </div>`;
}

function renderSegmentPreview(custom) {
  const chunks = state.knowledgeUploadPreview?.length ? state.knowledgeUploadPreview : knowledgePreviewChunks.map(([id, count, text]) => ({
    id,
    count,
    text,
    vectorType: state.knowledgeVectorMode === "segment" ? "分段向量" : "逐行向量",
    segmentMode: custom ? "自定义" : "自动分段与清洗",
    relation: `${custom ? "自定义分段" : "自动分段"} → 1 条向量`,
  }));
  if (!chunks.length) return `<div class="preview-empty subtle">上传文件后将显示自动分段、逐行向量或分段向量关系。</div>`;
  return chunks
    .map(
      (chunk) => `<div class="preview-chunk">
        <div class="preview-chunk-head"><span>${escapeHtml(chunk.id)}</span><span>${escapeHtml(chunk.count)}</span></div>
        <div>${escapeHtml(chunk.text)}</div>
        <small>${escapeHtml(chunk.vectorType || "")} · ${escapeHtml(chunk.segmentMode || "")}</small>
        <em>${escapeHtml(chunk.relation || "")}</em>
      </div>`
    )
    .join("");
}

function renderKnowledgeCompleteStep() {
  ensureKnowledgeCreateState();
  const defaultName = state.knowledgeUploadedFile?.name?.replace(/\.[^.]+$/, "") || "物流问答";
  return `<div class="knowledge-complete">
    <div class="complete-icon">✓</div>
    <h3>知识库创建完成</h3>
    <div class="complete-summary">
      <div><span class="subtle">文件</span><b>${escapeHtml(state.knowledgeUploadedFile?.name || "未上传文件")}</b></div>
      <div><span class="subtle">向量方式</span><b>${state.knowledgeVectorMode === "segment" ? "分段向量" : "逐行向量"}</b></div>
      <div><span class="subtle">片段数量</span><b>${state.knowledgeUploadPreview?.length || 0} 条</b></div>
    </div>
    <div class="form-row" style="width:100%">
      <div class="label">知识库名称 <span style="color:var(--red)">*</span></div>
      <input class="input" id="knowledgeBaseNameInput" style="width:100%" placeholder="请输入知识库名称" value="${escapeHtml(defaultName)}">
    </div>
  </div>`;
}
