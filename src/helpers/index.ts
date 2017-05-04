import * as AsyncIterable from 'iterable-transformers/target/src/AsyncIterable';
import { compose } from 'ramda';
import { Request } from 'express';

export const typecheck = <T>(t: T) => t;

// http://reactivex.io/RxJava/javadoc/rx/Observable.html#takeUntil(rx.functions.Func1)
// https://github.com/ReactiveX/rxjs/issues/2420
// https://github.com/martinsik/rxjs-plus#takewhileinclusive
// https://github.com/ReactiveX/IxJS/issues/7
// https://github.com/marcinnajder/powerseq/issues/2
// https://github.com/cujojs/most/issues/427
// http://stackoverflow.com/questions/35757733/rxjs-5-0-do-while-like-mechanism/35800173#35800173
export const takeWhileInclusive = <T>(
    asyncIterable: AsyncIterable<T>,
    fn: (value: T) => boolean,
): AsyncIterable<T> => {
    return compose(
        AsyncIterable.map(({ value }) => value),
        AsyncIterable.takeWhile(({ done }) => !done),
        AsyncIterable.flatten,
        AsyncIterable.map((value: T) => {
            const shouldContinue = fn(value);
            return shouldContinue
                ? [ { value: value, done: false } ]
                : [
                    { value: value, done: false },
                    { value: undefined, done: true },
                ];
        }),
    )(asyncIterable);
};

// https://momentjs.com/timezone/docs/
export const getDateForTimeZone = (timeZone: string) => {
    const options = {
        timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
    };
    const formatter = new Intl.DateTimeFormat([], options);
    // This feels a bit flaky, perhaps use something with more battle testing
    // such as https://momentjs.com/timezone/
    return new Date(formatter.format(new Date()));
};

type Session = {
    userId: string | undefined,
};
export const getSession = (req: Request): Session => (req as any).session;
