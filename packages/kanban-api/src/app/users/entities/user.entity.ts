import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SystemRole } from '../../common/roles';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 120 }) name!: string;
  @Index({ unique: true }) @Column({ length: 320 }) email!: string;
  @Exclude() @Column({ name: 'password_hash' }) passwordHash!: string;
  @Column({ name: 'system_role', type: 'enum', enum: SystemRole, enumName: 'system_role_enum', default: SystemRole.USER })
  systemRole!: SystemRole;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
