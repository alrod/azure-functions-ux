import { AiService } from 'app/shared/services/ai.service';
import { FunctionAppService } from 'app/shared/services/function-app.service';
import { BroadcastService } from './../shared/services/broadcast.service';
import { FunctionAppContext } from 'app/shared/function-app-context';
import { ErrorIds } from './../shared/models/error-ids';
import { PortalResources } from './../shared/models/portal-resources';
import { ViewInfoComponent } from 'app/shared/components/view-info-component';
import { TranslateService } from '@ngx-translate/core';

export abstract class BaseExtensionInstallComponent extends ViewInfoComponent {

    constructor(
        componentName: string,
        functionAppService: FunctionAppService,
        broadcastService: BroadcastService,
        private _aiService: AiService,
        private _translateService: TranslateService,
        setBusy?: Function) {
        super(componentName, functionAppService, broadcastService, setBusy);
    }

    showTimeoutError(context: FunctionAppContext) {
        this.showComponentError({
            message: this._translateService.instant(PortalResources.timeoutInstallingFunctionRuntimeExtension),
            errorId: ErrorIds.timeoutInstallingFunctionRuntimeExtension,
            resourceId: context.site.id
        });

        this._aiService.trackEvent(ErrorIds.timeoutInstallingFunctionRuntimeExtension, {
            content: this._translateService.instant(PortalResources.timeoutInstallingFunctionRuntimeExtension)
        });
    }

    showInstallFailed(context: FunctionAppContext, id) {
        this.showComponentError({
            message: this._translateService.instant(PortalResources.failedToInstallFunctionRuntimeExtensionForId, { installationId: id }),
            errorId: ErrorIds.timeoutInstallingFunctionRuntimeExtension,
            resourceId: context.site.id
        });

        this._aiService.trackEvent(ErrorIds.timeoutInstallingFunctionRuntimeExtension, {
            content: this._translateService.instant(PortalResources.failedToInstallFunctionRuntimeExtension)
        });
    }
}
