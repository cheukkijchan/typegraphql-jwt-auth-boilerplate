import { MyContext } from '../types/myContext';
import { MiddlewareFn } from 'type-graphql';
import { verify } from 'jsonwebtoken';

export const isAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
  //read the headers
  const authorization = context.req.headers['authorization'];

  if (!authorization) {
    throw new Error('Not Authenticated');
  }
  try {
    const token = authorization?.split(' ')[1];
    const payload = verify(token, process.env.ACCESS_TOKEN_SECRET!);
    // storing payload into context, type any since it can be type string or object
    context.payload = payload as any;
  } catch (error) {
    console.log(error);
    throw new Error('not authenticated');
  }

  // // // Session Auth Approach
  // if (!context.req.session!.userId) {
  //   throw new ApolloError('not authenticated');
  // }

  return next();
};
