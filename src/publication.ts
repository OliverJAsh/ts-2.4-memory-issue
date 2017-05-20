import { task } from 'fp-ts';

import {
    asyncIterabletoArrayTask,
    combineEitherOfSemigroups,
} from './helpers/index';
import {
    TwitterTimelineResponsesIterable,
    FullPublicationResponse,
} from './types';

export const getLatestPublication = ({
    responsesIterable,
}: {
    responsesIterable: TwitterTimelineResponsesIterable,
}): task.Task<FullPublicationResponse> => {
    const responsesInRangeT = asyncIterabletoArrayTask(responsesIterable);
    const pagesInRangeResponseT = responsesInRangeT.map(combineEitherOfSemigroups);
};
