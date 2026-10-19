import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Cita } from '../entities/cita.entity';
import { postgresCode } from '../common/database-error';
import { TransaccionCitaDto } from './dto/transaccion-cita.dto';

@Injectable()
export class CitasService {
  constructor(
    @InjectRepository(Cita) private readonly citaRepo: Repository<Cita>,
    private readonly dataSource: DataSource,
  ) {}

  conRelaciones() {
    return this.citaRepo.find({ relations: { paciente: true, medico: true } });
  }

  buscar(estado: string) {
    return this.citaRepo
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.paciente', 'p')
      .innerJoinAndSelect('c.medico', 'm')
      .where('c.estado = :estado', { estado })
      .orderBy('c.fecha', 'ASC')
      .addOrderBy('c.hora', 'ASC')
      .getMany();
  }

  async transaccion(dto: TransaccionCitaDto) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const cita = await manager.findOne(Cita, {
          where: { id_cita: dto.id_cita },
          lock: { mode: 'pessimistic_write' },
        });
        if (!cita)
          throw new NotFoundException(`Cita ${dto.id_cita} no encontrada.`);
        // Cambio 1: válido; se revierte si falla el segundo UPDATE.
        await manager.update(Cita, dto.id_cita, { motivo: dto.motivo });
        // Cambio 2: debe cumplir ck_cita_estado de la práctica 9.
        await manager.update(Cita, dto.id_cita, { estado: dto.estado });
        return manager.findOneByOrFail(Cita, { id_cita: dto.id_cita });
      });
    } catch (error) {
      if (postgresCode(error) === '23514') {
        throw new BadRequestException(
          'El estado viola ck_cita_estado. Use Programada, Confirmada, Cancelada o Completada. No se guardó ningún cambio.',
        );
      }
      throw error;
    }
  }
}
