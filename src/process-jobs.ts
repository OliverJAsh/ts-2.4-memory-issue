// import { zip, compose } from 'ramda';
// import { addDays } from 'date-fns';

// type ID = string
// type Job = {
//     due: Date
//     userId: ID
// }
// // type User = {
// //     id: ID
// // }
// type Subscription = {
//     endpoint: ID
// }
// type Either<Left, Right> = Right

// const getJobs = (): Promise<Either<Error, Job[]>> => {
//     // TODO: Query db
//     return Promise.resolve([{ due: new Date(2015, 1, 1), userId: '1' }])
// }
// const getSubscriptionsForUser = (userId: ID): Promise<Either<Error, Subscription[]>> => {
//     // TODO: Query db
//     return Promise.resolve([])
// }

// const collectJobsAndSubscriptions = async (): Promise<Either<Error, [ Job, Subscription[] ][]>> => {
//     const jobs = await getJobs()
//     const date = new Date()
//     const isJobDue = (job: Job) => job.due > date
//     const outstandingJobs = jobs.filter(isJobDue)
//     const jobUserId = (job: Job) => job.userId
//     return Promise.all(
//         outstandingJobs.map(compose(getSubscriptionsForUser, jobUserId))
//     )
//         .then(zip(outstandingJobs))
// }

// // Side effects

// const resolveJob = (job: Job): Promise<Either<Error, {}>> => {
//     // Remove row
// }
// const createNextJob = (userId: ID, due: Date): Promise<Either<Error, {}>> => {
//     // Create row
// }
// const push = (subscription: Subscription): Promise<Either<Error, {}>> => {
//     // Make HTTP request
// }
// const pushToSubscriptions = (subscriptions: Subscription[]): Promise<Either<Error, {}>> => (
//     Promise.all(subscriptions.map(push))
// )

// const runJobs = async () => {
//     const jobsAndSubscriptionsList = await collectJobsAndSubscriptions()
//     return Promise.all(
//         jobsAndSubscriptionsList.map(([ job, subscriptions ]) => (
//             pushToSubscriptions(subscriptions)
//                 // TODO: Mark job as running, must be atomic
//                 .then(() => resolveJob(job))
//                 .then(() => createNextJob(job.userId, addDays(job.due, 1)))
//         ))
//     )
// }
// const scheduleNextProcess = () => setTimeout(process, 60)
// // TODO: Invert this and push whenever a push must happen?
// // Observable<OutstandingJob>
// // Producer: every 60s, find jobs, filter to outstanding, call next (mark as running?)
// const process = async () => {
//     runJobs().then(scheduleNextProcess)
// }

// process()
