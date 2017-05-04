import * as t from 'io-ts';
import * as fp from 'fp-ts';

import { UserTwitterCredentials, UserTwitterCredentialsT, ApiResponseNew } from '../types';
import { ValidationResponseError } from '../response-errors';

export const getUserTwitterCredentials = (userId: string) => {
    const task = new fp.task.Task(() => Promise.resolve('{}'));
    return task
        .map(result => t.validate(result, UserTwitterCredentials))
        .map((validation): ApiResponseNew<UserTwitterCredentialsT> => (
            validation.mapLeft(validationErrors => (
                [new ValidationResponseError(400, validationErrors)]
            ))
        ));
};
