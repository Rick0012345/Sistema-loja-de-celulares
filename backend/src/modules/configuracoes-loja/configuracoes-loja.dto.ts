import { IsOptional, IsString } from 'class-validator';

export class UpdateConfiguracoesLojaDto {
  @IsOptional()
  @IsString()
  telefone_loja?: string | null;

  @IsOptional()
  @IsString()
  evolution_instance_name?: string | null;

  @IsOptional()
  @IsString()
  evolution_api_base_url?: string | null;

  @IsOptional()
  @IsString()
  evolution_api_key?: string | null;

  @IsOptional()
  @IsString()
  ordem_pronta_webhook_url?: string | null;

  @IsOptional()
  @IsString()
  ordem_pronta_webhook_token?: string | null;
}
