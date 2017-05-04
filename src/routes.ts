import * as t from 'io-ts';
import * as fp from 'fp-ts';

import { UserTwitterCredentials, UserTwitterCredentialsT, ApiResponseNew } from './types';
import {
    normalizeRequestIp,
    getIanaTimeZoneFromIp,
} from './helpers/ip';

export const getUserTwitterCredentials = (userId: string) => {
    const task = new fp.task.Task(() => Promise.resolve('{}'));
    return task
        .map(result => t.validate(result, UserTwitterCredentials))
        .map((validation): ApiResponseNew<UserTwitterCredentialsT> => (
            validation.mapLeft(validationErrors => (
                [{}]
            ))
        ));
};

const credentialsM = new fp.eitherT.EitherT(fp.task, getUserTwitterCredentials(session.userId));

credentialsM
    .chain(credentials => {
        const requestIpM = normalizeRequestIp(req.ip);
        const ianaTimeZoneM = new fp.eitherT.EitherT(fp.task, requestIpM.chain(getIanaTimeZoneFromIp));
    });
