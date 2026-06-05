/**
 * 更新牛散 DTO
 * 所有字段可选，用于部分更新
 */

import { PartialType } from '@nestjs/swagger';
import { CreateInvestorDto } from './create-investor.dto';

export class UpdateInvestorDto extends PartialType(CreateInvestorDto) {}
