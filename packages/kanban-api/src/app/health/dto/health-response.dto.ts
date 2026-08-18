import { ApiProperty } from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/auth';

export type DependencyStatus = 'up' | 'down';

export class LivenessChecksDto {
  @ApiProperty({ enum: ['up'] }) api!: 'up';
}

export class ReadinessChecksDto extends LivenessChecksDto {
  @ApiProperty({ enum: ['up', 'down'] }) postgres!: DependencyStatus;
  @ApiProperty({ enum: ['up', 'down'] }) redis!: DependencyStatus;
  @ApiProperty({ enum: ['up', 'down'] }) minio!: DependencyStatus;
  @ApiProperty({ enum: ['up', 'down'] }) outbox!: DependencyStatus;
}

export class LivenessResponseDto {
  @ApiProperty({ enum: ['ok'] }) status!: 'ok';
  @ApiProperty({ type: LivenessChecksDto }) checks!: LivenessChecksDto;
}

export class ReadinessResponseDto {
  @ApiProperty({ enum: ['ok'] }) status!: 'ok';
  @ApiProperty({ type: ReadinessChecksDto }) checks!: ReadinessChecksDto;
}

export class ReadinessUnavailableResponseDto extends ErrorResponseDto {
  @ApiProperty({ type: ReadinessChecksDto }) checks!: ReadinessChecksDto;
}
