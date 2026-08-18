import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class UpdateBoardDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 160 })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional() @IsString() @Length(1, 160) @Matches(/\S/, { message: 'name must not be blank' })
  name?: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional() @IsString() @MaxLength(5000)
  description?: string;
}
