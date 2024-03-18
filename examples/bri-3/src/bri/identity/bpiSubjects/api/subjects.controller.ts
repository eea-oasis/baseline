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
import { CreateBpiSubjectCommand } from '../capabilities/createBpiSubject/createBpiSubject.command';
import { DeleteBpiSubjectCommand } from '../capabilities/deleteBpiSubject/deleteBpiSubject.command';
import { GetAllBpiSubjectsQuery } from '../capabilities/getAllBpiSubjects/getAllBpiSubjects.query';
import { GetBpiSubjectByIdQuery } from '../capabilities/getBpiSubjectById/getBpiSubjectById.query';
import { UpdateBpiSubjectCommand } from '../capabilities/updateBpiSubject/updateBpiSubject.command';
import { CreateBpiSubjectDto } from './dtos/request/createBpiSubject.dto';
import { UpdateBpiSubjectDto } from './dtos/request/updateBpiSubject.dto';
import { BpiSubjectDto } from './dtos/response/bpiSubject.dto';
import { CheckAuthz } from '../../../authz/guards/authz.decorator';

@Controller('subjects')
export class SubjectController {
  constructor(private commandBus: CommandBus, private queryBus: QueryBus) {}

  @Get('/:id')
  @CheckAuthz({ action: 'read', type: 'BpiSubject' })
  async getBpiSubjectById(@Param('id') id: string): Promise<BpiSubjectDto> {
    return await this.queryBus.execute(new GetBpiSubjectByIdQuery(id));
  }

  @Get()
  @CheckAuthz({ action: 'read', type: 'BpiSubject' })
  async getAllBpiSubjects(): Promise<BpiSubjectDto[]> {
    return await this.queryBus.execute(new GetAllBpiSubjectsQuery());
  }

  @Post()
  @CheckAuthz({ action: 'create', type: 'BpiSubject' })
  async createBpiSubject(
    @Body() requestDto: CreateBpiSubjectDto,
  ): Promise<string> {
    return await this.commandBus.execute(
      new CreateBpiSubjectCommand(
        requestDto.name,
        requestDto.desc,
        requestDto.publicKeys,
      ),
    );
  }

  @Put('/:id')
  @CheckAuthz({ action: 'update', type: 'BpiSubject' })
  async updateBpiSubject(
    @Param('id') id: string,
    @Body() requestDto: UpdateBpiSubjectDto,
  ): Promise<BpiSubjectDto> {
    return await this.commandBus.execute(
      new UpdateBpiSubjectCommand(
        id,
        requestDto.name,
        requestDto.desc,
        requestDto.publicKeys,
      ),
    );
  }

  @Delete('/:id')
  @CheckAuthz({ action: 'delete', type: 'BpiSubject' })
  async deleteBpiSubject(@Param('id') id: string): Promise<void> {
    return await this.commandBus.execute(new DeleteBpiSubjectCommand(id));
  }
}
