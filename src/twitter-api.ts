import { randomBytes as randomBytesCb } from 'crypto';
import fetch from 'node-fetch';
import * as querystring from 'querystring';
import { toPairs, sortBy } from 'lodash';
import { createHmac } from 'crypto';
import * as denodeify from 'denodeify';
import * as Validation from 'data.validation';
import { option } from 'fp-ts';
import { SimpleResponseError } from './response-errors';

const randomBytes = denodeify(randomBytesCb);

export const hostUrl = 'https://api.twitter.com';

// https://dev.twitter.com/oauth/overview/creating-signatures
const createOauthSignature = ({
    method,
    baseUrl,
    parameters,
    oauthTokenSecret,
    consumerSecret,
}: {
    method: string,
    baseUrl: string,
    parameters: {},
    oauthTokenSecret: string,
    consumerSecret: string,
}) => {
    const parametersString = sortBy(
        toPairs(parameters)
            .map(([ key, value ]) => [ encodeURIComponent(key), encodeURIComponent(value) ]),
        ([ key ]) => key,
    )
        .map(pair => pair.join('='))
        .join('&');

    const signatureBaseString = (
        `${method}&${encodeURIComponent(baseUrl)}&${encodeURIComponent(parametersString)}`
    );
    const signingKey = (
        `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(oauthTokenSecret)}`
    );
    const signature = createHmac('sha1', signingKey).update(signatureBaseString).digest('base64');

    return signature;
};

const createNonce = () => randomBytes(32).then(buffer => (
    buffer.toString('base64').replace(/[^\w]/g, '')
));

// https://dev.twitter.com/oauth/overview/authorizing-requests#building-the-header-string
const oauthHeaderFromObj = (oauthParams: {}) => (
    toPairs(oauthParams)
        .map(([ key, value ]) => `${encodeURIComponent(key)}="${encodeURIComponent(value)}"`)
        .join(', ')
);

// https://dev.twitter.com/oauth/overview/authorizing-requests#collecting-parameters
const getOauthParams = ({
    maybeOAuthRequestOrAccessToken,
    consumerKey,
    callbackURL,
}: {
    maybeOAuthRequestOrAccessToken: option.Option<string>,
    consumerKey: string,
    callbackURL: string,
}) => (
    createNonce().then(nonce => (
        Object.assign({}, {
            oauth_callback: callbackURL,
            oauth_consumer_key: consumerKey,
            oauth_nonce: nonce,
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: parseInt((Date.now() / 1000).toFixed(0)),
            oauth_version: '1.0',
        }, (
            maybeOAuthRequestOrAccessToken
                .map((oAuthRequestOrAccessToken): { oauth_token?: string } => (
                    { oauth_token: oAuthRequestOrAccessToken }
                ))
                .getOrElse(() => ({}))
        ))
    ))
);

export const fetchFromTwitter = ({
    consumerKey,
    consumerSecret,
    callbackURL,
    maybeOAuthRequestOrAccessToken,
    oauthAccessTokenSecret,
    baseUrlPath,
    method,
    otherParams,
}: {
    consumerKey: string,
    consumerSecret: string,
    callbackURL: string,
    maybeOAuthRequestOrAccessToken: option.Option<string>,
    oauthAccessTokenSecret: string,
    baseUrlPath: string,
    method: string,
    otherParams: {},
}) => {
    return getOauthParams({
        consumerKey,
        callbackURL,
        maybeOAuthRequestOrAccessToken,
    }).then(oauthParams => {
        const baseUrl = `${hostUrl}${baseUrlPath}`;
        const parameters = Object.assign({}, oauthParams, otherParams);
        const oauthSignature = createOauthSignature({
            method,
            baseUrl,
            parameters,
            oauthTokenSecret: oauthAccessTokenSecret,
            consumerSecret,
        });
        const oauthHeader = oauthHeaderFromObj(
            Object.assign({}, oauthParams, { oauth_signature: oauthSignature }),
        );

        const paramsStr = Object.keys(otherParams).length > 0
            ? `?${querystring.stringify(otherParams)}`
            : '';
        const url = `${baseUrl}${paramsStr}`;
        const headers = { 'Authorization': `OAuth ${oauthHeader}` };
        return fetch(url, {
            method,
            headers,
        });
    });
};

export const getRequestToken = ({
    consumerKey,
    consumerSecret,
    callbackURL,
}: {
    consumerKey: string,
    consumerSecret: string,
    callbackURL: string,
}) => {
    return fetchFromTwitter({
        consumerKey,
        consumerSecret,
        callbackURL,
        maybeOAuthRequestOrAccessToken: option.none,
        oauthAccessTokenSecret: '',
        baseUrlPath: `/oauth/request_token`,
        method: 'POST',
        otherParams: {},
    })
        .then(response => (
            // TODO: Is this JSON when erroring?
            response.text().then(text => {
                if (response.ok) {
                    const parsed = querystring.parse(text);
                    // TODO: Validate
                    return Validation.Success({
                        oauthToken: parsed.oauth_token,
                        oauthTokenSecret: parsed.oauth_token_secret,
                        oauthCallbackConfirmed: parsed.oauth_callback_confirmed,
                    });
                } else {
                    return Validation.Failure([
                        new SimpleResponseError(
                            500,
                            `Bad response from Twitter: ${response.status} ${text}`,
                        ),
                    ]);
                }
            })
        ));
};

// https://dev.twitter.com/oauth/reference/post/oauth/access_token
export const getAccessToken = ({
    consumerKey,
    consumerSecret,
    callbackURL,
    oauthRequestToken,
    oauthVerifier,
}: {
    consumerKey: string,
    consumerSecret: string,
    callbackURL: string,
    oauthRequestToken: string,
    oauthVerifier: string,
}) => {
    return fetchFromTwitter({
        consumerKey,
        consumerSecret,
        callbackURL,
        maybeOAuthRequestOrAccessToken: option.some(oauthRequestToken),
        oauthAccessTokenSecret: '',
        baseUrlPath: `/oauth/access_token?oauth_verifier=${oauthVerifier}`,
        method: 'POST',
        otherParams: {},
    })
        .then(response => (
            response.text().then(text => {
                if (response.ok) {
                    const parsed = querystring.parse(text);
                    // TODO: Validate
                    return Validation.Success({
                        oauthToken: parsed.oauth_token,
                        oauthTokenSecret: parsed.oauth_token_secret,
                        userId: parsed.user_id,
                        screenName: parsed.screen_name,
                        // Not sure what this is for as it's undocumented.
                        xAuthExpires: parsed.x_auth_expires,
                    });
                } else {
                    return Validation.Failure([
                        new SimpleResponseError(
                            500,
                            `Bad response from Twitter: ${response.status} ${text}`,
                        ),
                    ]);
                }
            })
        ));
};
