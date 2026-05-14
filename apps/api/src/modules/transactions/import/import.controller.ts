import {
    BadRequestException,
    Body,
    Controller,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { ImportService } from './import.service';
  import { CommitImportDto } from './dto/commit-import.dto';
  import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
  import { CurrentUser } from '../../../common/decorators/current-user.decorator';
  
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
  const ALLOWED_EXTENSIONS = ['.csv', '.tsv', '.ofx', '.qfx'];
  
  @Controller('transactions/import')
  @UseGuards(JwtAuthGuard)
  export class ImportController {
    constructor(private readonly importService: ImportService) {}
  
    @Post('preview')
    @UseInterceptors(
      FileInterceptor('file', {
        limits: { fileSize: MAX_FILE_SIZE },
      }),
    )
    preview(
      @CurrentUser('sub') userId: string,
      @UploadedFile() file: Express.Multer.File,
    ) {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }
  
      const extension = this.getExtension(file.originalname);
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        throw new BadRequestException(
          `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
        );
      }
  
      return this.importService.preview(userId, file.originalname, file.buffer);
    }
  
    @Post('commit')
    commit(
      @CurrentUser('sub') userId: string,
      @Body() dto: CommitImportDto,
    ) {
      if (dto.items.length === 0) {
        throw new BadRequestException('No transactions to import');
      }
      return this.importService.commit(userId, dto);
    }
  
    private getExtension(fileName: string): string {
      const lastDot = fileName.lastIndexOf('.');
      return lastDot === -1 ? '' : fileName.slice(lastDot).toLowerCase();
    }
  }