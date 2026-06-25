const WALLET_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const JAVASCRIPT_PROTOCOL_REGEX = /javascript:/gi;
const EVENT_HANDLER_REGEX = /on\w+\s*=/gi;

export function isValidWalletAddress(address: string): boolean {
  return WALLET_ADDRESS_REGEX.test(address);
}

export function sanitizeString(str: string): string {
  const replaceUntilStable = (input: string, pattern: RegExp): string => {
    let current = input;
    let previous: string;
    do {
      previous = current;
      current = current.replace(pattern, '');
    } while (current !== previous);
    return current;
  };

  return [SCRIPT_TAG_REGEX, JAVASCRIPT_PROTOCOL_REGEX, EVENT_HANDLER_REGEX].reduce(
    (value, pattern) => replaceUntilStable(value, pattern),
    str,
  );
}

export function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject((obj as Record<string, unknown>)[key]);
      }
    }
    return sanitized;
  }
  return obj;
}
