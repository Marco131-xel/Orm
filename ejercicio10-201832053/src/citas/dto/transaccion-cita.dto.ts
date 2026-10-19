import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class TransaccionCitaDto {
  @IsInt()
  @Min(1)
  id_cita: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motivo: string;

  // Se valida la forma, pero PostgreSQL decide los estados permitidos.
  // Así el valor "Inventado" llega al CHECK y demuestra el ROLLBACK.
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  estado: string;
}
