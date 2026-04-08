import { status_ordem_servico } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemOrdemServicoDto {
  @IsOptional()
  @IsUUID()
  produto_id?: string;

  @IsOptional()
  @IsString()
  descricao_item?: string;

  @IsInt()
  @Min(1)
  quantidade: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  custo_unitario?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  venda_unitaria?: number;
}

export class CreateOrdemServicoDto {
  @IsUUID()
  cliente_id: string;

  @IsOptional()
  @IsUUID()
  atendente_id?: string;

  @IsOptional()
  @IsUUID()
  tecnico_id?: string;

  @IsString()
  @IsNotEmpty()
  aparelho_marca: string;

  @IsString()
  @IsNotEmpty()
  aparelho_modelo: string;

  @IsOptional()
  @IsString()
  aparelho_cor?: string;

  @IsOptional()
  @IsString()
  imei?: string;

  @IsString()
  @IsNotEmpty()
  defeito_relatado: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsString()
  senha_desbloqueio?: string;

  @IsBoolean()
  termo_responsabilidade_aceito: boolean;

  @IsOptional()
  @IsEnum(['retirada_loja', 'entrega'])
  tipo_entrega?: 'retirada_loja' | 'entrega';

  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_mao_de_obra?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  desconto?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemOrdemServicoDto)
  itens?: CreateItemOrdemServicoDto[];
}

export class UpdateStatusOrdemServicoDto {
  @IsEnum(status_ordem_servico)
  status: status_ordem_servico;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsOptional()
  @IsUUID()
  alterado_por?: string;
}

export class UpdateOrdemServicoDto {
  @IsOptional()
  @IsUUID()
  cliente_id?: string;

  @IsOptional()
  @IsUUID()
  atendente_id?: string;

  @IsOptional()
  @IsUUID()
  tecnico_id?: string;

  @IsOptional()
  @IsString()
  aparelho_marca?: string;

  @IsOptional()
  @IsString()
  aparelho_modelo?: string;

  @IsOptional()
  @IsString()
  aparelho_cor?: string;

  @IsOptional()
  @IsString()
  imei?: string;

  @IsOptional()
  @IsString()
  defeito_relatado?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsString()
  senha_desbloqueio?: string;

  @IsOptional()
  @IsBoolean()
  termo_responsabilidade_aceito?: boolean;

  @IsOptional()
  @IsEnum(['retirada_loja', 'entrega'])
  tipo_entrega?: 'retirada_loja' | 'entrega';

  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_mao_de_obra?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  desconto?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemOrdemServicoDto)
  itens?: CreateItemOrdemServicoDto[];
}
