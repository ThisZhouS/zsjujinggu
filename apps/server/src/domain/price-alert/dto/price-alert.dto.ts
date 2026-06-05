import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, Matches, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PriceAlertType } from '@prisma/client';

export class CreatePriceAlertDto {
  @ApiProperty({ description: '股票代码', example: '300750.SZ' })
  @IsString()
  @Matches(/^\d{6}(\.(SH|SZ|BJ))?$/i, { message: '股票代码格式不正确' })
  stockCode: string;

  @ApiProperty({ description: '提醒类型', enum: PriceAlertType, example: 'ABOVE' })
  @IsEnum(PriceAlertType)
  alertType: PriceAlertType;

  @ApiProperty({ description: '目标价格', example: 400 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: '目标价格格式不正确' })
  @Min(0.01, { message: '目标价格必须大于0' })
  @Max(999999.99, { message: '目标价格过大' })
  targetPrice: number;
}
