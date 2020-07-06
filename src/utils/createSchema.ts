import { buildSchema } from 'type-graphql';
// import { AuthResolver } from '../resolvers/AuthResolver';
// import { BookResolver } from '../resolvers/BookResolver';

export const createSchema = () =>
  buildSchema({
    // auto import resolvers
    resolvers: [__dirname + '/../resolvers/*.ts'],
    authChecker: ({ context: { req } }) => {
      return !!req.session.userId;
    },

    // https://github.com/MichalLytek/type-graphql/issues/150
    validate: false,
  });
