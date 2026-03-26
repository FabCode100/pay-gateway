import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async createCheckout(@Body() dto: CreateCheckoutDto) {
    return this.checkoutService.processCheckout(dto);
  }

  @Get('status/:orderId')
  async getStatus(@Param('orderId') orderId: string) {
    return this.checkoutService.getOrderStatus(orderId);
  }

  @Get('transactions')
  async getTransactions() {
    return this.checkoutService.getAllTransactions();
  }
}
