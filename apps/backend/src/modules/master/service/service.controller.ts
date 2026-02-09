import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { Public } from '../../../common/public.decorator';

@Public()
@Controller('master/service')
export class ServiceController {
    constructor(private ServiceService: ServiceService) {}
    
    @Get()
    async findAll(
        @Query('isActive') isActive?: string,
        @Query('search') search?: string,
        @Query('departmentIds') departmentIds?: string,
        @Query('swcsServiceIds') swcsServiceIds?: string,
    ) {
        const filters: any = {};

        if (isActive !== undefined) {
        filters.isActive = isActive === 'true';
        }

        if (search) {
        filters.search = search;
        }

        if (departmentIds) {
        filters.departmentIds = departmentIds
            .split(',')
            .map((id) => parseInt(id, 10))
            .filter((id) => !Number.isNaN(id));
        }

        if (swcsServiceIds) {
        filters.swcsServiceIds = swcsServiceIds
            .split(',')
            .map((id) => parseInt(id, 10))
            .filter((id) => !Number.isNaN(id));
        }

        return this.ServiceService.findAll(filters);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.ServiceService.findOne(parseInt(id));
    }

    @Post()
    create(@Body() CreateServiceDto: CreateServiceDto) {
    return this.ServiceService.create(CreateServiceDto);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: UpdateServiceDto) {
         return this.ServiceService.update(parseInt(id), data);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.ServiceService.delete(parseInt(id));
    }

    @Put(':id/toggle')
    async toggle(@Param('id') id: string) {
        return this.ServiceService.toggle(parseInt(id));
    }
}
