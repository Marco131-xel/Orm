import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreatePacienteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellido: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string | null;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fecha_nacimiento debe tener formato YYYY-MM-DD',
  })
  fecha_nacimiento: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  correo?: string | null;
}
