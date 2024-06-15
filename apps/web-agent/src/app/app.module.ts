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
import { join } from 'path';

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
      entities: [OrderDetails],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([OrderDetails])
  ],
  controllers: [AppController],
  providers: [AppService,FlintridgeService,ToastService,OrderTransactionService,MailService]
})
export class AppModule {}
