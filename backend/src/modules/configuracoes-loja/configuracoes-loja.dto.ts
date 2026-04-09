import { IsOptional, IsString } from 'class-validator';

export class UpdateConfiguracoesLojaDto {
  @IsOptional()
  @IsString()
  telefone_loja?: string | null;
}
