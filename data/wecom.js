// Load WeCom mock/service scripts without changing index.html.
(function loadWecomServiceScripts() {
  if (typeof document === "undefined" || window.wecomService) return;
  document.write('<script src="./services/mock/wecomMock.js?v=wecom-20260626"></script>');
  document.write('<script src="./services/wecomService.js?v=wecom-20260626"></script>');
})();
