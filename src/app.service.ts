import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { IShop, ISection, IItem } from './app.model';

@Injectable()
export class AppService {
  async getShopeeFoodDetails(url: string): Promise<IShop> {
    const browser = await puppeteer.launch({
      executablePath:
        process.env.external_chrome === 'true'
          ? '/usr/bin/google-chrome'
          : undefined,
      headless: true,
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
    );
    await page.setViewport({
      width: 1024,
      height: 8000,
    });

    await page.goto(url, {
      waitUntil: 'networkidle0',
    });
    let result;

    if (url.startsWith('https://shopeefood')) {
      result = await this.get(page);
    } else if (url.startsWith('https://food.grab')) {
      result = await this.getGrab(page);
    }

    await browser.close();

    return result;
  }

  private async get(page: puppeteer.Page): Promise<IShop> {
    const shop: IShop = {
      name: await this.tryOrDefault(
        page.$eval('.name-restaurant', (el) => el.textContent),
      ),
      imageUrl: await this.tryOrDefault(
        page.$eval(
          '.detail-restaurant-img > img',
          (el) => (el as HTMLImageElement).src,
        ),
      ),
      address: await this.tryOrDefault(
        page.$eval('.address-restaurant', (el) => el.textContent),
      ),
      sections: [],
    };
    let currentSection: ISection;
    let currentItem: IItem;

    const elements = await page.$$('.menu-group,.item-restaurant-row');

    for (const element of elements) {
      const eleClassName = await element.evaluate((x) => x.className);
      if (eleClassName === 'menu-group') {
        currentSection = {
          name: await this.tryOrDefault(
            element.$eval('.title-menu', (el) => el.textContent),
          ),
          items: [],
        };

        shop.sections.push(currentSection);
      } else {
        currentItem = {};
        currentItem.name = await this.tryOrDefault(
          element.$eval('.item-restaurant-name', (el) => el.textContent),
        );
        currentItem.description = await this.tryOrDefault(
          element.$eval('.item-restaurant-desc', (el) => el.textContent),
        );
        const priceRaw = await this.tryOrDefault(
          element.$eval('.current-price', (el) => el.textContent),
        );
        currentItem.price = +priceRaw.replace(/[^0-9]/g, '');

        currentItem.imageUrl = await this.tryOrDefault(
          element.$eval(
            '.item-restaurant-img img',
            (el) => (el as HTMLImageElement).src,
          ),
        );
        currentItem.isAvailable = !!(await this.tryOrDefault(
          element.$('.btn-adding'),
        ));

        currentSection.items.push(currentItem);
      }
    }

    return shop;
  }

  private async getGrab(page: puppeteer.Page): Promise<IShop> {
    const shop: IShop = {
      name: await this.tryOrDefault(
        page.$eval('[class^="name___"]', (el) => el.textContent),
      ),
      imageUrl: await this.tryOrDefault(
        page.$eval(
          '.detail-restaurant-img > img',
          (el) => (el as HTMLImageElement).src,
        ),
      ),
      address: await this.tryOrDefault(
        page.$eval('.address-restaurant', (el) => el.textContent),
      ),
      sections: [],
    };
    let currentSection: ISection;
    let currentItem: IItem;

    const elements = await page.$$("[class^='category___']");

    for (const element of elements) {
      // Section area
      currentSection = {
        name: await this.tryOrDefault(
          element.$eval("[class^='categoryName___']", (el) => el.textContent),
        ),
        items: [],
      };
      shop.sections.push(currentSection);

      const itemElements = await element.$$("[class*='menuItem___']");
      for (const itemElement of itemElements) {
        currentItem = {};
        currentItem.name = await this.tryOrDefault(
          itemElement.$eval("[class^='itemNameTitle___']", (el) => el.textContent),
        );
        currentItem.description = await this.tryOrDefault(
          itemElement.$eval("[class^='itemDescription___']", (el) => el.textContent),
        );
        const priceRaw = await this.tryOrDefault(
          itemElement.$eval("[class^='discountedPrice___']", (el) => el.textContent),
        );
        currentItem.price = +priceRaw.replace(/[^0-9]/g, '');

        currentItem.imageUrl = await this.tryOrDefault(
          itemElement.$eval(
            "[class*='menuItemPhoto___'] img",
            (el) => (el as HTMLImageElement).src,
          ),
        );
        currentItem.isAvailable = !!(await this.tryOrDefault(
          itemElement.$("[class*='quickAdder___']"),
        ));

        currentSection.items.push(currentItem);
      }
    }

    return shop;
  }

  private async tryOrDefault(func: Promise<any>) {
    try {
      return await func;
    } catch (e) {
      return null;
    }
  }
}
