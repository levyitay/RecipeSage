import { Injectable, inject } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";

import { SyncService } from "./sync.service";

@Injectable({
  providedIn: "root",
})
export class SwCommunicationService {
  private translate = inject(TranslateService);
  private syncService = inject(SyncService);

  async triggerFullCacheSync(notify = false) {
    if (!notify) {
      await this.syncService.syncAll();
      return;
    }

    const [title, body] = await Promise.all([
      this.translate.get("sync.notification.title").toPromise(),
      this.translate.get("sync.notification.body").toPromise(),
    ]);

    await this.syncService.syncAllAndNotify({
      title,
      body,
    });
  }
}
