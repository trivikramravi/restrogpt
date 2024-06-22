import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FlintridgeService } from './web-services/flintridge.service';
import { ToastService } from './web-services/toast.pu.service';
import { MailService } from './utills/mail-service';
import { SoModuleService } from './web-services/so.modules.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderTransactionService } from './dbservices/orderDetials.service';
import { OrderDetails } from './models/orderDetails.model';
import { OrderLineItems } from './models/orderLineItems.model';
import { OrderLineItemsPlaced } from './models/orderLineItemsPlaced.model';
import { ErrorLog } from './models/errorLog.model';
import { ErrorLogService } from './dbservices/errorLog.service';
import { OrderPlacedLineItemsService } from './dbservices/orderPlaced.service';
import { OrderLineItemsService } from './dbservices/orderLineItems.service';

@Module({
  imports: [
    SoModuleService.initLogger(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB,
      entities: [OrderDetails,OrderLineItems,OrderLineItemsPlaced,ErrorLog],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([OrderDetails,OrderLineItems,OrderLineItemsPlaced,ErrorLog])
  ],
  controllers: [AppController],
  providers: [AppService,OrderTransactionService,ErrorLogService,OrderLineItemsService,OrderPlacedLineItemsService,MailService,FlintridgeService,ToastService]
})
export class AppModule {}
