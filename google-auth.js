(function () {
  let loader;
  function loadLibrary() {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) return Promise.resolve();
    if (!loader) loader = new Promise(function (resolve, reject) {
      const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
      script.onload = resolve; script.onerror = function () { reject(new Error('โหลด Google Sign-In ไม่สำเร็จ')); };
      document.head.append(script);
    });
    return loader;
  }
  window.LMS_GOOGLE = {
    async requestCode(emailHint) {
      const config = window.LMS_CONFIG || {};
      if (!config.googleEnabled || !config.googleClientId) throw new Error('ยังไม่ได้เปิด Google Sign-In');
      await loadLibrary();
      return new Promise(function (resolve, reject) {
        const client = google.accounts.oauth2.initCodeClient({ client_id: config.googleClientId,
          scope: 'openid email profile', ux_mode: 'popup',
          login_hint: emailHint || undefined,
          callback: function (response) { if (response.error || !response.code) reject(new Error('Google Sign-In ไม่สำเร็จ')); else resolve(response.code); },
          error_callback: function () { reject(new Error('ปิดหน้าต่าง Google หรือเชื่อมต่อไม่สำเร็จ')); }
        });
        client.requestCode();
      });
    }
  };
}());
