/** Notifications helper — shows toast */
export function notify(toast, kind, title, message) {
  toast.show({ kind, title, message });
}
