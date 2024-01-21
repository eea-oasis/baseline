import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CheckAuthz } from '../../../authz/guards/authz.decorator';
import { SetCircuitInputsSchemaCommand } from '../capabilities/setCircuitInputsSchema/setCircuitInputsSchema.command';
import { CreateWorkstepCommand } from '../capabilities/createWorkstep/createWorkstep.command';
import { DeleteWorkstepCommand } from '../capabilities/deleteWorkstep/deleteWorkstep.command';
import { GetAllWorkstepsQuery } from '../capabilities/getAllWorksteps/getAllWorksteps.query';
import { GetWorkstepByIdQuery } from '../capabilities/getWorkstepById/getWorkstepById.query';
import { UpdateWorkstepCommand } from '../capabilities/updateWorkstep/updateWorkstep.command';
import { SetCircuitInputsSchemaDto } from './dtos/request/setCircuitInputsSchema.dto';
import { CreateWorkstepDto } from './dtos/request/createWorkstep.dto';
import { UpdateWorkstepDto } from './dtos/request/updateWorkstep.dto';
import { WorkstepDto } from './dtos/response/workstep.dto';

@Controller('worksteps')
export class WorkstepController {
  constructor(private commandBus: CommandBus, private queryBus: QueryBus) {}

  // TODO: DTO validation
  // TODO: Response DTOs
  // TODO: DTO -> Command mapping
  @Get('/:id')
  @CheckAuthz({ action: 'read', type: 'Workstep' })
  async getWorkstepById(@Param('id') id: string): Promise<WorkstepDto> {
    return await this.queryBus.execute(new GetWorkstepByIdQuery(id));
  }

  @Get()
  @CheckAuthz({ action: 'read', type: 'Workstep' })
  async getAllWorksteps(): Promise<WorkstepDto[]> {
    return await this.queryBus.execute(new GetAllWorkstepsQuery());
  }

  @Post()
  @CheckAuthz({ action: 'create', type: 'Workstep' })
  async createWorkstep(@Body() requestDto: CreateWorkstepDto): Promise<string> {
    return await this.commandBus.execute(
      new CreateWorkstepCommand(
        requestDto.name,
        requestDto.version,
        requestDto.status,
        requestDto.workgroupId,
        requestDto.securityPolicy,
        requestDto.privacyPolicy,
      ),
    );
  }

  @Put('/:id')
  @CheckAuthz({ action: 'update', type: 'Workstep' })
  async updateWorkstep(
    @Param('id') id: string,
    @Body() requestDto: UpdateWorkstepDto,
  ): Promise<WorkstepDto> {
    return await this.commandBus.execute(
      new UpdateWorkstepCommand(
        id,
        requestDto.name,
        requestDto.version,
        requestDto.status,
        requestDto.workgroupId,
        requestDto.securityPolicy,
        requestDto.privacyPolicy,
      ),
    );
  }

  @Put('/:id/circuitinputsschema')
  @CheckAuthz({ action: 'update', type: 'Workstep' })
  async setCircuitInputsSchemaCommand(
    @Param('id') id: string,
    @Body() requestDto: SetCircuitInputsSchemaDto,
  ): Promise<WorkstepDto> {
    return await this.commandBus.execute(
      new SetCircuitInputsSchemaCommand(
        id,
        requestDto.schema,
      ),
    );
  }

  @Delete('/:id')
  @CheckAuthz({ action: 'delete', type: 'Workstep' })
  async deleteWorkstep(@Param('id') id: string): Promise<void> {
    return await this.commandBus.execute(new DeleteWorkstepCommand(id));
  }
}
