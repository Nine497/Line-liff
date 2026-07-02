export function unwrap(response) {
  // กรณีเป็น array อยู่แล้ว
  if (Array.isArray(response)) return response;

  // กรณี API ใหม่ { success, data }
  if (response?.data && Array.isArray(response.data)) {
    return response.data;
  }

  // fallback กันพัง
  return [];
}