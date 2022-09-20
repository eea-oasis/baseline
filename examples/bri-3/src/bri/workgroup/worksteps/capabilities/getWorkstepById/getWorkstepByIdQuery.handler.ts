import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { WorkstepDto } from '../../api/dtos/response/workstep.dto';
import { WorkstepStorageAgent } from '../../agents/workstepsStorage.agent';
import { GetWorkstepByIdQuery } from './getWorkstepById.query';

@QueryHandler(GetWorkstepByIdQuery)
export class GetWorkstepByIdQueryHandler
  implements IQueryHandler<GetWorkstepByIdQuery>
{
  constructor(private readonly storageAgent: WorkstepStorageAgent) {}

  async execute(query: GetWorkstepByIdQuery) {
    const workstep = await this.storageAgent.getWorkstepById(query.id);

    return {
      // TODO: Write generic mapper domainObject -> DTO
      id: workstep.id,
      name: workstep.name,
      version: workstep.version,
      status: workstep.status,
      workgroupId: workstep.workgroupId,
      securityPolicy: workstep.securityPolicy,
      privacyPolicy: workstep.privacyPolicy,
    } as WorkstepDto;
  }
}