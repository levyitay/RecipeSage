import { Component } from "@angular/core";

import { RouteMap, UtilService } from "~/services/util.service";
import { ImportService } from "../../../services/import.service";
import { AlertController, NavController } from "@ionic/angular";
import { TranslateService } from "@ngx-translate/core";
import { LoadingService } from "../../../services/loading.service";

@Component({
  selector: "page-import-pepperplate",
  templateUrl: "import-pepperplate.page.html",
  styleUrls: ["import-pepperplate.page.scss"],
})
export class ImportPepperplatePage {
  defaultBackHref: string = RouteMap.ImportPage.getPath();

  username: string = "";
  password: string = "";

  constructor(
    private loadingService: LoadingService,
    private importService: ImportService,
    private utilService: UtilService,
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private navCtrl: NavController,
  ) {}

  async alertIncorrectCredentials() {
    const header = await this.translate
      .get("pages.importPepperplate.incorrectCredentials.header")
      .toPromise();
    const message = await this.translate
      .get("pages.importPepperplate.incorrectCredentials.message")
      .toPromise();
    const okay = await this.translate.get("generic.okay").toPromise();

    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [
        {
          text: okay,
        },
      ],
    });

    await alert.present();
  }

  async submit() {
    const loading = this.loadingService.start();
    const response = await this.importService.importPepperplate(
      {
        username: this.username,
        password: this.password,
      },
      {
        406: () => this.alertIncorrectCredentials(),
      },
    );
    loading.dismiss();

    if (!response.success) return;

    const header = await this.translate
      .get("pages.import.jobCreated.header")
      .toPromise();
    const message = await this.translate
      .get("pages.import.jobCreated.message")
      .toPromise();
    const okay = await this.translate.get("generic.okay").toPromise();

    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [
        {
          text: okay,
        },
      ],
    });

    await this.navCtrl.navigateForward(RouteMap.ImportPage.getPath(), {
      replaceUrl: true,
    });

    await alert.present();
  }
}
