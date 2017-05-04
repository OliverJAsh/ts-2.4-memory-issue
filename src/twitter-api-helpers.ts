import { Response } from 'node-fetch';
import { validation, option } from 'fp-ts';

import { fetchFromTwitter } from './twitter-api';
import { SimpleResponseError, ResponseError } from './response-errors';
import { FetchFn, PageApiResponse, Tweet } from './types';

export const fetchHomeTimeline = ({
    consumerKey,
    consumerSecret,
    callbackURL,
    oauthAccessToken,
    oauthAccessTokenSecret,
}: {
    consumerKey: string,
    consumerSecret: string,
    callbackURL: string,
    oauthAccessToken: string,
    oauthAccessTokenSecret: string,
}): FetchFn => ({ maybeMaxId }): Promise<PageApiResponse> => {
    const handleResponse = async (response: Response) => {
        if (response.ok) {
            const json = await response.json();
            return validation.success<ResponseError[], Tweet[]>(json);
        } else {
            // https://dev.twitter.com/overview/api/response-codes
            if (response.status === 429) {
                return validation.failure<ResponseError[], Tweet[]>([], [
                    new SimpleResponseError(
                        429,
                        // tslint:disable-next-line max-line-length
                        'Twitter API 429: Too Many Requests. Rate limit exceeded, please wait.',
                    ),
                ]);
            } else if (response.status === 401) {
                return validation.failure<ResponseError[], Tweet[]>([], [
                    new SimpleResponseError(
                        401,
                        // tslint:disable-next-line max-line-length
                        `Twitter API 401: Unauthorized. Please try re-authenticating with Twitter.`,
                    ),
                ]);
            } else {
                return validation.failure<ResponseError[], Tweet[]>([], [
                    new SimpleResponseError(
                        500,
                        `Unknown error response from Twitter API: ${response.status}`,
                    ),
                ]);
            }
        }
    };

    return fetchFromTwitter({
        consumerKey,
        consumerSecret,
        callbackURL,
        maybeOAuthRequestOrAccessToken: option.some(oauthAccessToken),
        oauthAccessTokenSecret,
        baseUrlPath: '/1.1/statuses/home_timeline.json',
        method: 'GET',
        otherParams: Object.assign({},
            {
                // This is the max allowed
                count: 200,
            },
            maybeMaxId
                .map((maxId): { max_id?: string } => ({ max_id: maxId }))
                .getOrElse(() => ({})),
        ),
    })
        .then(handleResponse);
};
