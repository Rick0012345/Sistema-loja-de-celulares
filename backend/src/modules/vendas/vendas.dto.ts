import { meio_pagamento } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVendaItemDto {
  @IsUUID()
  produto_id: string;

  @IsInt()
  @Min(1)
  quantidade: number;
}

export class CreateVendaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cliente_nome?: string;

  @IsOptional()
  @IsUUID()
  cliente_id?: string;

  @IsEnum(meio_pagamento)
  meio_pagamento: meio_pagamento;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVendaItemDto)
  itens: CreateVendaItemDto[];
}
