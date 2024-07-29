import { Body,Headers, Controller,Logger, Get,Post } from '@nestjs/common';
import { AppService } from './app.service';
import { OrderRequestDto } from './dtos/order-request.dto';
import { FlintridgeService } from './web-services/flintridge.service';
import { ToastService } from './web-services/toast.pu.service';
import { OrderDto } from './dtos/order.dto';
import { UberService } from './web-services/uber.service';
import { DoordashService } from './web-services/doordash1.service'
@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
    private readonly flintridgeService:FlintridgeService,
    private readonly toastService:ToastService,
    private readonly uberService:UberService,
    private readonly doorDashService:DoordashService

  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Post('placeOrder')
  placeOrder(@Body() request,
              @Headers('Restaurent') headerValue: string) {
    Logger.log(JSON.stringify(request)); // Do something with the request body
    
    switch (headerValue) {
      // case 'flintridge':
      //   return this.flintridgeService.placeOrder(request);
      case 'toast':
        return this.toastService.placeOrder(request);
      // Add more cases for other state codes if needed
      case 'uber':
        return this.uberService.placeOrder(request);
      case 'dd':
          return this.doorDashService.placeOrder(request);  
      // Add more cases for other state codes if needed
      default:
        throw new Error('Invalid Restaurent');
    }
  }
}
