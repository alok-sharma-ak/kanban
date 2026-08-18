import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBoardDto } from './create-board.dto';
import { UpdateBoardDto } from './update-board.dto';

describe('board DTOs', () => {
  it('trims valid create input', async () => {
    const dto = plainToInstance(CreateBoardDto, { name: '  Roadmap  ', description: '  Delivery plan  ' });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({ name: 'Roadmap', description: 'Delivery plan' });
  });

  it('rejects blank names and oversized descriptions', async () => {
    const dto = plainToInstance(UpdateBoardDto, { name: '   ', description: 'x'.repeat(5001) });
    expect((await validate(dto)).map(({ property }) => property).sort()).toEqual(['description', 'name']);
  });
});
