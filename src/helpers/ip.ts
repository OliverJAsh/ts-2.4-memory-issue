import { task, validation } from 'fp-ts';

import { ApiResponseNew } from '../types';

export const normalizeRequestIp = (sourceIp: string) => (
    task.of('foo')
);

export const getIanaTimeZoneFromIp = (ip: string): task.Task<ApiResponseNew<string>> => (
    task.of(validation.success('foo'))
);
