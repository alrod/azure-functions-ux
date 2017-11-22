import { FunctionAppService } from './../shared/services/function-app.service';
import { Component } from '@angular/core';
import { DashboardType } from 'app/tree-view/models/dashboard-type';
import { BroadcastService } from './../shared/services/broadcast.service';
import { ConfigService } from './../shared/services/config.service';
import { Observable } from 'rxjs/Observable';
import { FunctionInfo } from './../shared/models/function-info';
import { AiService } from './../shared/services/ai.service';
import { TreeViewInfo } from './../tree-view/models/tree-view-info';
import { SiteDescriptor } from 'app/shared/resourceDescriptors';
import { Subscription } from 'rxjs/Subscription';
import { NavigableComponent } from '../shared/components/navigable-component';

@Component({
    selector: 'create-function-wrapper',
    templateUrl: './create-function-wrapper.component.html',
    styleUrls: ['./create-function-wrapper.component.scss']
})
export class CreateFunctionWrapperComponent extends NavigableComponent {

    public dashboardType: string;
    public viewInfo: TreeViewInfo<any>;

    constructor(
        private _aiService: AiService,
        private _configService: ConfigService,
        _broadCastService: BroadcastService,
        private _functionAppService: FunctionAppService) {
        super('create-function-wrapper', _broadCastService, [
            DashboardType.CreateFunctionAutoDetectDashboard,
            DashboardType.CreateFunctionDashboard,
            DashboardType.CreateFunctionQuickstartDashboard
        ]);
    }

    setupNavigation(): Subscription {
        return this.navigationEvents
            .switchMap(info => {
                this.viewInfo = info;

                if (info.dashboardType === DashboardType.CreateFunctionDashboard
                    || info.dashboardType === DashboardType.CreateFunctionQuickstartDashboard) {

                    this.dashboardType = DashboardType[info.dashboardType];
                    return Observable.of(null);
                }

                // Set default for autodetect to CreateFunction while we load function list
                this.dashboardType = DashboardType[DashboardType.CreateFunctionDashboard];

                const siteDescriptor = new SiteDescriptor(this.viewInfo.resourceId);
                return this._functionAppService.getAppContext(siteDescriptor.getTrimmedResourceId());
            })
            .switchMap(context => {
                if (!context) {
                    return Observable.of(null);
                }

                return this._functionAppService.getFunctions(context);
            })
            .do(null, e => {
                this._aiService.trackException(e, '/errors/create-function-wrapper');
            })
            .retry()
            .subscribe((fcs: FunctionInfo[]) => {
                if (!fcs) {
                    return;
                }

                if (fcs.length > 0 || this._configService.isStandalone()) {
                    this.dashboardType = DashboardType[DashboardType.CreateFunctionDashboard];
                } else {
                    this.dashboardType = DashboardType[DashboardType.CreateFunctionQuickstartDashboard];
                }
            });
    }
}
