import { perfil_usuario } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class BootstrapAdminDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  email: string;


  @IsEnum(perfil_usuario)
  perfil: perfil_usuario = perfil_usuario.administrador;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  senha: string;
}
