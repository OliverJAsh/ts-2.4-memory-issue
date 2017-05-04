import { Request, Response } from 'express';
import { array } from 'fp-ts';
import { formatValidationError } from 'io-ts-reporters';

import {
    ResponseErrors,
    ResponseError,
    ResponseErrorTypes,
} from './response-errors';
import { Tweet, ApiResponse, ApiResponseNew } from './types';

const renderResponseError = (responseError: ResponseError) => {
    switch (responseError.type) {
        case ResponseErrorTypes.Simple: {
            return responseError.message;
        }
        case ResponseErrorTypes.Validation: {
            const formattedValidationErrors = array.catOptions(
                responseError.validationErrors
                    .map(formatValidationError)
                    .map(formattedValidationError => formattedValidationError),
            );
            return [
                'Validation errors:',
                '<ul>',
                ...formattedValidationErrors.map(error => (
                    `<li>${error}</li>`
                )),
                '</ul>',
            ].join('');
        }
    }
};
const renderResponseErrors = (responseErrors: ResponseError[]) => (
    `<p>Errors:</p><ul>${responseErrors.map(renderResponseError).join(' ')}</ul>`
);
const responseErrors = (_req: Request, res: Response) => (apiErrorsList: ResponseError[]) => {
    const apiErrors = new ResponseErrors(apiErrorsList);
    res
        .status(apiErrors.statusCode)
        .send(renderResponseErrors(apiErrors.errors));
};

const renderPublication = (tweets: Tweet[]) => (
    [
        `<ol>${tweets.map((tweet) => (
            `<li>${tweet.id_str} ${tweet.created_at} @${tweet.user.screen_name}: ${tweet.text}</li>`
        )).join('')}</ul>`,
        `<script src="/main.js"></script>`,
    ].join('')
);
export const publication = (_req: Request, res: Response) => (tweets: Tweet[]) => {
    res.send(renderPublication(tweets));
};

export const handle = <T>({
    req,
    res,
    renderSuccess,
}: {
    req: Request,
    res: Response,
    renderSuccess: (req: Request, res: Response) => (t: T) => void,
}) => (apiResponse: ApiResponse<T>) => {
    apiResponse.cata({
        Failure: responseErrors(req, res),
        Success: renderSuccess(req, res),
    });
};

export const handleNew = <T>({
    req,
    res,
    renderSuccess,
}: {
    req: Request,
    res: Response,
    renderSuccess: (req: Request, res: Response) => (t: T) => void,
}) => (apiResponse: ApiResponseNew<T>) => {
    apiResponse.fold(
        responseErrors(req, res),
        renderSuccess(req, res),
    );
};
