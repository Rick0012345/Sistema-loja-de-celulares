import {
  origem_movimentacao_estoque,
  tipo_movimentacao_estoque,
} from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProdutoDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  modelo_compatavel?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsInt()
  @Min(0)
  estoque_minimo: number;

  @IsNumber()
  @Min(0)
  preco_custo: number;

  @IsNumber()
  @Min(0)
  preco_venda: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantidade_inicial?: number;
}

export class UpdateProdutoDto extends PartialType(CreateProdutoDto) {}

export class RegistrarMovimentacaoDto {
  @IsEnum(tipo_movimentacao_estoque)
  tipo: tipo_movimentacao_estoque;

  @IsEnum(origem_movimentacao_estoque)
  origem: origem_movimentacao_estoque;

  @IsInt()
  quantidade: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  custo_unitario?: number;

  @IsOptional()
  @IsString()
  observacao?: string;
}
