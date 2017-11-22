import { FunctionAppContext } from './../shared/function-app-context';
import { Component, Input } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/retry';
import 'rxjs/add/operator/switchMap';
import { TranslateService } from '@ngx-translate/core';

import { AiService } from './../shared/services/ai.service';
import { BroadcastService } from '../shared/services/broadcast.service';
import { FunctionTemplate } from '../shared/models/function-template';
import { FunctionInfo } from '../shared/models/function-info';
import { PortalService } from '../shared/services/portal.service';
import { BindingManager } from '../shared/models/binding-manager';
import { GlobalStateService } from '../shared/services/global-state.service';
import { PortalResources } from '../shared/models/portal-resources';
import { ErrorIds } from '../shared/models/error-ids';
import { FunctionsNode } from '../tree-view/functions-node';
import { TreeViewInfo } from '../tree-view/models/tree-view-info';
import { DashboardType } from '../tree-view/models/dashboard-type';
import { FunctionAppService } from 'app/shared/services/function-app.service';
import { ViewInfoComponent } from 'app/shared/components/view-info-component';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'function-quickstart',
    templateUrl: './function-quickstart.component.html',
    styleUrls: ['./function-quickstart.component.scss'],
})
export class FunctionQuickstartComponent extends ViewInfoComponent {
    @Input() functionsInfo: FunctionInfo[];
    private context: FunctionAppContext;

    selectedFunction: string;
    selectedLanguage: string;
    bc: BindingManager = new BindingManager();
    showJavaSplashPage = false;
    setShowJavaSplashPage = new Subject<boolean>();

    private functionsNode: FunctionsNode;
    private _viewInfoStream = new Subject<TreeViewInfo<any>>();

    constructor(private _broadcastService: BroadcastService,
        private _portalService: PortalService,
        private _globalStateService: GlobalStateService,
        private _translateService: TranslateService,
        private _aiService: AiService,
        private _functionAppService: FunctionAppService) {
        super('function-quickstart', _functionAppService, _broadcastService, () => _globalStateService.setBusyState());

        this.selectedFunction = 'HttpTrigger';
        this.selectedLanguage = 'CSharp';


        this.setShowJavaSplashPage.subscribe(show => {
            this.showJavaSplashPage = show;
        });
    }

    setup(): Subscription {
        return this.viewInfoEvents
            .do(() => this._globalStateService.setBusyState())
            .switchMap(r => {
                this.context = r.context;
                return this._functionAppService.getFunctions(this.context);
            })
            .do(null, e => {
                this._aiService.trackException(e, '/errors/function-quickstart');
                console.error(e);
            })
            .retry()
            .subscribe(fcs => {
                this._globalStateService.clearBusyState();
                this.functionsInfo = fcs.result;
            });
    }

    set viewInfoInput(viewInfoInput: TreeViewInfo<any>) {
        this._viewInfoStream.next(viewInfoInput);

    }

    onFunctionClicked(selectedFunction: string) {
        if (!this._broadcastService.getDirtyState('function_disabled')) {
            this.selectedFunction = selectedFunction;
        }
    }

    onLanguageClicked(selectedLanguage: string) {
        if (!this._broadcastService.getDirtyState('function_disabled')) {
            this.selectedLanguage = selectedLanguage;
        }
    }

    onCreateNewFunction() {
        if (this._globalStateService.IsBusy) {
            return;
        }

        this._globalStateService.setBusyState();

        if (this.selectedLanguage === 'Java') {
            this.setShowJavaSplashPage.next(true);
        }
        this._functionAppService.getTemplates(this.context)
            .subscribe((templates) => {
                if (templates.isSuccessful) {
                    const selectedTemplate: FunctionTemplate = templates.result.find((t) => {
                        return t.id === this.selectedFunction + '-' + this.selectedLanguage;
                    });

                    if (selectedTemplate) {
                        try {
                            const functionName = BindingManager.getFunctionName(selectedTemplate.metadata.defaultFunctionName, this.functionsInfo);
                            this._portalService.logAction('intro-create-from-template', 'creating', { template: selectedTemplate.id, name: functionName });

                            this.bc.setDefaultValues(selectedTemplate.function.bindings, this._globalStateService.DefaultStorageAccount);

                            this._functionAppService.createFunctionV2(this.context, functionName, selectedTemplate.files, selectedTemplate.function)
                                .subscribe(res => {
                                    if (res.isSuccessful) {
                                        this._portalService.logAction('intro-create-from-template', 'success', { template: selectedTemplate.id, name: functionName });
                                        this.functionsNode.addChild(res.result);
                                    }
                                    this._globalStateService.clearBusyState();
                                },
                                () => {
                                    this._globalStateService.clearBusyState();
                                });
                        } catch (e) {
                            this.showComponentError({
                                message: this._translateService.instant(PortalResources.functionCreateErrorDetails, { error: JSON.stringify(e) }),
                                errorId: ErrorIds.unableToCreateFunction,
                                resourceId: this.context.site.id
                            });

                            this._aiService.trackEvent(ErrorIds.unableToCreateFunction, {
                                exception: e
                            });
                            throw e;
                        }
                    } else {
                        this._globalStateService.clearBusyState();
                    }
                }
            });
    }

    createFromScratch() {
        const functionsNode = this.functionsNode;
        functionsNode.openCreateDashboard(DashboardType.CreateFunctionDashboard);
    }

    startFromSC() {
        this._portalService.openBlade({
            detailBlade: 'ContinuousDeploymentListBlade',
            detailBladeInputs: {
                id: this.context.site.id,
                ResourceId: this.context.site.id
            }
        },
            'intro');
    }
}
