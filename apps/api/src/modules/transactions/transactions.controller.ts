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
    Query,
    UseGuards,
  } from '@nestjs/common';
  import { TransactionsService } from './transactions.service';
  import { CreateTransactionDto } from './dto/create-transaction.dto';
  import { UpdateTransactionDto } from './dto/update-transaction.dto';
  import { ListTransactionsDto } from './dto/list-transactions.dto';
  import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
  import { CurrentUser } from '../../common/decorators/current-user.decorator';
  
  @Controller('transactions')
  @UseGuards(JwtAuthGuard)
  export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) {}
  
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(
      @CurrentUser('sub') userId: string,
      @Body() dto: CreateTransactionDto,
    ) {
      return this.transactionsService.create(userId, dto);
    }
  
    @Get()
    findAll(
      @CurrentUser('sub') userId: string,
      @Query() filters: ListTransactionsDto,
    ) {
      return this.transactionsService.findAll(userId, filters);
    }
  
    @Get(':id')
    findOne(
      @CurrentUser('sub') userId: string,
      @Param('id', ParseUUIDPipe) id: string,
    ) {
      return this.transactionsService.findOne(userId, id);
    }
  
    @Patch(':id')
    update(
      @CurrentUser('sub') userId: string,
      @Param('id', ParseUUIDPipe) id: string,
      @Body() dto: UpdateTransactionDto,
    ) {
      return this.transactionsService.update(userId, id, dto);
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(
      @CurrentUser('sub') userId: string,
      @Param('id', ParseUUIDPipe) id: string,
    ) {
      return this.transactionsService.remove(userId, id);
    }
  }