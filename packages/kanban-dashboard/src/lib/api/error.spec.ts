import { ApiError, apiErrorMessage } from './error';

describe('API error messages', () => {
  it('maps authentication and dependency failures safely', () => {
    expect(apiErrorMessage(new ApiError(401, 'backend detail'))).toContain('incorrect');
    expect(apiErrorMessage(new ApiError(429, 'backend detail'))).toContain('Too many');
    expect(apiErrorMessage(new ApiError(503, 'backend detail'))).toContain('temporarily unavailable');
  });

  it('does not leak unknown exception details', () => {
    expect(apiErrorMessage(new Error('secret connection detail'))).not.toContain('secret');
  });
});
