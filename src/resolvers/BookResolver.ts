import { Query, Resolver, UseMiddleware } from 'type-graphql';
import { isAuth } from '../middleware/isAuth';

// hello world of graphql to check if isAuth or not
@Resolver()
export class BookResolver {
  @Query(() => String)
  @UseMiddleware(isAuth)
  book() {
    return 'The Republic';
  }
}
