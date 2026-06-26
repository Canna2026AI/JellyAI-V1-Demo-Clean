"use client";

import { useTransition } from "react";

export function LogoutButton({ className = "admin-logout" }: { className?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      className={className}
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login";
        })
      }
    >
      {pending ? "退出中..." : "退出登录"}
    </button>
  );
}
