import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from './auth';

export const ApiProtectedErrors = () => applyDecorators(
  ApiBadRequestResponse({ type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ type: ErrorResponseDto }),
  ApiForbiddenResponse({ type: ErrorResponseDto }),
  ApiNotFoundResponse({ type: ErrorResponseDto }),
  ApiResponse({ status: 429, type: ErrorResponseDto, description: 'Rate limit exceeded' }),
  ApiResponse({ status: 503, type: ErrorResponseDto, description: 'Required dependency unavailable' }),
);
