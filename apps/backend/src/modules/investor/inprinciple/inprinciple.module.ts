import { Module } from '@nestjs/common';
import { InprincipleController } from './inprinciple.controller';
import { InprincipleService } from './inprinciple.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [InprincipleController],
  providers: [InprincipleService, PrismaService],
})
export class InprincipleModule {}
