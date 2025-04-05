import { Component, Input } from "@angular/core";
import { ModalController } from "@ionic/angular";

import { LoadingService } from "~/services/loading.service";
import { TRPCService } from "../../../services/trpc.service";

@Component({
  selector: "page-update-meal-plan-modal",
  templateUrl: "update-meal-plan-modal.page.html",
  styleUrls: ["update-meal-plan-modal.page.scss"],
})
export class UpdateMealPlanModalPage {
  @Input({
    required: true,
  })
  mealPlanId: string = "";

  mealPlanTitle = "";
  selectedCollaboratorIds: any = [];
  loaded = false;

  constructor(
    private modalCtrl: ModalController,
    private loadingService: LoadingService,
    private trpcService: TRPCService,
  ) {}

  ionViewWillEnter() {
    this.load();
  }

  async load() {
    if (!this.mealPlanId) throw new Error("Meal plan ID not provided");

    const loading = this.loadingService.start();

    const result = await this.trpcService.handle(
      this.trpcService.trpc.mealPlans.getMealPlan.query({
        id: this.mealPlanId,
      }),
    );
    loading.dismiss();
    if (!result) return;

    this.mealPlanTitle = result.title;
    this.selectedCollaboratorIds = result.collaboratorUsers.map(
      (collaboratorUser) => collaboratorUser.user.id,
    );

    this.loaded = true;
  }

  async save() {
    if (!this.mealPlanId) throw new Error("Meal plan ID not provided");

    const loading = this.loadingService.start();

    const result = await this.trpcService.handle(
      this.trpcService.trpc.mealPlans.updateMealPlan.mutate({
        id: this.mealPlanId,
        title: this.mealPlanTitle,
        collaboratorUserIds: this.selectedCollaboratorIds,
      }),
    );
    loading.dismiss();
    if (!result) return;

    this.modalCtrl.dismiss({
      success: true,
    });
  }

  cancel() {
    this.modalCtrl.dismiss({
      success: false,
    });
  }
}
