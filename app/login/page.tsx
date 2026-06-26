import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="brand">
          <span className="brand-mark" />
          <span>Jelly AI</span>
        </div>
        <div>
          <h1>多客户隔离的智能客服运营系统</h1>
          <p>
            平台管理员统一开通客户与账号，客户登录后只访问自己的智能体、知识库、对话和运营数据。
          </p>
        </div>
      </section>
      <aside className="auth-panel">
        <LoginForm />
      </aside>
    </main>
  );
}
