import { IEventHandler } from '@nestjs/cqrs';
import { EventsHandler } from '@nestjs/cqrs/dist/decorators/events-handler.decorator';
import { WorkstepExecutedEvent } from './workstepExecuted.event';
import { LoggingService } from '../../../../shared/logging/logging.service';
import { BpiMessage } from '../../../communication/models/bpiMessage';
import { BpiMessageType } from '../../../communication/models/bpiMessageType.enum';
import { MessagingAgent } from '../../../communication/agents/messaging.agent';
import { PublicKeyType } from '../../../identity/bpiSubjects/models/publicKey';

@EventsHandler(WorkstepExecutedEvent)
export class WorkstepExecutedEventHandler
  implements IEventHandler<WorkstepExecutedEvent>
{
  constructor(
    private readonly logger: LoggingService,
    private readonly messagingAgent: MessagingAgent,
  ) {}

  async handle(event: WorkstepExecutedEvent) {
    let message: string, messageType: number;

    if (event.status !== 'Success') {
      message = `Failed execution of transaction with id ${event.tx.id}. Error: ${event.status}`;
      messageType = BpiMessageType.Err;

      this.logger.logError(message);
    } else {
      message = `Transaction ${event.tx.id} from ${event.tx.fromBpiSubjectAccountId} to ${event.tx.toBpiSubjectAccountId} successfully executed`;
      messageType = BpiMessageType.Info;

      this.logger.logInfo(message);
    }

    // Update standardized payload here
    const payload = this.constructPayload(message);

    const bpiMessage = new BpiMessage(
      event.tx.id,
      event.tx.fromBpiSubjectAccountId,
      event.tx.toBpiSubjectAccountId,
      JSON.stringify(payload),
      event.tx.signature,
      messageType,
    );

    const publicKey =
      event.tx.toBpiSubjectAccount.ownerBpiSubject.publicKeys.filter(
        (key) => key.type == PublicKeyType.ECDSA,
      )[0].value;

    // Change channels to publish message here
    const channels = [publicKey];

    if (event.status == 'Success') {
      channels.push(publicKey);
    }

    await this.publishMessage(channels, bpiMessage);
  }

  private constructPayload(message: string) {
    return {
      id: 'xxx', // TODO: Update standardized message payload
      info: message,
    };
  }

  private async publishMessage(channels: string[], bpiMessage: BpiMessage) {
    for (const channel of channels) {
      await this.messagingAgent.publishMessage(
        channel,
        JSON.stringify(bpiMessage),
      );
    }
  }
}
