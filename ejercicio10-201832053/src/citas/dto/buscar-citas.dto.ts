import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class BuscarCitasDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  estado: string;
}
