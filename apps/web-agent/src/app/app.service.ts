import { Injectable } from '@nestjs/common';
import { OrderRequestDto } from './dtos/order-request.dto';
import { chromium } from 'playwright';
import { Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  
  }
