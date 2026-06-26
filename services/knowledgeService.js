// Knowledge service boundary.
// Uses the real local backend when available and falls back to Mock data for
// static-file preview.

const KnowledgeService = {
  baseUrl: "",

  async request(path, options = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  statusLabel(status) {
    return status === "active" || status === "enabled" || status === "启用" ? "启用" : status === "indexing" ? "索引中" : "停用";
  },

  nowLabel() {
    return new Date().toLocaleString("zh-CN", { hour12: false });
  },

  mapKnowledgeBase(row) {
    const metadata = row.metadata || {};
    const type = row.kind || metadata.type || "多模态";
    const updatedAt = row.updatedAt ? new Date(row.updatedAt).toLocaleString("zh-CN", { hour12: false }) : this.nowLabel();
    return {
      id: row.id,
      name: row.name,
      description: row.description || "",
      type,
      sourceType: metadata.sourceType || type,
      status: this.statusLabel(row.status),
      enabled: row.status !== "disabled" && row.status !== "inactive" && row.status !== "停用",
      documentCount: Number(row.documentCount || 0),
      chunkCount: Number(row.vectorCount || 0),
      embeddingStatus: metadata.embeddingStatus || "已完成",
      size: metadata.size || `${Number(row.vectorCount || 0).toLocaleString("zh-CN")} vectors`,
      updatedAt,
      createdAt: row.createdAt ? new Date(row.createdAt).toLocaleString("zh-CN", { hour12: false }) : updatedAt,
      icon: metadata.icon || "◎",
      documents: Array.isArray(metadata.documents) ? metadata.documents : [],
    };
  },

  async listKnowledgeBases(params = {}) {
    try {
      const qs = new URLSearchParams(params).toString();
      const payload = await this.request(`/api/app/knowledge-bases${qs ? `?${qs}` : ""}`);
      const items = (payload.knowledgeBases || []).map((row) => this.mapKnowledgeBase(row));
      return { items, total: items.length, page: 1, pageSize: items.length || 1, totalPages: 1 };
    } catch (error) {
      console.info("Knowledge API unavailable, using local mock data.", error.message);
    }
    const items = window.KnowledgeMock?.listKnowledgeBases(params) || [];
    return { items, total: items.length, page: 1, pageSize: items.length || 1, totalPages: 1 };
  },

  async getKnowledgeBase(id) {
    return window.KnowledgeMock?.getKnowledgeBase(id) || null;
  },

  async createKnowledgeBase(payload) {
    try {
      const result = await this.request("/api/app/knowledge-bases", {
        method: "POST",
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
          kind: payload.type || payload.sourceType || "多模态",
          documentCount: payload.documentCount || 1,
          vectorCount: payload.chunkCount || payload.documents?.reduce?.((sum, doc) => sum + (doc.chunks?.length || 0), 0) || 0,
          metadata: {
            sourceType: payload.sourceType,
            size: payload.size,
            icon: payload.icon,
            documents: payload.documents || [],
            analysis: payload.analysis || null,
            vectorMode: payload.vectorMode,
            segmentMode: payload.segmentMode,
            vectorStore: "mock",
          },
        }),
      });
      return this.mapKnowledgeBase(result.knowledgeBase);
    } catch (error) {
      console.warn("Knowledge create API failed, using local mock:", error.message);
    }
    return window.KnowledgeMock?.createKnowledgeBase(payload) || null;
  },

  async updateKnowledgeBase(id, payload) {
    return window.KnowledgeMock?.updateKnowledgeBase(id, payload) || null;
  },

  async deleteKnowledgeBase(id) {
    return window.KnowledgeMock?.deleteKnowledgeBase(id) || false;
  },

  async listDocuments(id) {
    const kb = window.KnowledgeMock?.getKnowledgeBase(id);
    return { items: kb?.documents || [], total: kb?.documents?.length || 0 };
  },

  async deleteDocument(id, documentId) {
    void id;
    void documentId;
    return { ok: true };
  },

  async listChunks(id, params = {}) {
    void params;
    const kb = window.KnowledgeMock?.getKnowledgeBase(id);
    const items = (kb?.documents || []).flatMap((doc) => (doc.chunks || []).map((chunk) => ({ ...chunk, documentId: doc.id, documentName: doc.name })));
    return { items, total: items.length, page: 1, pageSize: items.length || 1, totalPages: 1 };
  },

  async toggleKnowledgeBase(id) {
    return window.KnowledgeMock?.toggleKnowledgeBase(id) || null;
  },

  async uploadDocument(file, options = {}) {
    const payload = await this.fileToPayload(file, options);
    return payload;
  },

  async previewChunks(payload) {
    return window.KnowledgeMock?.previewChunks(payload) || [];
  },

  async reindexKnowledgeBase(id, options = {}) {
    void options;
    return window.KnowledgeMock?.reindexKnowledgeBase(id) || null;
  },

  async searchKnowledge(params = {}) {
    void params;
    return { items: [], total: 0 };
  },

  extensionOf(fileName = "") {
    const match = String(fileName).toLowerCase().match(/\.([a-z0-9]+)$/);
    return match ? match[1] : "";
  },

  async readFileAsArrayBuffer(file) {
    if (file.arrayBuffer) return file.arrayBuffer();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("文件读取失败"));
      reader.readAsArrayBuffer(file);
    });
  },

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  },

  decodeBytes(buffer) {
    return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  },

  decodeEntities(text = "") {
    return String(text)
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  },

  htmlToText(html = "") {
    return this.decodeEntities(
      String(html)
        .replace(/<script[\s\S]*?<\/script>/gi, "\n")
        .replace(/<style[\s\S]*?<\/style>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
    );
  },

  xmlToText(xml = "") {
    return this.decodeEntities(
      String(xml)
        .replace(/<w:tab\/>/g, "\t")
        .replace(/<w:br\/>/g, "\n")
        .replace(/<\/(w:p|a:p|row)>/g, "\n")
        .replace(/<[^>]+>/g, " ")
    );
  },

  normalizeKnowledgeText(text = "") {
    return this.decodeEntities(String(text))
      .replace(/\r\n?/g, "\n")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]+/g, " ")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  },

  readLittle16(bytes, offset) {
    return bytes[offset] | (bytes[offset + 1] << 8);
  },

  readLittle32(bytes, offset) {
    return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
  },

  async inflateZipEntry(bytes, method) {
    if (method === 0) return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    if (method !== 8) throw new Error(`暂不支持压缩方式 ${method}`);
    if (typeof DecompressionStream === "undefined") throw new Error("当前浏览器不支持解压缩 Office 文档");
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Response(stream).arrayBuffer();
  },

  async readZipEntries(arrayBuffer, wanted = () => true) {
    const bytes = new Uint8Array(arrayBuffer);
    let eocd = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i -= 1) {
      if (this.readLittle32(bytes, i) === 0x06054b50) {
        eocd = i;
        break;
      }
    }
    if (eocd < 0) throw new Error("未找到 ZIP 目录结构");
    const entries = this.readLittle16(bytes, eocd + 10);
    let offset = this.readLittle32(bytes, eocd + 16);
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const result = {};
    for (let index = 0; index < entries; index += 1) {
      if (this.readLittle32(bytes, offset) !== 0x02014b50) break;
      const method = this.readLittle16(bytes, offset + 10);
      const compressedSize = this.readLittle32(bytes, offset + 20);
      const nameLength = this.readLittle16(bytes, offset + 28);
      const extraLength = this.readLittle16(bytes, offset + 30);
      const commentLength = this.readLittle16(bytes, offset + 32);
      const localOffset = this.readLittle32(bytes, offset + 42);
      const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + nameLength));
      if (wanted(name)) {
        const localNameLength = this.readLittle16(bytes, localOffset + 26);
        const localExtraLength = this.readLittle16(bytes, localOffset + 28);
        const dataStart = localOffset + 30 + localNameLength + localExtraLength;
        const compressed = bytes.slice(dataStart, dataStart + compressedSize);
        result[name] = await this.inflateZipEntry(compressed, method);
      }
      offset += 46 + nameLength + extraLength + commentLength;
    }
    return result;
  },

  parseSharedStrings(xml = "") {
    const values = [];
    const matches = String(xml).match(/<si[\s\S]*?<\/si>/g) || [];
    matches.forEach((item) => {
      values.push(this.xmlToText(item).replace(/\s+/g, " ").trim());
    });
    return values;
  },

  parseXlsxRows(sheetXml = "", sharedStrings = []) {
    const rows = [];
    const rowMatches = String(sheetXml).match(/<row\b[\s\S]*?<\/row>/g) || [];
    rowMatches.forEach((rowXml) => {
      const cells = [];
      const cellMatches = rowXml.match(/<c\b([^>]*)>[\s\S]*?<\/c>/g) || [];
      cellMatches.forEach((cellXml) => {
        const type = (cellXml.match(/\bt="([^"]+)"/) || [])[1] || "";
        const value = (cellXml.match(/<v>([\s\S]*?)<\/v>/) || [])[1] || "";
        const inline = (cellXml.match(/<is>([\s\S]*?)<\/is>/) || [])[1] || "";
        if (type === "s") cells.push(sharedStrings[Number(value)] || "");
        else if (type === "inlineStr") cells.push(this.xmlToText(inline).replace(/\s+/g, " ").trim());
        else cells.push(this.decodeEntities(value).trim());
      });
      if (cells.some(Boolean)) rows.push(cells);
    });
    return rows;
  },

  rowsToCsvText(rows = []) {
    return rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "");
            return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
          })
          .join(",")
      )
      .join("\n");
  },

  async extractOfficeText(arrayBuffer, ext) {
    const warnings = [];
    if (ext === "docx") {
      const entries = await this.readZipEntries(arrayBuffer, (name) => /^word\/(document|header|footer)\d*\.xml$/.test(name));
      const parts = Object.values(entries).map((entry) => this.xmlToText(this.decodeBytes(entry)));
      return { text: parts.join("\n"), warnings };
    }
    if (ext === "xlsx") {
      const entries = await this.readZipEntries(arrayBuffer, (name) => name === "xl/sharedStrings.xml" || /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
      const sharedStrings = entries["xl/sharedStrings.xml"] ? this.parseSharedStrings(this.decodeBytes(entries["xl/sharedStrings.xml"])) : [];
      const rows = Object.keys(entries)
        .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
        .flatMap((name) => this.parseXlsxRows(this.decodeBytes(entries[name]), sharedStrings));
      return { text: this.rowsToCsvText(rows), warnings };
    }
    if (ext === "pptx") {
      const entries = await this.readZipEntries(arrayBuffer, (name) => /^ppt\/slides\/slide\d+\.xml$/.test(name));
      const parts = Object.values(entries).map((entry) => this.xmlToText(this.decodeBytes(entry)));
      return { text: parts.join("\n\n"), warnings };
    }
    return { text: "", warnings };
  },

  extractPdfText(decoded = "") {
    const warnings = ["PDF 本地解析采用轻量文本抽取，扫描件或压缩对象需要后端 OCR/PDF 服务补齐。"];
    const strings = [];
    const literalMatches = decoded.match(/\((?:\\.|[^\\)]){2,}\)/g) || [];
    literalMatches.forEach((match) => {
      strings.push(match.slice(1, -1).replace(/\\n/g, "\n").replace(/\\r/g, "\n").replace(/\\\(/g, "(").replace(/\\\)/g, ")"));
    });
    const hexMatches = decoded.match(/<([0-9A-Fa-f\s]{8,})>/g) || [];
    hexMatches.slice(0, 200).forEach((match) => {
      const hex = match.replace(/[<>\s]/g, "");
      let text = "";
      for (let i = 0; i < hex.length; i += 2) {
        const code = Number.parseInt(hex.slice(i, i + 2), 16);
        if (Number.isFinite(code) && code >= 32 && code < 127) text += String.fromCharCode(code);
      }
      if (text.trim()) strings.push(text);
    });
    return { text: strings.join("\n"), warnings };
  },

  async extractFileText(file, arrayBuffer, ext) {
    const decoded = this.decodeBytes(arrayBuffer);
    const warnings = [];
    try {
      if (["docx", "xlsx", "pptx"].includes(ext)) return this.extractOfficeText(arrayBuffer, ext);
    } catch (error) {
      warnings.push(`${ext.toUpperCase()} 解包解析失败，已保存文件元数据等待后端解析：${error.message}`);
      return {
        text: `文件名: ${file.name}\n文件类型: ${file.type || ext.toUpperCase()}\n文件大小: ${file.size} bytes\n请接入后端文档解析服务补全文档正文。`,
        warnings,
      };
    }
    if (ext === "pdf") {
      const pdf = this.extractPdfText(decoded);
      return { text: pdf.text || decoded, warnings: warnings.concat(pdf.warnings) };
    }
    if (["html", "htm"].includes(ext)) return { text: this.htmlToText(decoded), warnings };
    if (ext === "json") {
      try {
        return { text: JSON.stringify(JSON.parse(decoded), null, 2), warnings };
      } catch {
        return { text: decoded, warnings: warnings.concat("JSON 格式未完全规范，已按文本清洗。") };
      }
    }
    if (["doc", "xls", "ppt"].includes(ext)) warnings.push("旧版 Office 二进制格式当前采用可读文本抽取，完整解析需要后端转换服务。");
    return { text: decoded, warnings };
  },

  parseDelimitedRows(text = "", delimiter = ",") {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    const source = String(text).replace(/\r\n?/g, "\n");
    for (let i = 0; i < source.length; i += 1) {
      const char = source[i];
      const next = source[i + 1];
      if (char === '"') {
        if (quoted && next === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === delimiter && !quoted) {
        row.push(cell.trim());
        cell = "";
      } else if (char === "\n" && !quoted) {
        row.push(cell.trim());
        if (row.some(Boolean)) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }
    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
    return rows;
  },

  guessDelimiter(text = "", ext = "") {
    if (ext === "tsv") return "\t";
    const firstLine = String(text).split(/\n/).find((line) => line.trim()) || "";
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    return tabCount > commaCount ? "\t" : ",";
  },

  buildRowChunks(rows = [], options = {}) {
    if (!rows.length) return [];
    const headers = rows[0].map((cell, index) => cell || `字段${index + 1}`);
    const dataRows = rows.length > 1 ? rows.slice(1) : rows;
    return dataRows
      .filter((row) => row.some(Boolean))
      .slice(0, 500)
      .map((row, index) => {
        const text = row
          .map((cell, cellIndex) => {
            const key = rows.length > 1 ? headers[cellIndex] || `字段${cellIndex + 1}` : `字段${cellIndex + 1}`;
            return cell ? `${key}: ${cell}` : "";
          })
          .filter(Boolean)
          .join("；");
        return {
          id: `#${String(index + 1).padStart(3, "0")}`,
          chars: text.length,
          embedding: "已完成",
          vectorMode: "row",
          source: options.fileName || options.sourceType || "row-source",
          text,
        };
      });
  },

  splitSegmentChunks(text = "", options = {}) {
    const maxChars = options.segmentMode === "custom" ? 900 : 520;
    const blocks = String(text)
      .split(/\n{2,}|(?<=[。！？!?；;])\s+/)
      .map((item) => item.trim())
      .filter(Boolean);
    const chunks = [];
    let current = "";
    blocks.forEach((block) => {
      if (!current) {
        current = block;
      } else if (`${current}\n${block}`.length <= maxChars) {
        current = `${current}\n${block}`;
      } else {
        chunks.push(current);
        current = block;
      }
      while (current.length > maxChars) {
        chunks.push(current.slice(0, maxChars));
        current = current.slice(maxChars);
      }
    });
    if (current) chunks.push(current);
    return chunks.slice(0, 300).map((chunk, index) => ({
      id: `#${String(index + 1).padStart(3, "0")}`,
      chars: chunk.length,
      embedding: "已完成",
      vectorMode: "segment",
      source: options.fileName || options.sourceType || "segment-source",
      text: chunk,
    }));
  },

  analyzeKnowledgeContent(rawText = "", options = {}) {
    const ext = options.ext || this.extensionOf(options.fileName || "");
    const warnings = Array.isArray(options.warnings) ? options.warnings.slice() : [];
    let cleanedText = this.normalizeKnowledgeText(rawText);
    if (!cleanedText && options.fileName) {
      cleanedText = `文件名: ${options.fileName}\n文件类型: ${options.mimeType || ext || "未知"}\n文件大小: ${options.size || 0} bytes`;
      warnings.push("未抽取到正文，已保存文件元数据作为待补全文档。");
    }
    const rowPreferred = options.vectorMode === "row" || ["csv", "tsv", "xlsx", "xls"].includes(ext) || options.sourceType === "jijyun_table";
    const delimiter = this.guessDelimiter(cleanedText, ext);
    const rows = rowPreferred ? this.parseDelimitedRows(cleanedText, delimiter).filter((row) => row.some(Boolean)) : [];
    const rowChunks = rows.length >= 2 ? this.buildRowChunks(rows, options) : [];
    const chunks = rowChunks.length ? rowChunks : this.splitSegmentChunks(cleanedText, options);
    if (!chunks.length) warnings.push("未生成有效 Chunk，请补充更完整的文本或文件内容。");
    return {
      originalChars: String(rawText).length,
      cleanedChars: cleanedText.length,
      rows: rows.length,
      columns: rows[0]?.length || 0,
      chunkCount: chunks.length,
      vectorMode: rowChunks.length ? "row" : "segment",
      segmentMode: options.segmentMode || "auto",
      cleanedText,
      chunks,
      warnings,
      summary: `${rowChunks.length ? "逐行向量" : "分段向量"} · ${chunks.length} Chunk · ${cleanedText.length} 字符`,
    };
  },

  buildDocumentFromAnalysis(analysis, options = {}) {
    const name = options.documentName || options.fileName || options.name || "知识来源";
    return {
      id: `doc-${Date.now()}`,
      name,
      type: options.sourceLabel || options.sourceType || "文档",
      status: "已完成",
      size: options.sizeLabel || `${Math.max(1, Math.round((analysis.cleanedChars || 0) / 1024))}KB`,
      updatedAt: this.nowLabel(),
      chunks: analysis.chunks || [],
      analysis: {
        summary: analysis.summary,
        rows: analysis.rows,
        columns: analysis.columns,
        cleanedChars: analysis.cleanedChars,
        warnings: analysis.warnings,
      },
    };
  },

  async fileToPayload(file, options = {}) {
    const ext = this.extensionOf(file.name);
    const arrayBuffer = await this.readFileAsArrayBuffer(file);
    const extracted = await this.extractFileText(file, arrayBuffer, ext);
    const sizeLabel = `${Math.max(1, Math.round(file.size / 1024))}KB`;
    const analysis = this.analyzeKnowledgeContent(extracted.text, {
      ...options,
      ext,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      sizeLabel,
      warnings: extracted.warnings,
    });
    const document = this.buildDocumentFromAnalysis(analysis, {
      ...options,
      fileName: file.name,
      documentName: file.name,
      sizeLabel,
    });
    return {
      ...options,
      fileName: file.name,
      documentName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      sizeLabel,
      contentBase64: this.arrayBufferToBase64(arrayBuffer),
      cleanedText: analysis.cleanedText,
      analysis,
      chunks: analysis.chunks,
      chunkCount: analysis.chunkCount,
      documentCount: 1,
      documents: [document],
    };
  },
};

if (typeof window !== "undefined") window.KnowledgeService = KnowledgeService;
