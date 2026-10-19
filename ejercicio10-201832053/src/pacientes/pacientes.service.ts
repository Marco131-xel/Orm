import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from '../entities/paciente.entity';
import { rethrowPacienteError } from '../common/database-error';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';

@Injectable()
export class PacientesService {
  constructor(
    @InjectRepository(Paciente) private readonly repo: Repository<Paciente>,
  ) {}

  findAll() {
    return this.repo.find({ order: { id_paciente: 'ASC' } });
  }

  async findOne(id: number) {
    const paciente = await this.repo.findOneBy({ id_paciente: id });
    if (!paciente) throw new NotFoundException(`Paciente ${id} no encontrado.`);
    return paciente;
  }

  async create(dto: CreatePacienteDto) {
    try {
      return await this.repo.save(this.repo.create(dto));
    } catch (error) {
      rethrowPacienteError(error);
    }
  }

  async update(id: number, dto: UpdatePacienteDto) {
    const paciente = await this.findOne(id);
    try {
      return await this.repo.save(this.repo.merge(paciente, dto));
    } catch (error) {
      rethrowPacienteError(error);
    }
  }

  async remove(id: number) {
    try {
      const result = await this.repo.delete(id);
      if (result.affected === 0)
        throw new NotFoundException(`Paciente ${id} no encontrado.`);
      return { message: `Paciente ${id} eliminado.` };
    } catch (error) {
      rethrowPacienteError(error);
    }
  }
}
