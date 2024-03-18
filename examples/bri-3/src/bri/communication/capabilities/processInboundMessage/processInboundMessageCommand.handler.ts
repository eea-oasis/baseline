import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthAgent } from '../../../auth/agent/auth.agent';
import { BpiMessageAgent } from '../../agents/bpiMessages.agent';
import { BpiMessageStorageAgent } from '../../agents/bpiMessagesStorage.agent';
import { MessagingAgent } from '../../agents/messaging.agent';
import { ProcessInboundBpiMessageCommand } from './processInboundMessage.command';
import { PublicKeyType } from '../../../identity/bpiSubjects/models/publicKey';

// Difference between this and the create bpi message command handler is that this one does not
// stop the execution flow by throwing a nestjs exception (which results in 404 response in the other handler)
// TODO: Consider using a NestJs Saga or another command dispatch to avoid code duplication
@CommandHandler(ProcessInboundBpiMessageCommand)
export class ProcessInboundMessageCommandHandler
  implements ICommandHandler<ProcessInboundBpiMessageCommand>
{
  constructor(
    private readonly agent: BpiMessageAgent,
    private readonly storageAgent: BpiMessageStorageAgent,
    private readonly messagingAgent: MessagingAgent,
    private readonly authAgent: AuthAgent,
  ) {}

  async execute(command: ProcessInboundBpiMessageCommand) {
    if (await this.agent.bpiMessageIdAlreadyExists(command.id)) {
      return false;
    }

    const [fromBpiSubject, toBpiSubject] =
      await this.agent.fetchFromAndToBpiSubjects(command.from, command.to);

    if (!fromBpiSubject || !toBpiSubject) {
      return false;
    }

    const isSignatureValid =
      this.authAgent.verifyEddsaSignatureAgainstPublicKey(
        command.content,
        command.signature,
        fromBpiSubject.publicKeys.filter(
          (key) => key.type == PublicKeyType.EDDSA,
        )[0].value,
      );

    if (!isSignatureValid) {
      return false;
    }

    const newBpiMessageCandidate = this.agent.createNewBpiMessage(
      command.id,
      fromBpiSubject,
      toBpiSubject,
      command.content,
      command.signature,
      command.type,
    );

    const newBpiMessage = await this.storageAgent.storeNewBpiMessage(
      newBpiMessageCandidate,
    );

    await this.messagingAgent.publishMessage(
      toBpiSubject.publicKeys.filter(
        (key) => key.type == PublicKeyType.ECDSA,
      )[0].value,
      this.messagingAgent.serializeBpiMessage(newBpiMessage),
    );

    return true;
  }
}
