// Module modal renderers.

function renderSettingsModal() {
  if (!state.modal) return "";
if (state.modal === "inviteMember") {
    return modal("邀请成员", `
      <div class="form-row"><div class="label">成员邮箱或手机号 <span style="color:var(--red)">*</span></div><textarea class="textarea" style="width:100%" placeholder="每行一个成员">kelvin@example.com</textarea></div>
      <div class="form-row"><div class="label">分配角色</div><select class="select" style="width:100%"><option>客服坐席</option><option>小组管理员</option><option>数据分析员</option></select></div>
      <div class="form-row"><div class="label">可见小组</div><select class="select" style="width:100%"><option>gs4758</option><option>全部小组</option></select></div>
    `, "发送邀请", () => {
      state.modal = null;
      showToast("邀请已发送");
    });
  }

if (state.modal === "createRole") {
    return modal("新建角色", `
      <div class="form-row"><div class="label">角色名称 <span style="color:var(--red)">*</span></div><input class="input" style="width:100%" value="运营专员"></div>
      <div class="form-row"><div class="label">角色说明</div><textarea class="textarea" style="width:100%">可管理 AI微信营销任务、素材和对话记录。</textarea></div>
      <div class="form-row"><div class="label">权限范围</div>${["AI微信营销", "聚合对话", "联系人管理", "数据分析"].map((x) => `<label style="display:block; margin:8px 0"><input type="checkbox" checked> ${x}</label>`).join("")}</div>
    `, "创建", () => {
      state.modal = null;
      showToast("角色已创建");
    });
  }

if (state.modal === "alertBot") {
    return modal("添加报警机器人", `
      <div class="form-row"><div class="label">机器人名称</div><input class="input" style="width:100%" placeholder="请输入机器人名称"></div>
      <div class="form-row"><div class="label">Webhook地址</div><textarea class="textarea" style="width:100%" placeholder="请输入机器人 Webhook 地址"></textarea></div>
      <div class="form-row"><div class="label">报警推送设置</div>
        ${["托管账号掉线", "群发任务异常", "高阶任务异常", "每日数据提醒", "账号风控提醒"].map((x) => `<label style="display:block; margin:8px 0"><input type="checkbox" checked> ${x}</label>`).join("")}
      </div>
    `, "确定", () => {
      state.modal = null;
      showToast("报警机器人已添加");
    });
  }

  return "";
}
