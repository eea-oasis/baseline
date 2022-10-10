import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BpiSubjectDto } from '../../api/dtos/response/bpiSubject.dto';
import { BpiSubjectStorageAgent } from '../../agents/bpiSubjectsStorage.agent';
import { GetBpiSubjectByIdQuery } from './getBpiSubjectById.query';
import { NotFoundException } from '@nestjs/common';
import { NOT_FOUND_ERR_MESSAGE } from '../../api/err.messages';

@QueryHandler(GetBpiSubjectByIdQuery)
export class GetBpiSubjectByIdQueryHandler
  implements IQueryHandler<GetBpiSubjectByIdQuery>
{
  constructor(private readonly storageAgent: BpiSubjectStorageAgent) {}

  async execute(query: GetBpiSubjectByIdQuery) {
    const bpiSubject = await this.storageAgent.getBpiSubjectById(query.id);

    if (!bpiSubject) {
      throw new NotFoundException(NOT_FOUND_ERR_MESSAGE);
    }

    return {
      // TODO: Write generic mapper domainObject -> DTO
      id: bpiSubject.id,
      name: bpiSubject.name,
      desc: bpiSubject.description,
      publicKey: bpiSubject.publicKey,
    } as BpiSubjectDto;
  }
}
