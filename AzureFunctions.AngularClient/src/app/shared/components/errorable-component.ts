import { ErrorEvent } from 'app/shared/models/error-event';
import { BroadcastService } from './../services/broadcast.service';


export abstract class ErrorableComponent {

    constructor(_componentName: string, _broadcastService: BroadcastService) { }

    showComponentError(error: ErrorEvent) {

    }

    clearComponentError(error: ErrorEvent) {

    }

    clearComponentErrors() {

    }
}
