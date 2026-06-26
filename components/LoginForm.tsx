"use client";

import { useState, useTransition } from "react";

export function LoginForm() {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: formData.get("account"),
          password: formData.get("password"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "登录失败");
        return;
      }
      window.location.href = payload.redirectTo;
    });
  }

  return (
    <form className="auth-card" action={onSubmit}>
      <div>
        <h2>登录 JellyAI</h2>
        <p className="muted">使用平台管理员或客户账号进入系统。</p>
      </div>
      <div className="form-stack">
        <label>
          账号
          <input className="input" name="account" autoComplete="username" required />
        </label>
        <label>
          密码
          <input className="input" name="password" type="password" autoComplete="current-password" required />
        </label>
      </div>
      {error ? <div className="error-text">{error}</div> : null}
      <button className="button primary" type="submit" disabled={pending}>
        {pending ? "登录中..." : "登录"}
      </button>
    </form>
  );
}
