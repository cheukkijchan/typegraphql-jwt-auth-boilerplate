import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';
import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType()
@Entity('users')
export class User extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column('text', { unique: true })
  email: string;

  @Column()
  password: string;

  @Field()
  @Column('int', { default: 0 })
  tokenVersion: number;
}
