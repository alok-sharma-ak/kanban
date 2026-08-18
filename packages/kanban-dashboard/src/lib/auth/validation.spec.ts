import { loginSchema, registerSchema } from './validation';

describe('auth validation', () => {
  it('normalizes valid registration input', () => {
    expect(registerSchema.parse({ name: '  Ada  ', email: ' ADA@Example.COM ', password: 'Industry12345' }))
      .toEqual({ name: 'Ada', email: 'ada@example.com', password: 'Industry12345' });
  });

  it('rejects weak credentials and blank names', () => {
    expect(registerSchema.safeParse({ name: ' ', email: 'bad', password: 'short' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'bad', password: 'short' }).success).toBe(false);
  });
});
