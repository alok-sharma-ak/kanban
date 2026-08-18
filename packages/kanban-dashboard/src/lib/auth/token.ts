interface JwtPayload { exp?: number }

export function isAccessTokenUsable(token: string | undefined, skewSeconds = 30): boolean {
  if (!token) return false;
  try {
    const encodedPayload = token.split('.')[1];
    if (!encodedPayload) return false;
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as JwtPayload;
    return typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000) + skewSeconds;
  } catch {
    return false;
  }
}
