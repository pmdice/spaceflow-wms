import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PalletsService } from './pallets.service';

@Controller('pallets')
export class PalletsController {
  constructor(private readonly palletsService: PalletsService) {}

  @Get()
  findAll() {
    return this.palletsService.findAll();
  }

  @Post(':id/actions')
  @HttpCode(HttpStatus.OK)
  applyAction(@Param('id') id: string, @Body() body: unknown) {
    return this.palletsService.applyAction(id, body);
  }
}
