import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Transaction } from '../models/transaction';
import { TransactionStatus } from '../models/transactionStatus.enum';

import { AuthAgent } from '../../auth/agent/auth.agent';
import { BpiSubjectAccount } from '../../identity/bpiSubjectAccounts/models/bpiSubjectAccount';
import { MerkleTreeService } from '../../merkleTree/services/merkleTree.service';
import { WorkflowStorageAgent } from '../../workgroup/workflows/agents/workflowsStorage.agent';
import { WorkstepStorageAgent } from '../../workgroup/worksteps/agents/workstepsStorage.agent';
import { Workstep } from '../../workgroup/worksteps/models/workstep';
import { ICircuitService } from '../../zeroKnowledgeProof/services/circuit/circuitService.interface';
import {
  DELETE_WRONG_STATUS_ERR_MESSAGE,
  NOT_FOUND_ERR_MESSAGE,
  UPDATE_WRONG_STATUS_ERR_MESSAGE,
} from '../api/err.messages';
import { TransactionStorageAgent } from './transactionStorage.agent';
import { TransactionResult } from '../models/transactionResult';
import { PublicKeyType } from '../../identity/bpiSubjects/models/publicKey';

@Injectable()
export class TransactionAgent {
  constructor(
    private txStorageAgent: TransactionStorageAgent,
    private workstepStorageAgent: WorkstepStorageAgent,
    private workflowStorageAgent: WorkflowStorageAgent,
    private authAgent: AuthAgent,
    private merkleTreeService: MerkleTreeService,
    @Inject('ICircuitService')
    private readonly circuitService: ICircuitService,
  ) {}

  public throwIfCreateTransactionInputInvalid() {
    // TODO: This is a placeholder, we will add validation rules as we move forward with business logic implementation
    return true;
  }

  public isCreateTransactionInputInvalid(): boolean {
    // TODO: This is a placeholder, we will add validation rules as we move forward with business logic implementation
    return true;
  }

  public createNewTransaction(
    id: string,
    nonce: number,
    workflowInstanceId: string,
    workstepInstanceId: string,
    fromBpiSubjectAccount: BpiSubjectAccount,
    toBpiSubjectAccount: BpiSubjectAccount,
    payload: string,
    signature: string,
  ): Transaction {
    return new Transaction(
      id,
      nonce,
      workflowInstanceId,
      workstepInstanceId,
      fromBpiSubjectAccount,
      toBpiSubjectAccount,
      payload,
      signature,
      TransactionStatus.Initialized,
    );
  }

  public async fetchUpdateCandidateAndThrowIfUpdateValidationFails(
    id: string,
  ): Promise<Transaction> {
    const transactionToUpdate = await this.txStorageAgent.getTransactionById(
      id,
    );

    if (!transactionToUpdate) {
      throw new NotFoundException(NOT_FOUND_ERR_MESSAGE);
    }

    if (transactionToUpdate.status !== TransactionStatus.Initialized) {
      throw new BadRequestException(UPDATE_WRONG_STATUS_ERR_MESSAGE);
    }

    return transactionToUpdate;
  }

  public updateTransaction(
    transactionToUpdate: Transaction,
    payload: string,
    signature: string,
  ) {
    transactionToUpdate.updatePayload(payload, signature);
  }

  public updateTransactionStatusToProcessing(
    transactionsToUpdate: Transaction,
  ) {
    transactionsToUpdate.updateStatusToProcessing();
  }

  public async fetchDeleteCandidateAndThrowIfDeleteValidationFails(
    id: string,
  ): Promise<Transaction> {
    const transactionToDelete = await this.txStorageAgent.getTransactionById(
      id,
    );

    if (!transactionToDelete) {
      throw new NotFoundException(NOT_FOUND_ERR_MESSAGE);
    }

    if (
      transactionToDelete.status === TransactionStatus.Processing ||
      transactionToDelete.status === TransactionStatus.Executed
    ) {
      throw new BadRequestException(DELETE_WRONG_STATUS_ERR_MESSAGE);
    }

    return transactionToDelete;
  }

