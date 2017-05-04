import * as AsyncIterable from 'iterable-transformers/target/src/AsyncIterable';
import { uniqBy, chain as lodashChain } from 'lodash';
import { subDays, subMilliseconds } from 'date-fns';
import { traversable, task, validation, array, chain, option } from 'fp-ts';

import { takeWhileInclusive, typecheck } from './helpers';
import { Tweet, PageApiResponses, PageApiResponse, Publication } from './types';

export const getPublicationDate = (localDate: Date) => {
    const publicationHour = 6;
    const isTodaysDueForPublication = localDate.getHours() >= publicationHour;
    // If the time is the past publication hour, the publication date is
    // today else it is yesterday.
    const publicationDate = new Date(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate() - (isTodaysDueForPublication ? 0 : 1),
        publicationHour,
    );
    return publicationDate;
};

// Range is inclusive
export const getPublicationRange = (publicationDate: Date) => {
    const publicationEndDate = subMilliseconds(publicationDate, 1);
    const publicationStartDate = subDays(publicationDate, 1);
    return [ publicationStartDate, publicationEndDate ];
};

const getTweetCreatedAtDate = (tweet: Tweet) => new Date(tweet.created_at);

// min
const isTweetLtPublicationStart = (publicationDate: Date) => (tweet: Tweet) => {
    const publicationStartDate = getPublicationRange(publicationDate)[0];
    return getTweetCreatedAtDate(tweet) < publicationStartDate;
};
const isTweetGtePublicationStart = (publicationDate: Date) => (tweet: Tweet) =>
    !isTweetLtPublicationStart(publicationDate)(tweet);
// max
const isTweetGtPublicationEnd = (publicationDate: Date) => (tweet: Tweet) => {
    const publicationEndDate = getPublicationRange(publicationDate)[1];
    return getTweetCreatedAtDate(tweet) > publicationEndDate;
};
const isTweetLtePublicationEnd = (publicationDate: Date) => (tweet: Tweet) =>
    !isTweetGtPublicationEnd(publicationDate)(tweet);

const hasTweetsAfterRangeEnd = (publicationDate: Date) => (tweets: Tweet[]) => (
    array.last(tweets)
        .map(isTweetLtPublicationStart(publicationDate))
        .getOrElse(() => false)
);

// Tweets must be ordered descendingly
const getRangeTweets = (publicationDate: Date) => (tweets: Tweet[]) => {
    return (
        lodashChain(tweets)
            .dropWhile(isTweetGtPublicationEnd(publicationDate))
            .takeWhile(isTweetGtePublicationStart(publicationDate))
            // .dropRightWhile(isTweetLtPublicationStart(publicationDate))
            .value()
    );
};

const isTweetInRange = (publicationDate: Date) => (tweet: Tweet) => (
    isTweetGtePublicationStart(publicationDate)(tweet)
        && isTweetLtePublicationEnd(publicationDate)(tweet)
);

const getWarning = (publicationDate: Date) => (tweets: Tweet[]): option.Option<string> => {
    const maybeLastTweet = array.last(tweets);

    const isRangeStartOutOfReach = () =>
        maybeLastTweet
            .map(isTweetGtPublicationEnd(publicationDate))
            .getOrElse(() => false);

    const isRangePotentiallyTruncated = () =>
        maybeLastTweet
            .map(isTweetInRange(publicationDate))
            .getOrElse(() => false);

    return isRangeStartOutOfReach()
        ? option.some('out-of-reach')
        : isRangePotentiallyTruncated()
            ? option.some('potentially-truncated')
            : option.none;
};

const getTruncatedPageApiResponses = (publicationDate: Date) => (
    pageApiResponses: PageApiResponses,
): Promise<PageApiResponse[]> => {
    return AsyncIterable.toArray(
        takeWhileInclusive(
            pageApiResponses,
            apiResponse => (
                apiResponse
                    .map(tweets => !hasTweetsAfterRangeEnd(publicationDate)(tweets))
                    .toOption()
                    .getOrElse(() => true)
            ),
        ),
    );
};

export const getLatestPublication = ({
    pageApiResponses,
    localDate,
}: {
    pageApiResponses: PageApiResponses,
    localDate: Date,
}) => new task.Task(async (): Promise<Publication> => {
    const publicationDate = getPublicationDate(localDate);

    const truncatedPageApiResponses = await getTruncatedPageApiResponses(publicationDate)(
        pageApiResponses,
    );
    // TODO: collect instead of sequence
    const truncatedTweetsApiResponse = traversable.sequence(validation, array)(
        truncatedPageApiResponses,
    )
        .map(tweetsArray => chain.flatten(array)(tweetsArray));

    return truncatedTweetsApiResponse
        // Since the max ID parameter is inclusive, there will be duplicates
        // where the pages interleave. This removes them.
        .map(tweets => uniqBy(tweets, tweet => tweet.id_str))
        .map(tweets => ({
            // Widen type from `string` to `string | undefined`
            warning: typecheck<option.Option<string | undefined>>(
                getWarning(publicationDate)(tweets),
            ).getOrElse(() => undefined),
            tweets: getRangeTweets(publicationDate)(tweets),
        }))
        .toEither();
});
