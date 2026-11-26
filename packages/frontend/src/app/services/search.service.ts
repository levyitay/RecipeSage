import { Injectable } from "@angular/core";
import { SearchManager } from "../utils/SearchManager";
import { getLocalDb } from "../utils/localDb";

@Injectable({
  providedIn: "root",
})
export class SearchService {
  private managerP = getLocalDb().then((localDb) => new SearchManager(localDb));

  async getManager(): Promise<SearchManager> {
    return this.managerP;
  }
}