  public async validateTransactionForExecution(
    tx: Transaction,
  ): Promise<boolean> {
    // TODO: Log each validation err for now
    const workflow = await this.workflowStorageAgent.getWorkflowById(
      tx.workflowInstanceId,
    );

    if (!workflow) {
      return false;
    }

    const workstep = await this.workstepStorageAgent.getWorkstepById(
      tx.workstepInstanceId,
    );

    if (!workstep) {
      return false;
    }

    if (!tx.fromBpiSubjectAccount) {
      return false;
    }

    if (!tx.toBpiSubjectAccount) {
      return false;
    }

    if (tx.nonce !== workflow.bpiAccount.nonce + 1) {
      return false;
    }

    const isSignatureValid =
      this.authAgent.verifyEddsaSignatureAgainstPublicKey(
        tx.payload,
        tx.signature,
        tx.fromBpiSubjectAccount.ownerBpiSubject.publicKeys.filter(
          (key) => key.type == PublicKeyType.EDDSA,
        )[0].value,
      );

    if (!isSignatureValid) {
      return false;
    }

    if (tx.status !== TransactionStatus.Processing) {
      return false;
    }

    return true;
  }

  public async executeTransaction(
    tx: Transaction,
    workstep: Workstep,
  ): Promise<TransactionResult> {
    const txResult = new TransactionResult();

    const merkelizedPayload = this.merkleTreeService.merkelizePayload(
      JSON.parse(tx.payload),
      `${process.env.MERKLE_TREE_HASH_ALGH}`,
    );
    txResult.merkelizedPayload = merkelizedPayload;

    const {
      snakeCaseWorkstepName,
      circuitProvingKeyPath,
      circuitVerificatioKeyPath,
      circuitPath,
    } = this.constructCircuitPathsFromWorkstepName(workstep.name);

    txResult.witness = await this.circuitService.createWitness(
      { tx, merkelizedPayload },
      snakeCaseWorkstepName,
      circuitPath,
      circuitProvingKeyPath,
      circuitVerificatioKeyPath,
    );

    const hashFn = this.merkleTreeService.createHashFunction(
      `${process.env.MERKLE_TREE_HASH_ALGH}`,
    );

    const merkelizedInvoiceRoot = merkelizedPayload.getRoot().toString('hex');
    const witnessHash = hashFn(JSON.stringify(txResult.witness)).toString(
      'hex',
    );

    txResult.hash = hashFn(`${merkelizedInvoiceRoot}${witnessHash}`).toString(
      'hex',
    );

    return txResult;
  }

  // TODO: #744 Only for the purposes of temporary convention
  // to connect worksteps with circuits on the file system.
  // Format is: <path_from_env>/<workstep_name_in_snake_case>_<predefined_suffix>.
  // Will be ditched completely as part of milestone 5.
  private constructCircuitPathsFromWorkstepName(name: string): {
    snakeCaseWorkstepName: string;
    circuitProvingKeyPath: string;
    circuitVerificatioKeyPath: string;
    circuitPath: string;
  } {
    const snakeCaseWorkstepName = this.convertStringToSnakeCase(name);

    const circuitProvingKeyPath =
      process.env.SNARKJS_CIRCUITS_PATH +
      snakeCaseWorkstepName +
      '/' +
      snakeCaseWorkstepName +
      '_circuit_final.zkey';

    const circuitVerificatioKeyPath =
      process.env.SNARKJS_CIRCUITS_PATH +
      snakeCaseWorkstepName +
      '/' +
      snakeCaseWorkstepName +
      '_circuit_verification_key.json';

    const circuitPath =
      process.env.SNARKJS_CIRCUITS_PATH +
      snakeCaseWorkstepName +
      '/' +
      snakeCaseWorkstepName +
      '_circuit.wasm';

    return {
      snakeCaseWorkstepName,
      circuitProvingKeyPath,
      circuitVerificatioKeyPath,
      circuitPath,
    };
  }

  // TODO: #744 ChatGPT generated only for the purposes of temporary convention
  // to connect worksteps with circuits on the file system.
  private convertStringToSnakeCase(name: string): string {
    // Remove any leading or trailing spaces
    name = name.trim();

    // Replace spaces, hyphens, and underscores with a single underscore
    name = name.replace(/[\s-]/g, '_');

    // Convert uppercase letters to lowercase and insert an underscore before them if they are not at the beginning
    name = name.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`);

    // Remove any consecutive underscores
    name = name.replace(/_+/g, '_');

    // Remove any non-alphanumeric characters except for underscore
    name = name.replace(/[^a-zA-Z0-9_]/g, '');

    return name;
  }
}
