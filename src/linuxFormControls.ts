import styles from './linux-form-controls.css?raw';

/** Presentation-only workaround, selected by runtime OS (not build host).
 * A head stylesheet is also copied by DetachedWindowPortal to its popup. */
export function installLinuxFormControls(target: Document, userAgent: string, platform = ''): void {
  // The Tauri main window uses a custom user agent without OS information.
  if (!/\bLinux\b/i.test(`${platform} ${userAgent}`) || /Android/i.test(userAgent)) return;
  if (target.getElementById('linux-form-controls')) return;
  const sheet = target.createElement('style');
  sheet.id = 'linux-form-controls';
  sheet.textContent = styles;
  target.head.appendChild(sheet);
}
