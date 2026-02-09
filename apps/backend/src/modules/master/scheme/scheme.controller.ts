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
import { SchemeService } from './scheme.service';
import { CreateSchemeDto, UpdateSchemeDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { SkipResourceCheck } from '../../../common/skip-resource-check.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/schemes')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class SchemeController {
    constructor(private schemeService: SchemeService) { }

    @Public()
    @Get('/master-tables')
    async getMasterTables() {
        return this.schemeService.getMasterTables();
    }

    @Post()
    async create(@Body() data: CreateSchemeDto) {
        return this.schemeService.create(data);
    }

    @Get()
    async findAll(
        @Query('isCurrentVersion') isCurrentVersion?: string,
        @Query('search') search?: string,
        @Query('policyId') policyId?: number,
    ) {
        const filters: any = {};

        if (isCurrentVersion !== undefined) {
            filters.is_current_version = isCurrentVersion === 'true';
        }

        if (search) {
            filters.search = search;
        }

        if (policyId) {
            filters.policy_id = policyId;
        }

        return this.schemeService.findAll(filters);
    }

    // Endpoint for investor/admin application forms - MUST be before :id route
    @SkipResourceCheck()
    @Get('by-code')
    async findByCode(
        @Query('policy_code') policyCode: string,
        @Query('scheme_code') schemeCode: string,
        @Query('version') version?: string,
    ) {
        const versionNum = version ? parseInt(version) : undefined;
        const scheme = await this.schemeService.findByCode(policyCode, schemeCode, versionNum);

        if (!scheme) {
            return { error: 'Scheme not found' };
        }

        return scheme;
    }

    @Get(':id')
    async findOne(@Param('id') id: number) {
        return this.schemeService.findOne(id);
    }

    @Put(':id')
    async update(@Param('id') id: number, @Body() data: UpdateSchemeDto) {
        return this.schemeService.update(id, data);
    }

    @Delete(':id')
    async delete(@Param('id') id: number) {
        return this.schemeService.delete(id);
    }

    @Put(':id/toggle')
    async toggle(@Param('id') id: number) {
        return this.schemeService.toggleVersion(id);
    }


}
