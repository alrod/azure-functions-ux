import { Component, Output } from '@angular/core';
import { CacheService } from './../../shared/services/cache.service';
import { GlobalStateService } from '../../shared/services/global-state.service';
import { ArmObj } from './../../shared/models/arm/arm-obj';
import { Subject } from 'rxjs/Subject';
import { ArmService } from '../../shared/services/arm.service';
import { ViewInfoComponent } from 'app/shared/components/view-info-component';
import { Subscription } from 'rxjs/Subscription';
import { FunctionAppService } from 'app/shared/services/function-app.service';
import { FunctionAppContext } from 'app/shared/function-app-context';
import { BroadcastService } from '../../shared/services/broadcast.service';

@Component({
    selector: 'app-setting',
    templateUrl: './app-setting.component.html',
    styleUrls: ['./../picker.scss']
})
export class AppSettingComponent extends ViewInfoComponent {

    public appSettingName: string;
    public appSettingValue: string;
    public selectInProcess = false;
    public canSelect = false;
    @Output() close = new Subject<void>();
    @Output() selectItem = new Subject<string>();

    private context: FunctionAppContext;

    constructor(
        private _cacheService: CacheService,
        private _armService: ArmService,
        private _globalStateService: GlobalStateService,
        functionAppService: FunctionAppService,
        broadcastService: BroadcastService) {
        super('app-setting', functionAppService, broadcastService);
    }

    setup(): Subscription {
        return this.viewInfoEvents
            .subscribe(view => {
                this.context = view.context;
            });
    }

    onClose() {
        if (!this.selectInProcess) {
            this.close.next(null);
        }
    }

    onSelect() {
        this.selectInProcess = true;
        this._globalStateService.setBusyState();
        this._cacheService.postArm(`${this.context.site.id}/config/appsettings/list`, true).flatMap(r => {
            const appSettings: ArmObj<any> = r.json();
            appSettings.properties[this.appSettingName] = this.appSettingValue;
            return this._cacheService.putArm(appSettings.id, this._armService.websiteApiVersion, appSettings);
        })
            .do(null, e => {
                this._globalStateService.clearBusyState();
                this.selectInProcess = false;
                console.log(e);
            })
            .subscribe(() => {
                this._globalStateService.clearBusyState();
                this.selectItem.next(this.appSettingName);
            });
    }
}
