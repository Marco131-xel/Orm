import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

export function postgresCode(error: unknown): string | undefined {
  if (error instanceof QueryFailedError) {
    return (error.driverError as { code?: string }).code;
  }
  return undefined;
}

export function rethrowPacienteError(error: unknown): never {
  if (postgresCode(error) === '23503') {
    throw new ConflictException(
      'No se puede eliminar el paciente porque tiene citas asociadas.',
    );
  }
  if (postgresCode(error) === '23505') {
    throw new ConflictException('Ya existe un paciente con ese correo.');
  }
  throw error;
}
