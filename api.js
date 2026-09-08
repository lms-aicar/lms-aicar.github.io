(function () {
  const messages = {
    UNAUTHENTICATED: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
    FORBIDDEN: 'บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้',
    INVALID_CREDENTIALS: 'รหัสผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
    TOO_MANY_ATTEMPTS: 'ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่',
    INVALID_ACTIVATION: 'รหัสเปิดใช้ไม่ถูกต้องหรือหมดอายุ',
    INTERNAL_ERROR: 'ระบบขัดข้อง กรุณาลองใหม่ภายหลัง'
  };
  window.LMS_API = {
    async call(action, fields, authenticated) {
      const config = window.LMS_CONFIG || {};
      if (!config.apiUrl) throw new Error('ยังไม่ได้ตั้งค่า URL ของระบบหลังบ้าน');
      const payload = Object.assign({}, fields || {}, { action: action });
      if (authenticated) payload.sessionToken = sessionStorage.getItem('lms_session_token') || '';
      const controller = new AbortController();
      const timeout = setTimeout(function () { controller.abort(); }, 60000);
      try {
        const response = await fetch(config.apiUrl, {
          method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify(payload), signal: controller.signal, credentials: 'omit', cache: 'no-store'
        });
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
