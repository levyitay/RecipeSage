import { Injectable } from "@angular/core";
import { serverConfig } from "../utils/serverConfig";

@Injectable({
  providedIn: "root",
})
/**
 * @deprecated
 */
export class MealPlanService {
  getICalUrl(mealPlanId: string) {
    return `${serverConfig.apiBase}mealPlans/${mealPlanId}/ical`;
  }
}
