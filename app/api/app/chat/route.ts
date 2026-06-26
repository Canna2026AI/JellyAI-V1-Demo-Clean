import { NextResponse } from "next/server";
import { requireApiTenantUser } from "@/lib/auth/api";
import { consumeTenantTokens, getTenantSelectedModel } from "@/lib/tokens";
import { sendTenantMessageSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;
  const { user } = auth;
  const body = await request.json().catch(() => null);
  const parsed = sendTenantMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "数据无效" }, { status: 400 });
  }

  const model = await getTenantSelectedModel(user.tenantId);
  if (!model) {
    return NextResponse.json({ error: "暂无可用模型，请联系平台管理员配置模型" }, { status: 409 });
  }

  try {
    const log = await consumeTenantTokens({
      tenantId: user.tenantId,
      userId: user.id,
      model,
      message: parsed.data.message,
    });

    return NextResponse.json({
      ok: true,
      model,
      usage: {
        promptTokens: log.promptTokens,
        completionTokens: log.completionTokens,
        totalTokens: log.totalTokens,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "对话处理失败";
    const status = message.includes("Token 余额不足") ? 402 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
