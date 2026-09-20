(function () {
  const messages = {
    ENROLLMENT_REQUIRED: '\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49\u0e25\u0e07\u0e17\u0e30\u0e40\u0e1a\u0e35\u0e22\u0e19\u0e23\u0e32\u0e22\u0e27\u0e34\u0e0a\u0e32\u0e19\u0e35\u0e49 \u0e01\u0e23\u0e38\u0e13\u0e32\u0e25\u0e07\u0e17\u0e30\u0e40\u0e1a\u0e35\u0e22\u0e19\u0e40\u0e23\u0e35\u0e22\u0e19\u0e01\u0e48\u0e2d\u0e19',
    PRETEST_NOT_AVAILABLE: '\u0e23\u0e32\u0e22\u0e27\u0e34\u0e0a\u0e32\u0e19\u0e35\u0e49\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35 Pre-test \u0e17\u0e35\u0e48\u0e40\u0e1b\u0e34\u0e14\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19',
    PRETEST_ATTEMPTS_EXHAUSTED: '\u0e17\u0e33 Pre-test \u0e04\u0e23\u0e1a\u0e15\u0e32\u0e21\u0e08\u0e33\u0e19\u0e27\u0e19\u0e04\u0e23\u0e31\u0e49\u0e07\u0e17\u0e35\u0e48\u0e01\u0e33\u0e2b\u0e19\u0e14\u0e41\u0e25\u0e49\u0e27',
    PRETEST_ATTEMPT_INVALID: '\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e01\u0e32\u0e23\u0e17\u0e33 Pre-test \u0e17\u0e35\u0e48\u0e43\u0e0a\u0e49\u0e44\u0e14\u0e49 \u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e23\u0e34\u0e48\u0e21\u0e43\u0e2b\u0e21\u0e48',
    PRETEST_EXPIRED: '\u0e2b\u0e21\u0e14\u0e40\u0e27\u0e25\u0e32\u0e43\u0e19\u0e01\u0e32\u0e23\u0e17\u0e33 Pre-test \u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e23\u0e34\u0e48\u0e21\u0e43\u0e2b\u0e21\u0e48',
    UNAUTHENTICATED: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
    FORBIDDEN: 'บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้',
    INVALID_CREDENTIALS: 'รหัสผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
    INVALID_INPUT: 'ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบแล้วลองอีกครั้ง',
    INVALID_IDENTITY: 'อีเมล Google ที่เลือกต้องตรงกับอีเมลในบัญชี LMS กรุณาเลือกบัญชี Google ให้ถูกต้อง',
    ACCOUNT_NOT_REGISTERED: 'ยังไม่ได้เชื่อมบัญชี Google กรุณาเข้าสู่ระบบ LMS ด้วยรหัสผ่านก่อน แล้วกดเชื่อมบัญชี Google',
    CONFIGURATION_ERROR: 'การตั้งค่า Google ยังไม่สมบูรณ์ กรุณาแจ้งผู้ดูแลระบบ',
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
        // PBKDF2 verification is intentionally expensive. Apps Script can need
        // several minutes under load, so do not abort a valid sign-in early.
        }, 330000);
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
