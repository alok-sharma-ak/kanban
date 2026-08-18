import { isUniqueViolation } from './database-errors';

describe('isUniqueViolation', () => {
  it('recognizes direct and wrapped PostgreSQL unique violations', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true);
    expect(isUniqueViolation({ driverError: { code: '23505' } })).toBe(true);
    expect(isUniqueViolation({ code: '23503' })).toBe(false);
  });
});
