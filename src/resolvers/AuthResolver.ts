import { hash, compare } from 'bcryptjs';
import { Arg, Ctx, Mutation, Resolver, Query, Int } from 'type-graphql';
import { User } from '../entity/User';
import { AuthInput } from '../types/AuthInput';
import { MyContext } from '../types/MyContext';
import { RegisterResponse } from '../types/RegisterResponse';
import { getConnection } from 'typeorm';
import { verify } from 'jsonwebtoken';
import { sendRefreshToken } from '../auth/sendRefreshToken';
import { createRefreshToken } from '../auth/createRefreshToken';
import { createAccessToken } from '../auth/createAccessToken';
import { LoginResponse } from '../types/LoginResponse';

const invalidLoginResponse = {
  errors: [
    {
      path: 'email',
      message: 'invalid login',
    },
  ],
};

const invalidRegisterResponse = {
  errors: [
    {
      path: 'email',
      message: 'already in use',
    },
  ],
};

@Resolver()
export class AuthResolver {
  // REGISTER MUTATION
  @Mutation(() => RegisterResponse)
  async register(
    @Arg('input')
    { email, password }: AuthInput
  ): Promise<RegisterResponse> {
    const hashedPassword = await hash(password, 12);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return invalidRegisterResponse;
    }

    const user = await User.create({
      email,
      password: hashedPassword,
    }).save();

    return { user };
  }

  // LOGIN MUTATION
  @Mutation(() => LoginResponse)
  async login(
    @Arg('input') { email, password }: AuthInput,
    @Ctx() ctx: MyContext
  ): Promise<LoginResponse> {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return invalidLoginResponse;
    }

    // check password
    const valid = await compare(password, user.password);
    if (!valid) {
      return invalidLoginResponse;
    }

    // login return if success
    // Refresh Token in cookies for future access and getting a new access token
    sendRefreshToken(ctx.res, createRefreshToken(user));

    return {
      accessToken: createAccessToken(user),
      user,
    };
  }

  // ME QUERY
  // read token from header, get userid, return user
  @Query(() => User, { nullable: true })
  me(@Ctx() context: MyContext) {
    const authorization = context.req.headers['authorization']; //read the headers

    if (!authorization) {
      return null;
    }
    try {
      const token = authorization?.split(' ')[1];
      const payload: any = verify(token, process.env.ACCESS_TOKEN_SECRET!);
      return User.findOne(payload.userId);
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  // LOGOUT MUTATION
  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: MyContext) {
    sendRefreshToken(res, '');
    return true;
  }

  // REVOKE REFRESH TOKEN MUTATION
  // increase token version
  @Mutation(() => Boolean)
  async revokeRefreshTokenForUser(@Arg('userid', () => Int) userId: number) {
    await getConnection()
      .getRepository(User)
      .increment({ id: userId }, 'tokenVersion', 1);

    return true;
  }
}
