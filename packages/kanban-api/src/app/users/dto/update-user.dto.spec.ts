import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateUserDto } from './update-user.dto';

describe('UpdateUserDto', () => {
  it('trims the name and normalizes the email', async () => {
    const dto = plainToInstance(UpdateUserDto, { name: '  User Name  ', email: '  USER@Example.COM ' });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({ name: 'User Name', email: 'user@example.com' });
  });

  it('rejects blank names and malformed email addresses', async () => {
    const dto = plainToInstance(UpdateUserDto, { name: '   ', email: 'not-an-email' });
    const errors = await validate(dto);
    expect(errors.map(({ property }) => property).sort()).toEqual(['email', 'name']);
  });
});
