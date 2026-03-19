const KEY = 'daret_backoffice_device_id';

export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = 'web-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function getDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Web';
  const ua = navigator.userAgent;
  const m = ua.match(/\((.*?)\)/);
  const os = m ? m[1] : '';
  const browser = ua.includes('Edg') ? 'Edge' : ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : 'Browser';
  return `${browser}${os ? ` · ${os}` : ''}`.slice(0, 200);
}
