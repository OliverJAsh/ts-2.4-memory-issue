import { option, array } from 'fp-ts';

import { FetchFn, PageApiResponses } from './types';

export const getPagesIterable = async function* ({ fetchFn }: { fetchFn: FetchFn }) {
    const recurse = async function* ({
        maybeMaxId,
    }: {
        maybeMaxId: option.Option<string>,
    }): PageApiResponses {
        console.log('recurse', { maybeMaxId }); // eslint-disable-line no-console
        const result = await fetchFn({ maybeMaxId });

        yield result;

        const tweets = result.toOption().getOrElse(() => []);
        const maybeLastTweet = array.last(tweets);
        const maybeNextMaxId = maybeLastTweet.map(tweet => tweet.id_str);

        yield* maybeNextMaxId
            .chain(nextMaxId => {
                const hasMoreItems = maybeMaxId
                    .map(maxId => nextMaxId !== maxId)
                    .getOrElse(() => true);

                if (hasMoreItems) {
                    return option.some(
                        recurse({ maybeMaxId: option.some(nextMaxId) }),
                    );
                } else {
                    return option.none;
                }
            })
            // TODO
            .getOrElse(() => ({ [Symbol.asyncIterator]: async function* (): any { } }));
    };

    yield* recurse({ maybeMaxId: option.none });
};
