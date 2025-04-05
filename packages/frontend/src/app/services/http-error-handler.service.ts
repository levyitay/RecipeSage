import { Injectable } from "@angular/core";
import { ModalController, AlertController } from "@ionic/angular";
import { TranslateService } from "@ngx-translate/core";
import type { AppRouter } from "@recipesage/trpc";
import { TRPCClientError } from "@trpc/client";
import { AxiosError } from "axios";
import * as Sentry from "@sentry/browser";

import { AuthPage } from "~/pages/auth/auth.page";
import { IS_SELFHOST } from "../../environments/environment";

export interface ErrorHandlers {
  [code: string]: () => any;
}

@Injectable({
  providedIn: "root",
})
export class HttpErrorHandlerService {
  isAuthOpen: boolean = false; // Track auth modal so we don't open multiple stacks
  defaultErrorHandlers = {
    0: () => this.presentAlert("generic.error", "errors.offline"),
    401: () => this.promptForAuth(),
    500: () =>
      this.presentAlert(
        "generic.error",
        IS_SELFHOST ? "errors.unexpected.selfhost" : "errors.unexpected",
      ),
  };
  isErrorAlertOpen = false;

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private translate: TranslateService,
  ) {}

  async promptForAuth() {
    if (this.isAuthOpen) return;
    this.isAuthOpen = true;

    const modal = await this.modalCtrl.create({
      component: AuthPage,
      backdropDismiss: false,
    });

    await modal.present();

    await modal.onDidDismiss();

    this.isAuthOpen = false;

    window.location.reload();
  }

  async presentAlert(headerKey: string, messageKey: string) {
    if (this.isErrorAlertOpen) return;
    this.isErrorAlertOpen = true;

    try {
      const header = await this.translate.get(headerKey).toPromise();
      const message = await this.translate.get(messageKey).toPromise();
      const reload = await this.translate.get("generic.reload").toPromise();
      const ignore = await this.translate.get("generic.ignore").toPromise();

      const toast = await this.alertCtrl.create({
        header,
        message,
        buttons: [
          {
            text: reload,
            cssClass: "alertDanger",
            handler: () => {
              window.location.reload();
            },
          },
          {
            text: ignore,
          },
        ],
      });

      await toast.present();
      await toast.onDidDismiss();
      this.isErrorAlertOpen = false;
    } catch (e) {
      this.isErrorAlertOpen = false;
      throw e;
    }
  }

  _handleError(statusCode: number, errorHandlers?: ErrorHandlers) {
    // Use provided error handlers first
    if (errorHandlers?.[statusCode]) {
      errorHandlers[statusCode]();
      // Use provided catchall if passed
    } else if (errorHandlers?.["*"]) {
      errorHandlers["*"]();
      // Fallback to default
    } else if (
      this.defaultErrorHandlers[
        statusCode as keyof typeof this.defaultErrorHandlers
      ]
    ) {
      this.defaultErrorHandlers[
        statusCode as keyof typeof this.defaultErrorHandlers
      ]();
      // All other errors use 500 by default for generic (unexpected) error
    } else {
      this.defaultErrorHandlers[500]();
    }
  }

  handleError(error: unknown, errorHandlers?: ErrorHandlers) {
    // Rethrow all non-http errors
    if (!(error instanceof Error) || !("response" in error)) {
      throw error;
    }

    // Error has been confirmed to have response property, treat as AxiosError
    const axiosError = error as AxiosError;
    const statusCode = axiosError.response!.status;

    this._handleError(statusCode, errorHandlers);
  }

  handleTrpcError(
    error: TRPCClientError<AppRouter>,
    errorHandlers?: ErrorHandlers,
  ) {
    const statusCode = error.data?.httpStatus || 500;

    // If it was code-based or API-based, we want to know about unexpected errors
    if (statusCode >= 500) {
      console.error(error);
      try {
        Sentry.captureException(error);
      } catch (e) {
        console.error(e);
      }
    }

    this._handleError(statusCode, errorHandlers);
  }
}
