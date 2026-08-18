import { isAccessTokenUsable } from './token';

function token(exp: number) {
  return `header.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.signature`;
}

describe('access token timing', () => {
  it('accepts a token outside the refresh window', () => {
    expect(isAccessTokenUsable(token(Math.floor(Date.now() / 1000) + 120))).toBe(true);
  });

  it('rejects expired, near-expiry, and malformed tokens', () => {
    expect(isAccessTokenUsable(token(Math.floor(Date.now() / 1000) + 10))).toBe(false);
    expect(isAccessTokenUsable('invalid')).toBe(false);
    expect(isAccessTokenUsable(undefined)).toBe(false);
  });
});
