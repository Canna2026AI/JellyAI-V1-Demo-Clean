// Module modal renderers.

function renderMarketingModal() {
  if (!state.modal) return "";
if (state.modal === "blastTask") {
    const targetLabel = state.messageBlastSub === "group" ? "群聊" : state.messageBlastSub === "moments" ? "朋友圈可见客户" : "客户";
    return modal("新建群发任务", `
      <div class="grid-2">
        <div class="form-row"><div class="label">任务名称 <span style="color:var(--red)">*</span></div><input class="input" style="width:100%" value="欧洲物流报价唤醒"></div>
        <div class="form-row"><div class="label">群发类型</div><select class="select" style="width:100%"><option>${state.messageBlastSub === "group" ? "群聊群发" : state.messageBlastSub === "moments" ? "朋友圈发送" : "私聊群发"}</option></select></div>
        <div class="form-row"><div class="label">选择托管账号</div><select class="select" style="width:100%"><option>Canna / 在线</option><option>全部在线账号</option></select></div>
        <div class="form-row"><div class="label">发送时间</div><select class="select" style="width:100%"><option>立即发送</option><option>定时发送</option><option>循环发送</option></select></div>
      </div>
      <div class="form-row"><div class="label">选择${targetLabel}</div><select class="select" style="width:100%"><option>报价咨询客户</option><option>重点客户</option><option>手动选择</option></select></div>
      <div class="form-row"><div class="label">发送内容</div><textarea class="textarea" style="width:100%; min-height:96px">您好，近期欧洲海运有新的促销渠道，您可以发目的国、重量和件数，我帮您整理报价参考。</textarea></div>
      <div class="form-row"><div class="label">发送素材</div><button class="button" data-demo-action="选择素材">选择素材</button> <span class="subtle">已选择：欧洲海运报价说明</span></div>
    `, "创建任务", () => {
      state.modal = null;
      state.marketingSub = "blast";
      state.messageBlastTab = "tasks";
      showToast("群发任务已创建");
    });
  }

if (state.modal === "autoFriendTask") {
    const titleMap = { excel: "Excel加好友任务", group: "群聊加好友任务", card: "名片加好友任务", api: "API加好友任务" };
    const sourceField = {
      excel: `<div class="form-row"><div class="label">导入客户文件</div><button class="button">上传 Excel</button> <span class="subtle">支持手机号、微信号、备注名</span></div>`,
      group: `<div class="form-row"><div class="label">选择群聊</div><select class="select" style="width:100%"><option>欧诚国际物流群</option><option>欧洲报价交流群</option></select></div>`,
      card: `<div class="form-row"><div class="label">名片来源</div><select class="select" style="width:100%"><option>销售成员转发名片</option><option>群聊内客户名片</option></select></div>`,
      api: `<div class="form-row"><div class="label">API来源</div><select class="select" style="width:100%"><option>官网表单 Webhook</option><option>CRM新线索同步</option></select></div>`,
    }[state.autoFriendSub] || "";
    return modal(titleMap[state.autoFriendSub] || "自动加好友任务", `
      <div class="grid-2">
        <div class="form-row"><div class="label">任务名称 <span style="color:var(--red)">*</span></div><input class="input" style="width:100%" value="${titleMap[state.autoFriendSub] || "自动加好友"}"></div>
        <div class="form-row"><div class="label">加好友账号</div><select class="select" style="width:100%"><option>Canna / 在线</option><option>按空闲账号分配</option></select></div>
      </div>
      ${sourceField}
      <div class="grid-2">
        <div class="form-row"><div class="label">通过后打标签</div><select class="select" style="width:100%"><option>报价咨询</option><option>展会客户</option><option>重点客户</option></select></div>
        <div class="form-row"><div class="label">发送频率</div><select class="select" style="width:100%"><option>按防封设置执行</option><option>低频安全模式</option></select></div>
      </div>
      <div class="form-row"><div class="label">打招呼内容</div><textarea class="textarea" style="width:100%; min-height:92px">您好，我是Jelly AI客服，方便加您沟通物流报价吗？</textarea></div>
    `, "创建任务", () => {
      state.modal = null;
      state.marketingSub = "friend";
      showToast("自动加好友任务已创建");
    });
  }

if (state.modal === "keywordReplyTask") {
    return modal("添加关键词回复", `
      <div class="grid-2">
        <div class="form-row"><div class="label">任务名称 <span style="color:var(--red)">*</span></div><input class="input" style="width:100%" value="物流报价回复"></div>
        <div class="form-row"><div class="label">关键词类型</div><select class="select" style="width:100%"><option>模糊匹配</option><option>精准匹配</option></select></div>
        <div class="form-row"><div class="label">匹配规则</div><select class="select" style="width:100%"><option>包含任一关键词</option><option>包含全部关键词</option></select></div>
        <div class="form-row"><div class="label">生效范围</div><select class="select" style="width:100%"><option>私聊+群聊</option><option>仅私聊</option><option>仅群聊</option></select></div>
      </div>
      <div class="form-row"><div class="label">触发关键词</div><input class="input" style="width:100%" value="报价, 运费, 价格"></div>
      <div class="form-row"><div class="label">回复素材</div><select class="select" style="width:100%"><option>欧洲海运报价说明</option><option>售后处理FAQ</option></select></div>
    `, "保存", () => {
      state.modal = null;
      state.marketingSub = "operation";
      state.operationSub = "keywordReply";
      state.operationTab = "content";
      showToast("关键词回复已保存");
    });
  }

if (state.modal === "keywordGroupTask") {
    return modal("新建拉群任务", `
      <div class="grid-2">
        <div class="form-row"><div class="label">任务名称 <span style="color:var(--red)">*</span></div><input class="input" style="width:100%" value="欧洲物流关键词拉群"></div>
        <div class="form-row"><div class="label">目标群聊</div><select class="select" style="width:100%"><option>欧洲报价交流群</option><option>核心客户服务群</option></select></div>
        <div class="form-row"><div class="label">生效主体</div><select class="select" style="width:100%"><option>Canna</option><option>全部托管账号</option></select></div>
        <div class="form-row"><div class="label">匹配规则</div><select class="select" style="width:100%"><option>命中任一关键词</option><option>命中全部关键词</option></select></div>
      </div>
      <div class="form-row"><div class="label">触发关键词</div><input class="input" style="width:100%" value="欧洲, 报价, 海运"></div>
      <div class="form-row"><div class="label">入群提示语</div><textarea class="textarea" style="width:100%; min-height:86px">我为您拉一个欧洲物流报价交流群，群里可以同步获取渠道时效和价格参考。</textarea></div>
    `, "创建任务", () => {
      state.modal = null;
      state.marketingSub = "operation";
      state.operationTab = "content";
      showToast("拉群任务已创建");
    });
  }

if (state.modal === "sopTask") {
    const titleMap = { newCustomer: "新客户SOP", privateSop: "私聊SOP", groupSop: "群聊SOP", momentsSop: "朋友圈SOP", tagSop: "标签SOP" };
    return modal(`新建${titleMap[state.operationSub] || "SOP"}`, `
      <div class="grid-2">
        <div class="form-row"><div class="label">任务名称 <span style="color:var(--red)">*</span></div><input class="input" style="width:100%" value="沉默客户唤醒"></div>
        <div class="form-row"><div class="label">托管账号</div><select class="select" style="width:100%"><option>Canna / 在线</option><option>全部在线账号</option></select></div>
        <div class="form-row"><div class="label">触发条件</div><select class="select" style="width:100%"><option>客户通过好友后</option><option>打上指定标签后</option><option>客户长时间未回复</option></select></div>
        <div class="form-row"><div class="label">任务状态</div><select class="select" style="width:100%"><option>保存并开启</option><option>保存为草稿</option></select></div>
      </div>
      <div class="form-row"><div class="label">发送内容</div><textarea class="textarea" style="width:100%; min-height:96px">您好，我这边可以继续帮您整理欧洲物流报价。如果您方便，可以发一下目的国、重量和件数。</textarea></div>
    `, "保存", () => {
      state.modal = null;
      state.marketingSub = "operation";
      state.operationTab = "content";
      showToast("SOP任务已保存");
    });
  }

if (state.modal === "groupManageTask") {
    const title = { welcome: "入群欢迎语", robot: "自动踢人", invite: "接受群邀请", transfer: "多群转播" }[state.groupManageSub] || "群聊任务";
    return modal(`添加${title}`, `
      <div class="grid-2">
        <div class="form-row"><div class="label">任务名称 <span style="color:var(--red)">*</span></div><input class="input" style="width:100%" value="${title}规则"></div>
        <div class="form-row"><div class="label">生效群聊</div><select class="select" style="width:100%"><option>欧洲报价交流群</option><option>全部客户群</option></select></div>
      </div>
      <div class="form-row"><div class="label">规则内容</div><textarea class="textarea" style="width:100%; min-height:96px">${state.groupManageSub === "welcome" ? "欢迎加入群聊，请发送目的国+重量获取报价。" : "命中配置规则后自动执行，执行前记录操作日志。"}</textarea></div>
      <div class="form-row"><div class="label">状态</div><label><input type="radio" checked> 立即开启</label> <label style="margin-left:12px"><input type="radio"> 暂不开启</label></div>
    `, "保存", () => {
      state.modal = null;
      state.marketingSub = "groups";
      showToast(`${title}已保存`);
    });
  }

if (state.modal === "materialTask") {
    return modal("添加素材", `
      <div class="grid-2">
        <div class="form-row"><div class="label">素材标题 <span style="color:var(--red)">*</span></div><input class="input" style="width:100%" value="欧洲海运报价说明"></div>
        <div class="form-row"><div class="label">素材类型</div><select class="select" style="width:100%"><option>文本话术</option><option>图片</option><option>网页</option><option>文件</option></select></div>
      </div>
      <div class="form-row"><div class="label">素材摘要</div><input class="input" style="width:100%" value="按重量、体积、国家、地址类型计算报价"></div>
      <div class="form-row"><div class="label">素材内容</div><textarea class="textarea" style="width:100%; min-height:110px">您好，物流报价一般需要结合发货地、收货地、重量体积、货物类型和派送方式来核算。</textarea></div>
    `, "保存", () => {
      state.modal = null;
      state.marketingSub = "materials";
      showToast("素材已保存");
    });
  }

if (state.modal === "materialGroupTask") {
    return modal("新增素材分组", `
      <div class="form-row"><div class="label">分组名称 <span style="color:var(--red)">*</span></div><input class="input" style="width:100%" value="报价素材"></div>
      <div class="form-row"><div class="label">可见范围</div><select class="select" style="width:100%"><option>当前小组</option><option>全部小组</option><option>仅自己</option></select></div>
    `, "保存", () => {
      state.modal = null;
      showToast("素材分组已创建");
    });
  }

if (state.modal === "tagGroupTask") {
    return modal("新建自定义标签组", `
      <div class="form-row"><div class="label">标签组名称 <span style="color:var(--red)">*</span></div><input class="input" style="width:100%" value="客户意向"></div>
      <div class="form-row"><div class="label">标签</div><input class="input" style="width:100%" value="报价咨询, 待跟进, 重点客户"></div>
      <div class="form-row"><div class="label">可见范围</div><select class="select" style="width:100%"><option>全部小组</option><option>当前小组</option></select></div>
    `, "保存", () => {
      state.modal = null;
      state.marketingSub = "tags";
      showToast("自定义标签组已保存");
    });
  }

if (state.modal === "keywordTagTask") {
    return modal("添加关键词标签", `
      <div class="grid-2">
        <div class="form-row"><div class="label">规则名称 <span style="color:var(--red)">*</span></div><input class="input" style="width:100%" value="报价关键词打标"></div>
        <div class="form-row"><div class="label">关键词类型</div><select class="select" style="width:100%"><option>模糊匹配</option><option>精准匹配</option></select></div>
      </div>
      <div class="form-row"><div class="label">关键词</div><input class="input" style="width:100%" value="报价, 运费, 价格"></div>
      <div class="grid-2">
        <div class="form-row"><div class="label">企微标签</div><select class="select" style="width:100%"><option>报价咨询</option><option>售后中</option></select></div>
        <div class="form-row"><div class="label">自定义标签</div><select class="select" style="width:100%"><option>待跟进</option><option>重点客户</option></select></div>
      </div>
    `, "保存", () => {
      state.modal = null;
      state.marketingSub = "tags";
      state.marketingTagSub = "keyword";
      state.keywordTagTab = "rules";
      showToast("关键词标签规则已保存");
    });
  }

if (state.modal === "blacklistTask") {
    return modal("添加黑名单", `
      <div class="grid-2">
        <div class="form-row"><div class="label">客户名称</div><input class="input" style="width:100%" value="测试黑名单客户"></div>
        <div class="form-row"><div class="label">联系方式</div><input class="input" style="width:100%" value="138****9001"></div>
      </div>
      <div class="form-row"><div class="label">原因</div><textarea class="textarea" style="width:100%; min-height:86px">频繁骚扰或无效客户，暂停自动触达。</textarea></div>
    `, "保存", () => {
      state.modal = null;
      state.marketingSub = "friend";
      state.autoFriendSub = "blacklist";
      showToast("黑名单已保存");
    });
  }

  return "";
}
