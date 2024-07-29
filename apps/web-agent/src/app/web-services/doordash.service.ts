import { Injectable } from '@nestjs/common';
import { Builder, By, Key, until, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

@Injectable()
export class SeleniumService {
  private driver: WebDriver;

  constructor() {
      this.driver = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(new chrome.Options().headless())
      .build();
  }
  async placeOrder() {
    let url = "https://www.doordash.com/store/flintridge-pizza-kitchen-la-ca%C3%B1ada-flintridge-26137758/?event_type=autocomplete&pickup=true"
    await this.driver.get(url);
    const title = await this.driver.getTitle();
    await this.driver.quit();
    return title;
  }
}
