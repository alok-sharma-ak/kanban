import { validate } from 'class-validator';
import { LoginDto, RefreshTokenDto, RegisterDto } from './dto';

describe('authentication DTO validation', () => {
  it('rejects blank names and weak passwords', async () => {
    const dto = Object.assign(new RegisterDto(), { name: '   ', email: 'user@example.com', password: 'allletters' });
    expect((await validate(dto)).map((error) => error.property)).toEqual(expect.arrayContaining(['name', 'password']));
  });
  it('accepts a valid registration and rejects malformed tokens', async () => {
    const registration = Object.assign(new RegisterDto(), { name: 'User', email: 'user@example.com', password: 'Industry123' });
    expect(await validate(registration)).toHaveLength(0);
    expect(await validate(Object.assign(new RefreshTokenDto(), { refreshToken: 'short' }))).not.toHaveLength(0);
    expect(await validate(Object.assign(new LoginDto(), { email: 'invalid', password: 'x' }))).not.toHaveLength(0);
  });
});
