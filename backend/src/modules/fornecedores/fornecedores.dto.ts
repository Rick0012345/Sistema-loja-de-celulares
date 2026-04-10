import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateFornecedorDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class UpdateFornecedorDto extends PartialType(CreateFornecedorDto) {
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
