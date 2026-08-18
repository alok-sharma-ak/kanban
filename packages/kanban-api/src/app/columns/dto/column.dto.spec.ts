import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateColumnDto } from './create-column.dto';
import { ReorderColumnsDto } from './reorder-columns.dto';

describe('column DTOs', () => {
  it('trims a valid column name and rejects blank input', async () => {
    const valid = plainToInstance(CreateColumnDto, { name: '  Review  ' });
    expect(await validate(valid)).toHaveLength(0);
    expect(valid.name).toBe('Review');
    expect(await validate(plainToInstance(CreateColumnDto, { name: '   ' }))).not.toHaveLength(0);
  });

  it('limits reorder arrays and validates UUIDs', async () => {
    const dto = plainToInstance(ReorderColumnsDto, { boardId: 'bad', columnIds: ['bad'] });
    expect((await validate(dto)).map(({ property }) => property).sort()).toEqual(['boardId', 'columnIds']);
  });
});
