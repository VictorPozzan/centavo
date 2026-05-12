import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
  } from '@nestjs/common';
  import { AccountsService } from './accounts.service';
  import { CreateAccountDto } from './dto/create-account.dto';
  import { UpdateAccountDto } from './dto/update-account.dto';
  import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
  import { CurrentUser } from '../../common/decorators/current-user.decorator';
  
  @Controller('accounts')
  @UseGuards(JwtAuthGuard)
  export class AccountsController {
    constructor(private readonly accountsService: AccountsService) {}
  
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@CurrentUser('sub') userId: string, @Body() dto: CreateAccountDto) {
      return this.accountsService.create(userId, dto);
    }
  
    @Get()
    findAll(@CurrentUser('sub') userId: string) {
      return this.accountsService.findAll(userId);
    }
  
    @Get(':id')
    findOne(
      @CurrentUser('sub') userId: string,
      @Param('id', ParseUUIDPipe) id: string,
    ) {
      return this.accountsService.findOne(userId, id);
    }
  
    @Patch(':id')
    update(
      @CurrentUser('sub') userId: string,
      @Param('id', ParseUUIDPipe) id: string,
      @Body() dto: UpdateAccountDto,
    ) {
      return this.accountsService.update(userId, id, dto);
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(
      @CurrentUser('sub') userId: string,
      @Param('id', ParseUUIDPipe) id: string,
    ) {
      return this.accountsService.remove(userId, id);
    }
  }