const crypto = require("crypto");

function sha1(values) {
  return crypto.createHash("sha1").update(values.sort().join("")).digest("hex");
}

function parseXmlValue(xml, tag) {
  const match = String(xml || "").match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? match[1] || match[2] || "" : "";
}

function decryptWecomMessage(encodingAesKey, encrypted) {
  if (!encodingAesKey || encodingAesKey.length !== 43) {
    throw new Error("WECOM_CALLBACK_AES_KEY must be 43 characters");
  }
  const aesKey = Buffer.from(`${encodingAesKey}=`, "base64");
  const decipher = crypto.createDecipheriv("aes-256-cbc", aesKey, aesKey.subarray(0, 16));
  decipher.setAutoPadding(false);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, "base64")), decipher.final()]);
  const pad = decrypted[decrypted.length - 1];
  const clean = decrypted.subarray(0, decrypted.length - pad);
  const msgLength = clean.readUInt32BE(16);
  return clean.subarray(20, 20 + msgLength).toString("utf8");
}

function verifyCallbackSignature({ token, signature, timestamp, nonce, encrypted }) {
  if (!token || !signature || !timestamp || !nonce || !encrypted) return false;
  return sha1([token, timestamp, nonce, encrypted]) === signature;
}

class WecomOfficialClient {
  constructor(env = process.env) {
    this.env = env;
    this.token = null;
    this.tokenExpiresAt = 0;
  }

  configured() {
    return Boolean(this.env.WECOM_CORP_ID && this.env.WECOM_CORP_SECRET);
  }

  async getAccessToken() {
    if (!this.configured()) {
      throw new Error("WECOM_CORP_ID and WECOM_CORP_SECRET are required");
    }
    if (this.token && Date.now() < this.tokenExpiresAt - 60000) return this.token;
    const url = new URL("https://qyapi.weixin.qq.com/cgi-bin/gettoken");
    url.searchParams.set("corpid", this.env.WECOM_CORP_ID);
    url.searchParams.set("corpsecret", this.env.WECOM_CORP_SECRET);
    const response = await fetch(url);
    const body = await response.json();
    if (!response.ok || body.errcode) {
      throw new Error(`WeCom gettoken failed: ${body.errmsg || response.statusText}`);
    }
    this.token = body.access_token;
    this.tokenExpiresAt = Date.now() + Number(body.expires_in || 7200) * 1000;
    return this.token;
  }

  async request(path, options = {}) {
    const accessToken = await this.getAccessToken();
    const url = new URL(`https://qyapi.weixin.qq.com${path}`);
    url.searchParams.set("access_token", accessToken);
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const body = await response.json();
    if (!response.ok || body.errcode) {
      throw new Error(`WeCom request failed: ${body.errmsg || response.statusText}`);
    }
    return body;
  }

  async listDepartments() {
    return this.request("/cgi-bin/department/list");
  }

  async listUsers(departmentId = 1) {
    return this.request(`/cgi-bin/user/list?department_id=${encodeURIComponent(departmentId)}&fetch_child=1`);
  }

  status() {
    return {
      configured: this.configured(),
      corpId: this.env.WECOM_CORP_ID ? `${this.env.WECOM_CORP_ID.slice(0, 4)}***` : "",
      hasCorpSecret: Boolean(this.env.WECOM_CORP_SECRET),
      hasCallbackToken: Boolean(this.env.WECOM_CALLBACK_TOKEN),
      hasCallbackAesKey: Boolean(this.env.WECOM_CALLBACK_AES_KEY),
    };
  }
}

class RpaAdapter {
  constructor(env = process.env) {
    this.env = env;
  }

  configured() {
    return Boolean(this.env.WECOM_RPA_WEBHOOK_URL);
  }

  async dispatch(action, payload) {
    if (!this.configured()) {
      return { provider: "local", status: "succeeded" };
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(this.env.WECOM_RPA_TIMEOUT_MS || 15000));
    try {
      const response = await fetch(this.env.WECOM_RPA_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.env.WECOM_RPA_TOKEN ? { Authorization: `Bearer ${this.env.WECOM_RPA_TOKEN}` } : {}),
        },
        body: JSON.stringify({ action, payload }),
        signal: controller.signal,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { provider: "rpa", status: "failed", error: body.error || response.statusText };
      }
      return { provider: "rpa", status: body.status || "queued", requestId: body.taskId || body.id || "" };
    } catch (error) {
      return { provider: "rpa", status: "failed", error: error.message };
    } finally {
      clearTimeout(timeout);
    }
  }

  status() {
    return {
      configured: this.configured(),
      url: this.env.WECOM_RPA_WEBHOOK_URL ? "configured" : "",
      hasToken: Boolean(this.env.WECOM_RPA_TOKEN),
    };
  }
}

function handleWebhookVerify(env, query) {
  const token = env.WECOM_CALLBACK_TOKEN;
  const aesKey = env.WECOM_CALLBACK_AES_KEY;
  const encrypted = query.echostr || "";
  if (!verifyCallbackSignature({
    token,
    signature: query.msg_signature,
    timestamp: query.timestamp,
    nonce: query.nonce,
    encrypted,
  })) {
    return { ok: false, status: 401, body: "invalid signature" };
  }
  if (aesKey) {
    return { ok: true, status: 200, body: decryptWecomMessage(aesKey, encrypted) };
  }
  return { ok: true, status: 200, body: encrypted };
}

function parseWebhookBody(env, query, rawBody) {
  const encrypted = parseXmlValue(rawBody, "Encrypt");
  if (!encrypted) return { encrypted: false, raw: rawBody };
  const valid = verifyCallbackSignature({
    token: env.WECOM_CALLBACK_TOKEN,
    signature: query.msg_signature,
    timestamp: query.timestamp,
    nonce: query.nonce,
    encrypted,
  });
  if (!valid) throw new Error("invalid signature");
  const message = env.WECOM_CALLBACK_AES_KEY ? decryptWecomMessage(env.WECOM_CALLBACK_AES_KEY, encrypted) : encrypted;
  return { encrypted: true, raw: rawBody, message };
}

module.exports = {
  RpaAdapter,
  WecomOfficialClient,
  decryptWecomMessage,
  handleWebhookVerify,
  parseWebhookBody,
  parseXmlValue,
  verifyCallbackSignature,
};
