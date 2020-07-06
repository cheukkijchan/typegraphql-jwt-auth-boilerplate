import 'reflect-metadata';
import { ApolloServer } from 'apollo-server-express';
import Express from 'express';
import { createConnection, getConnectionOptions } from 'typeorm';
import cors from 'cors';
import 'dotenv/config';
import { createSchema } from './utils/createSchema';
import cookieParser from 'cookie-parser';
import { verify } from 'jsonwebtoken';
import { User } from './entity/User';
import { sendRefreshToken } from './auth/sendRefreshToken';
import { createRefreshToken } from './auth/createRefreshToken';
import { createAccessToken } from './auth/createAccessToken';

const main = async () => {
  const app = Express();

  app.use(
    cors({
      credentials: true,
      origin: 'http://localhost:3000',
    })
  );

  app.use(cookieParser());
  app.get('/', (_req, res) => res.send('Hello'));

  // JWT token-based Auth Approach with refresh token endpoint
  app.post('/refresh_token', async (req, res) => {
    const token = req.cookies.jid;
    if (!token) {
      return res.send({ ok: false, accessToken: '4' });
    }

    // verify token is valid and not expire
    let payload: any = null; // let payload = null and set to type any because it can be a string or an object
    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
    } catch (err) {
      console.log(err);
      return res.send({ ok: false, accessToken: '1' });
    }

    // token is valid and
    // we can send back an access token
    const user = await User.findOne({ id: payload.userId });

    // check user exist
    if (!user) {
      return res.send({ ok: false, accessToken: '2' });
    }

    // check Access token version is the same between payload(req) and db
    // can also do a check with blacklisted refresh token in db
    if (user.tokenVersion !== payload.tokenVersion) {
      return res.send({ ok: false, accessToken: '3' });
    }

    sendRefreshToken(res, createRefreshToken(user));

    return res.send({ ok: true, accessToken: createAccessToken(user) });
  });

  // // Session Auth Approach
  // const RedisStore = connectRedis(session);
  // app.use(
  //   session({
  //     store: new RedisStore({
  //       client: redis as any,
  //     }),
  //     name: 'qid',
  //     secret: process.env.SESSION_SECRET || 'aslkdfjoiq12312',
  //     resave: false,
  //     saveUninitialized: false,
  //     cookie: {
  //       httpOnly: true,
  //       secure: process.env.NODE_ENV === 'production',
  //       maxAge: 1000 * 60 * 60 * 24 * 7 * 365, // 7years
  //     },
  //   })
  // );

  // get options from ormconfig.js
  const dbOptions = await getConnectionOptions(
    process.env.NODE_ENV || 'development'
  );
  await createConnection({ ...dbOptions, name: 'default' });

  const schema = await createSchema();

  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }: any) => ({ req, res }),
  });

  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log('server started on http://localhost:4000/graphql');
  });
};

main();
