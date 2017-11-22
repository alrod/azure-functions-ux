import { FunctionAppContext } from './function-app-context';
import { CacheService } from 'app/shared/services/cache.service';
import { Observable } from 'rxjs/Observable';

export namespace Preconditions {
    export type PreconditionErrorId = string;
    export type HttpPreconditions = 'NotStopped' | 'ReachableLoadballancer' | 'NotOverQuota' | 'NoEasyAuth' | 'RuntimeAvailable' | 'NoClientCertificate';
    export type PreconditionMap = {[key in HttpPreconditions]: HttpPrecondition };
    export type DataService = CacheService;

    export interface PreconditionResult {
        conditionMet: boolean; errorId: PreconditionErrorId;
    }

    export abstract class HttpPrecondition {
        constructor(protected dataService: DataService) { }
        abstract check(context: FunctionAppContext): Observable<PreconditionResult>;
    }

    export class NotStoppedPrecondition extends HttpPrecondition {
        check(context: FunctionAppContext): Observable<PreconditionResult> {
            return Observable.of({
                conditionMet: true,
                errorId: null
            });
        }
    }

    export class ReachableLoadballancerPrecondition extends HttpPrecondition {
        check(context: FunctionAppContext): Observable<PreconditionResult> {
            return Observable.of({
                conditionMet: true,
                errorId: null
            });
        }
    }

    export class NotOverQuotaPrecondition extends HttpPrecondition {
        check(context: FunctionAppContext): Observable<PreconditionResult> {
            return Observable.of({
                conditionMet: true,
                errorId: null
            });
        }
    }

    export class NoEasyAuthPrecondition extends HttpPrecondition {
        check(context: FunctionAppContext): Observable<PreconditionResult> {
            return Observable.of({
                conditionMet: true,
                errorId: null
            });
        }
    }

    export class RuntimeAvailablePrecondition extends HttpPrecondition {
        check(context: FunctionAppContext): Observable<PreconditionResult> {
            return Observable.of({
                conditionMet: true,
                errorId: null
            });
        }
    }

    export class NoClientCertificatePrecondition extends HttpPrecondition {
        check(context: FunctionAppContext): Observable<PreconditionResult> {
            return Observable.of({
                conditionMet: true,
                errorId: null
            });
        }
    }
}
