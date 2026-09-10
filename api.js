(function () {
  const messages = {
    UNAUTHENTICATED: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
    FORBIDDEN: 'บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้',
    INVALID_CREDENTIALS: 'รหัสผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
    TOO_MANY_ATTEMPTS: 'ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่',
    SYSTEM_BUSY: 'ระบบกำลังทำงานอยู่ กรุณารอสักครู่แล้วลองใหม่',
    INVALID_ACTIVATION: 'รหัสเปิดใช้ไม่ถูกต้องหรือหมดอายุ',
    DUPLICATE_USER: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้แล้ว',
    EMAIL_QUOTA: 'ระบบส่งอีเมลยังไม่พร้อม กรุณาลองใหม่ภายหลัง',
    INTERNAL_ERROR: 'ระบบขัดข้อง กรุณาลองใหม่ภายหลัง'
  };
  window.LMS_API = {
    async call(action, fields, authenticated) {
      const config = window.LMS_CONFIG || {};
      if (!config.apiUrl) throw new Error('ยังไม่ได้ตั้งค่า URL ของระบบหลังบ้าน');
      const payload = Object.assign({}, fields || {}, { action: action });
      if (authenticated) payload.sessionToken = sessionStorage.getItem('lms_session_token') || '';
      const controller = new AbortController();
      // Password hashing runs server-side. Apps Script needs longer than a typical
      // fetch timeout for the configured 120,000 PBKDF2 iterations.
      let timeout;
      const timeoutError = new Error('Request timed out.');
      timeoutError.name = 'AbortError';
      const requestTimeout = new Promise(function (_, reject) {
        timeout = setTimeout(function () {
          controller.abort();
          reject(timeoutError);
        }, 150000);
      });
      try {
        const request = fetch(config.apiUrl, {
          method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify(payload), signal: controller.signal, credentials: 'omit', cache: 'no-store'
        });
        // Apps Script redirects do not always propagate AbortError to fetch.
        const response = await Promise.race([request, requestTimeout]);
        if (!response.ok) throw new Error('เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่');
        const result = await response.json();
        if (!result.ok) {
          const code = result.error && result.error.code;
          const error = new Error(messages[code] || 'ทำรายการไม่สำเร็จ กรุณาลองใหม่');
          error.code = code;
          if (code === 'UNAUTHENTICATED') sessionStorage.removeItem('lms_session_token');
          throw error;
        }
        return result.data;
      } catch (error) {
        if (error.name === 'AbortError') throw new Error('การเชื่อมต่อใช้เวลานานเกินไป กรุณาตรวจสอบสถานะก่อนลองใหม่');
        if (error instanceof TypeError) throw new Error('เชื่อมต่อระบบไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต');
        throw error;
      } finally { clearTimeout(timeout); }
    }
  };
}());
