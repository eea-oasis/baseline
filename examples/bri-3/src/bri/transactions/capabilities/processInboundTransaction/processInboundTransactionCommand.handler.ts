import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BpiSubjectAccountAgent } from 'src/bri/identity/bpiSubjectAccounts/agents/bpiSubjectAccounts.agent';
import { AuthAgent } from '../../../auth/agent/auth.agent';
import { TransactionAgent } from '../../agents/transactions.agent';
import { TransactionStorageAgent } from '../../agents/transactionStorage.agent';
import { ProcessInboundBpiTransactionCommand } from './processInboundTransaction.command';
import { PublicKeyType } from '../../../identity/bpiSubjects/models/publicKey';

// Difference between this and the create bpi transaction command handler is that this one does not
// stop the execution flow by throwing a nestjs exception (which results in 404 response in the other handler)
// TODO: Consider using a NestJs Saga or another command dispatch to avoid code duplication
@CommandHandler(ProcessInboundBpiTransactionCommand)
export class ProcessInboundTransactionCommandHandler
  implements ICommandHandler<ProcessInboundBpiTransactionCommand>
{
  constructor(
    private agent: TransactionAgent,
    private storageAgent: TransactionStorageAgent,
    private subjectAccountAgent: BpiSubjectAccountAgent,
    private readonly authAgent: AuthAgent,
  ) {}

  async execute(command: ProcessInboundBpiTransactionCommand) {
    if (this.agent.isCreateTransactionInputInvalid()) {
      return false;
    }

    const subjectAccounts =
      await this.subjectAccountAgent.getBpiSubjectAccounts([
        command.fromSubjectAccountId,
        command.toSubjectAccountId,
      ]);

    if (subjectAccounts.length !== 2) {
      return false;
    }

    const isSignatureValid =
      this.authAgent.verifyEddsaSignatureAgainstPublicKey(
        command.payload,
        command.signature,
        subjectAccounts[0].ownerBpiSubject.publicKeys.filter(
          (key) => key.type == PublicKeyType.EDDSA,
        )[0].value,
      );

    if (!isSignatureValid) {
      return false;
    }

    const newTransactionCandidate = this.agent.createNewTransaction(
      command.id,
      command.nonce,
      command.workflowInstanceId,
      command.workstepInstanceId,
      subjectAccounts[0],
      subjectAccounts[1],
      command.payload,
      command.signature,
    );

    await this.storageAgent.storeNewTransaction(newTransactionCandidate);

    return true;
  }
}
