import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Paciente } from './paciente.entity';
import { Medico } from './medico.entity';

@Entity('cita')
@Check(
  'ck_cita_estado',
  "estado IN ('Programada', 'Confirmada', 'Cancelada', 'Completada')",
)
export class Cita {
  @PrimaryGeneratedColumn({
    name: 'id_cita',
    primaryKeyConstraintName: 'cita_pkey',
  })
  id_cita: number;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'time' })
  hora: string;

  @Column({ type: 'varchar', length: 255 })
  motivo: string;

  @Column({ type: 'varchar', length: 30 })
  estado: string;

  @ManyToOne(() => Paciente, (paciente) => paciente.citas, {
    nullable: false,
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({
    name: 'id_paciente',
    foreignKeyConstraintName: 'fk_cita_paciente',
  })
  paciente: Paciente;

  @ManyToOne(() => Medico, (medico) => medico.citas, {
    nullable: false,
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'id_medico', foreignKeyConstraintName: 'fk_cita_medico' })
  medico: Medico;
}
