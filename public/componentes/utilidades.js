// @build: 2026-06-30.19-00-00 | id: COMP-UTIL-V1 | desc: Utilidades globales compartidas (sanitización, fechas, etc.)
window.UIHarden = {
  escape: function(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};