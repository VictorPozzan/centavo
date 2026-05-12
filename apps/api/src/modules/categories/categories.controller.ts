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
  import { CategoriesService } from './categories.service';
  import { CreateCategoryDto } from './dto/create-category.dto';
  import { UpdateCategoryDto } from './dto/update-category.dto';
  import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
  import { CurrentUser } from '../../common/decorators/current-user.decorator';
  
  @Controller('categories')
  @UseGuards(JwtAuthGuard)
  export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {}
  
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@CurrentUser('sub') userId: string, @Body() dto: CreateCategoryDto) {
      return this.categoriesService.create(userId, dto);
    }
  
    @Get()
    findAll(@CurrentUser('sub') userId: string) {
      return this.categoriesService.findAll(userId);
    }
  
    @Get(':id')
    findOne(
      @CurrentUser('sub') userId: string,
      @Param('id', ParseUUIDPipe) id: string,
    ) {
      return this.categoriesService.findOne(userId, id);
    }
  
    @Patch(':id')
    update(
      @CurrentUser('sub') userId: string,
      @Param('id', ParseUUIDPipe) id: string,
      @Body() dto: UpdateCategoryDto,
    ) {
      return this.categoriesService.update(userId, id, dto);
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(
      @CurrentUser('sub') userId: string,
      @Param('id', ParseUUIDPipe) id: string,
    ) {
      return this.categoriesService.remove(userId, id);
    }
  }