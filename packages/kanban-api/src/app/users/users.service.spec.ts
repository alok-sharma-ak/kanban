import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  let repository: { findOne: jest.Mock; save: jest.Mock };
  let service: UsersService;
  let user: User;

  beforeEach(() => {
    repository = { findOne: jest.fn(), save: jest.fn() };
    service = new UsersService(repository as unknown as Repository<User>);
    user = Object.assign(new User(), {
      id: 'c6e48db3-a824-4ea9-bbad-7291569ebc9b',
      name: 'Original Name',
      email: 'original@example.com',
      passwordHash: 'secret-hash',
      createdAt: now,
      updatedAt: now,
    });
  });

  it('maps a user without exposing the password hash', () => {
    expect(service.getCurrent(user)).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: now,
      updatedAt: now,
    });
    expect(service.getCurrent(user)).not.toHaveProperty('passwordHash');
  });

  it('normalizes profile fields and returns a sanitized response', async () => {
    repository.findOne.mockResolvedValue(null);
    repository.save.mockImplementation(async (value: User) => value);

    const result = await service.updateCurrent(user, {
      name: '  Updated Name  ',
      email: '  UPDATED@Example.COM  ',
    });

    expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'updated@example.com' } });
    expect(result).toMatchObject({ name: 'Updated Name', email: 'updated@example.com' });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects an email owned by another user', async () => {
    repository.findOne.mockResolvedValue(Object.assign(new User(), { id: 'another-user' }));

    await expect(service.updateCurrent(user, { email: 'taken@example.com' })).rejects.toThrow(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('converts a database uniqueness race into a conflict', async () => {
    repository.findOne.mockResolvedValue(null);
    repository.save.mockRejectedValue(Object.assign(new Error('duplicate'), { code: '23505' }));

    await expect(service.updateCurrent(user, { email: 'race@example.com' })).rejects.toThrow(ConflictException);
  });
});
