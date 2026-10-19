import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Cita } from './cita.entity';

@Entity('paciente')
@Unique('paciente_correo_key', ['correo'])
export class Paciente {
  @PrimaryGeneratedColumn({
    name: 'id_paciente',
    primaryKeyConstraintName: 'paciente_pkey',
  })
  id_paciente: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100 })
  apellido: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string | null;

  @Column({ type: 'date' })
  fecha_nacimiento: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  correo: string | null;

  @OneToMany(() => Cita, (cita) => cita.paciente)
  citas: Cita[];
}
