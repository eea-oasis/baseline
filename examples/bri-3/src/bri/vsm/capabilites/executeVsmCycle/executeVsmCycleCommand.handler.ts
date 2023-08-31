import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { TransactionStorageAgent } from '../../../transactions/agents/transactionStorage.agent';
import { TransactionAgent } from '../../../transactions/agents/transactions.agent';
import { TransactionStatus } from '../../../transactions/models/transactionStatus.enum';
import { WorkstepStorageAgent } from '../../../workgroup/worksteps/agents/workstepsStorage.agent';
import { ExecuteVsmCycleCommand } from './executeVsmCycle.command';
import { WorkstepExecutionEvent } from '../handleWorkstepEvents/workstepExecution.event';

@CommandHandler(ExecuteVsmCycleCommand)
export class ExecuteVsmCycleCommandHandler
  implements ICommandHandler<ExecuteVsmCycleCommand>
{
  constructor(
    private agent: TransactionAgent,
    private workstepStorageAgent: WorkstepStorageAgent,
    private txStorageAgent: TransactionStorageAgent,
    private eventBus: EventBus,
  ) {}

  async execute(command: ExecuteVsmCycleCommand) {
    const executionCandidates =
      await this.txStorageAgent.getTopNTransactionsByStatus(
        Number(process.env.VSM_CYCLE_TX_BATCH_SIZE),
        TransactionStatus.Initialized,
      );

    executionCandidates.forEach(async (tx) => {
      tx.updateStatusToProcessing();
      await this.txStorageAgent.updateTransactionStatus(tx);

      if (!this.agent.validateTransactionForExecution(tx)) {
        this.eventBus.publish(
          new WorkstepExecutionEvent(tx, 'Validation Error'),
        );
        tx.updateStatusToInvalid();
        await this.txStorageAgent.updateTransactionStatus(tx);
        return;
      }

      const workstep = await this.workstepStorageAgent.getWorkstepById(
        tx.workstepInstanceId,
      );

      try {
        const txResult = await this.agent.executeTransaction(tx, workstep!);
        // TODO: When do we update the nonce on the BpiAccount? // Whenever a transaction is initiated
        // TODO: #702 Update relevant Bpi Account state with txResult sucess
        tx.updateStatusToExecuted();
        this.txStorageAgent.updateTransactionStatus(tx);
      } catch (error) {
        this.eventBus.publish(new WorkstepExecutionEvent(tx, error));
        tx.updateStatusToAborted();
        this.txStorageAgent.updateTransactionStatus(tx);
        return;
      }

      await this.eventBus.publish(new WorkstepExecutionEvent(tx, 'Success'));
    });
  }
}
