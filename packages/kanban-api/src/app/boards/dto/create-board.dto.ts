import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class CreateBoardDto {
  @ApiProperty({ minLength: 1, maxLength: 160, example: 'Product Roadmap' })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @Length(1, 160) @Matches(/\S/, { message: 'name must not be blank' })
  name!: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional() @IsString() @MaxLength(5000)
  description?: string;
}
