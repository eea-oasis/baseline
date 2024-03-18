import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BpiSubjectAgent } from '../../agents/bpiSubjects.agent';
import { BpiSubjectStorageAgent } from '../../agents/bpiSubjectsStorage.agent';
import { CreateBpiSubjectCommand } from './createBpiSubject.command';
import { PublicKeyType } from '../../models/publicKey';
import { v4 } from 'uuid';

@CommandHandler(CreateBpiSubjectCommand)
export class CreateBpiSubjectCommandHandler
  implements ICommandHandler<CreateBpiSubjectCommand>
{
  constructor(
    private readonly agent: BpiSubjectAgent,
    private readonly storageAgent: BpiSubjectStorageAgent,
  ) {}

  async execute(command: CreateBpiSubjectCommand) {
    this.agent.throwIfCreateBpiSubjectInputInvalid(command.name);

    const newBpiSubjectCandidate = await this.agent.createNewExternalBpiSubject(
      command.name,
      command.description,
    );

    const newBpiSubject = await this.storageAgent.storeNewBpiSubject(
      newBpiSubjectCandidate,
    );

    const newPublicKeys = await Promise.all(
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

        return await this.storageAgent.storePublicKey(
          v4(),
          publicKeyType,
          key.value,
          newBpiSubject.id,
        );
      }),
    );

    return newBpiSubject.id;
  }
}
