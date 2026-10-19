import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { CitasService } from './citas.service';
import { BuscarCitasDto } from './dto/buscar-citas.dto';
import { TransaccionCitaDto } from './dto/transaccion-cita.dto';

@Controller('citas')
export class CitasController {
  constructor(private readonly service: CitasService) {}

  @Get('con-relaciones')
  conRelaciones() {
    return this.service.conRelaciones();
  }

  @Get('buscar')
  buscar(@Query() query: BuscarCitasDto) {
    return this.service.buscar(query.estado);
  }

  @Post('transaccion')
  @HttpCode(200)
  transaccion(@Body() dto: TransaccionCitaDto) {
    return this.service.transaccion(dto);
  }
}
