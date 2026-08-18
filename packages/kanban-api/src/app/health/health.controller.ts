import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/auth';
import { LivenessResponseDto, ReadinessResponseDto, ReadinessUnavailableResponseDto } from './dto/health-response.dto';
import { HealthService } from './health.service';

@ApiTags('health') @Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public() @Get('live')
  @ApiOperation({ summary: 'Check process liveness without probing dependencies' })
  @ApiOkResponse({ type: LivenessResponseDto })
  live(): LivenessResponseDto { return this.healthService.live(); }

  @Public() @Get()
  @ApiOperation({ summary: 'Legacy alias for the readiness check' })
  @ApiOkResponse({ type: ReadinessResponseDto })
  @ApiServiceUnavailableResponse({ type: ReadinessUnavailableResponseDto })
  check(): Promise<ReadinessResponseDto> { return this.healthService.ready(); }

  @Public() @Get('ready')
  @ApiOperation({ summary: 'Check PostgreSQL, Redis, MinIO, and cleanup-worker readiness' })
  @ApiOkResponse({ type: ReadinessResponseDto })
  @ApiServiceUnavailableResponse({ type: ReadinessUnavailableResponseDto })
  ready(): Promise<ReadinessResponseDto> { return this.healthService.ready(); }
}
