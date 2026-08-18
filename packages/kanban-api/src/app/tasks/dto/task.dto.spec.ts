import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';
import { MoveTaskDto } from './move-task.dto';

describe('task DTOs', () => {
  it('trims task text and rejects blank titles', async () => {
    const valid = plainToInstance(CreateTaskDto, { title: '  Ship API  ', description: '  Notes  ' });
    expect(await validate(valid)).toHaveLength(0);
    expect(valid).toMatchObject({ title: 'Ship API', description: 'Notes' });
    expect(await validate(plainToInstance(CreateTaskDto, { title: ' ' }))).not.toHaveLength(0);
  });

  it('requires one-based integer move positions', async () => {
    const dto = plainToInstance(MoveTaskDto, { columnId: '6cc8084d-c885-4435-a288-a3fbc74a5b8a', position: 0 });
    expect((await validate(dto)).map(({ property }) => property)).toContain('position');
  });
});
