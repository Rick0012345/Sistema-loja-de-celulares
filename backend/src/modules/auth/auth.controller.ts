import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { perfil_usuario } from '@prisma/client';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto, UpdateUserDto } from './auth.dto';
import type { AuthenticatedUser } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('status')
  getStatus() {
    return this.authService.status();
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  getCurrentUser(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.authService.getCurrentUser(currentUser.sub);
  }

  @Roles(perfil_usuario.administrador)
  @Get('users')
  listUsers() {
    return this.authService.listUsers();
  }

  @Roles(perfil_usuario.administrador)
  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.authService.createUser(dto);
  }

  @Roles(perfil_usuario.administrador)
  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.authService.updateUser(id, dto);
  }

  @Roles(perfil_usuario.administrador)
  @Delete('users/:id')
  disableUser(@Param('id') id: string) {
    return this.authService.disableUser(id);
  }
}
