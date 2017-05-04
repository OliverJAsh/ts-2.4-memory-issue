import * as t from 'io-ts';
import * as fp from 'fp-ts';

export type ApiResponseNew<T> = fp.validation.Validation<any[], T>;

export const UserTwitterCredentials = t.interface({
    foo: t.string,
});
export type UserTwitterCredentialsT = t.TypeOf<typeof UserTwitterCredentials>;
