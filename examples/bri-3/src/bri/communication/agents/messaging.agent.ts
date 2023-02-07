import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { LoggingService } from '../../../shared/logging/logging.service';
import { ProcessInboundMessageCommand } from '../capabilities/processInboundMessage/processInboundMessage.command';
import { IMessagingClient } from '../messagingClients/messagingClient.interface';

@Injectable()
export class MessagingAgent implements OnApplicationBootstrap {
  constructor(
    @Inject('IMessagingClient')
    private readonly messagingClient: IMessagingClient,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {}

  async onApplicationBootstrap() {
    this.messagingClient.subscribe(
      'general',
      this.onNewMessageReceived.bind(this),
    );
  }

  async publishMessage(channelName: string, message: string): Promise<void> {
    await this.messagingClient.publish(channelName, message);
  }

  private onNewMessageReceived(rawMessage: string): void {
    this.logger.logInfo(
      `MessagingListenerAgent: New raw message received: ${rawMessage}. Dispatching ProcessInboundMessageCommand`,
    );
    this.commandBus.execute(new ProcessInboundMessageCommand(rawMessage));
  }
}