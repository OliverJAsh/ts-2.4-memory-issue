import { either, traversable, array, chain, task } from 'fp-ts';

import * as AsyncIterable from 'iterable-transformers/target/src/AsyncIterable';

export const typecheck = <T>(t: T) => t;

export const combineEitherOfSemigroups = <L, A>(
    eithers: either.Either<L, A[]>[],
): either.Either<L, A[]> => (
    traversable.sequence(either, array)(eithers)
        .map(chain.flatten(array))
);

export const asyncIterabletoArrayTask = <T>(
    asyncIterable: AsyncIterable<T>,
): task.Task<T[]> => (
    new task.Task((): Promise<T[]> => AsyncIterable.toArray(asyncIterable))
);
