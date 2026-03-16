type ToastVariant = 'success' | 'error';

let addToastFn: ((message: string, variant: ToastVariant) => void) | null = null;

export function showToast(message: string, variant: ToastVariant = 'success') {
  addToastFn?.(message, variant);
}

export function registerToastFn(fn: typeof addToastFn) {
  addToastFn = fn;
}
