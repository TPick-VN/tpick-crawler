import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('api/get-shop-details')
  getShopDetails(@Query('shopUrl') shopUrl: string): any {
    if (!shopUrl) {
      throw new BadRequestException('shopUrl is missed!');
    }

    if (shopUrl.includes('shopeefood.vn') || shopUrl.includes('food.grab')) {
      return this.appService.getShopeeFoodDetails(shopUrl);
    }

    throw new BadRequestException('shopUrl is not supported!');
  }
}
