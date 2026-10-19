import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Cita } from './cita.entity';

@Entity('medico')
@Unique('medico_correo_key', ['correo'])
export class Medico {
  @PrimaryGeneratedColumn({
    name: 'id_medico',
    primaryKeyConstraintName: 'medico_pkey',
  })
  id_medico: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100 })
  apellido: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  correo: string | null;

  @OneToMany(() => Cita, (cita) => cita.medico)
  citas: Cita[];
}
