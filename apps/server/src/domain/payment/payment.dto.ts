import { ApiProperty } from '@nestjs/swagger';
import { PaymentType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class PaymentCallbackDto {
  @ApiProperty({ description: '订单号', example: 'ORD20260430030000ABC123' })
  @IsString()
  @MaxLength(50)
  orderNo: string;

  @ApiProperty({ description: '支付渠道', enum: PaymentType, example: PaymentType.WECHAT })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({ description: '支付金额', example: 99 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: '支付完成时间', example: '2026-04-30T03:00:00.000Z' })
  @IsDateString()
  paidAt: string;

  @ApiProperty({ description: '回调签名', example: 'f4a8...' })
  @IsString()
  signature: string;
}
