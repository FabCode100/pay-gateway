import { IsNotEmpty, IsEmail, IsNumber, IsString, Min, IsOptional } from 'class-validator';

export class CreateCheckoutDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsNotEmpty()
  @IsString()
  customerName: string;

  @IsNotEmpty()
  @IsEmail()
  customerEmail: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
