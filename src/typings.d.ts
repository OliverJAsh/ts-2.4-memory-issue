declare module 'public-ip' {
    export const v4: () => Promise<string>
}

// Applicative
declare module 'data.validation' {
    const Validation: {
        Success: <Success>(success: Success) => Validation<Success, never>
        of: <Success>(success: Success) => Validation<Success, never>
        Failure: <Failure>(failure: Failure) => Validation<never, Failure>
    }
    type Validation<Success, Failure> = {
        getOrElse: (fallback: Success) => Success
        map: <Success2>(fn: (success: Success) => Success2) => Validation<Success2, Failure>
        ap: (validation: Validation<any, any>) => Validation<any, any>
        cata: <T>(obj: {
            Success: (success: Success) => T,
            Failure: (failure: Failure) => T
        }) => T
    }
    export = Validation
}
