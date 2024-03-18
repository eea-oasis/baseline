import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BpiSubjectAgent } from '../../agents/bpiSubjects.agent';
import { BpiSubjectStorageAgent } from '../../agents/bpiSubjectsStorage.agent';
import { BpiSubjectDto } from '../../api/dtos/response/bpiSubject.dto';
import { BpiSubject } from '../../models/bpiSubject';
import { UpdateBpiSubjectCommand } from './updateBpiSubject.command';
import { PublicKey, PublicKeyType } from '../../models/publicKey';

@CommandHandler(UpdateBpiSubjectCommand)
export class UpdateBpiSubjectCommandHandler
  implements ICommandHandler<UpdateBpiSubjectCommand>
{
  constructor(
    @InjectMapper() private mapper: Mapper,
    private agent: BpiSubjectAgent,
    private storageAgent: BpiSubjectStorageAgent,
  ) {}

  async execute(command: UpdateBpiSubjectCommand) {
    const bpiSubjectToUpdate: BpiSubject =
      await this.agent.fetchUpdateCandidateAndThrowIfUpdateValidationFails(
        command.id,
      );

    const newPublicKeys = await Promise.all<PublicKey>(
      command.publicKeys.map(async (key) => {
        let publicKeyType;
        switch (key.type.toLowerCase()) {
          case 'ecdsa':
            publicKeyType = PublicKeyType.ECDSA;
            break;
          case 'eddsa':
            publicKeyType = PublicKeyType.EDDSA;
            break;
          default:
        }

        return await this.storageAgent.updatePublicKey(
          publicKeyType,
          key.value,
          bpiSubjectToUpdate.id,
        );
      }),
    );

    this.agent.updateBpiSubject(
      bpiSubjectToUpdate,
      command.name,
      command.description,
      newPublicKeys,
    );

    const bpiSubject = await this.storageAgent.updateBpiSubject(
      bpiSubjectToUpdate,
    );

    return this.mapper.map(bpiSubject, BpiSubject, BpiSubjectDto);
  }
}
