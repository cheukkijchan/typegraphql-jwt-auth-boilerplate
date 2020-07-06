import { ObjectType, Field } from 'type-graphql';
import { FieldError } from './FieldError';
import { User } from '../entity/User';

@ObjectType()
export class LoginResponse {
  @Field()
  accessToken?: String;

  @Field(() => User)
  user?: User;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}
