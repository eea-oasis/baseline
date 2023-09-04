import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { uuid } from 'uuidv4';
import { ICircuitService } from '../../../bri/zeroKnowledgeProof/services/circuit/circuitService.interface';
import { TestDataHelper } from '../../../shared/testing/testData.helper';
import { AuthAgent } from '../../auth/agent/auth.agent';
import { BpiSubjectAccount } from '../../identity/bpiSubjectAccounts/models/bpiSubjectAccount';
import { BpiSubject } from '../../identity/bpiSubjects/models/bpiSubject';
import { WorkflowStorageAgent } from '../../workgroup/workflows/agents/workflowsStorage.agent';
import { WorkstepStorageAgent } from '../../workgroup/worksteps/agents/workstepsStorage.agent';
import { Transaction } from '../models/transaction';
import { TransactionStatus } from '../models/transactionStatus.enum';
import { TransactionStorageAgent } from './transactionStorage.agent';
import { TransactionAgent } from './transactions.agent';
import { MerkleTreeService } from '../../merkleTree/services/merkleTree.service';

let transactionAgent: TransactionAgent;

const transactionStorageAgentMock: DeepMockProxy<TransactionStorageAgent> =
  mockDeep<TransactionStorageAgent>();
const workstepStorageAgentMock: DeepMockProxy<WorkstepStorageAgent> =
  mockDeep<WorkstepStorageAgent>();
const workflowStorageAgentMock: DeepMockProxy<WorkflowStorageAgent> =
  mockDeep<WorkflowStorageAgent>();
const authAgentMock: DeepMockProxy<AuthAgent> = mockDeep<AuthAgent>();
const merkleTreeServiceMock: DeepMockProxy<MerkleTreeService> =
  mockDeep<MerkleTreeService>();
const circuitsServiceMock: DeepMockProxy<ICircuitService> =
  mockDeep<ICircuitService>();

// TODO: Setup of this test data below is what should be handled in a separate file where we mock only prisma.client
// and implement various test data scenarios that can be selected with a single line of code.
// https://github.com/demonsters/prisma-mock
const existingWorkgroupId = uuid();

const existingBpiSubject1 = new BpiSubject(
  '',
  'name',
  'desc',
  '0x08872e27BC5d78F1FC4590803369492868A1FCCb',
  [],
);
const existingBpiSubject2 = new BpiSubject(
  '',
  'name2',
  'desc2',
  '0xF58e44db895C0fa1ca97d68E2F9123B187b789d4',
  [],
);

const fromBpiSubjectAccount = new BpiSubjectAccount(
  '1',
  existingBpiSubject1,
  existingBpiSubject1,
  '',
  '',
  '',
  '',
);
const toBpiSubjectAccount = new BpiSubjectAccount(
  '2',
  existingBpiSubject2,
  existingBpiSubject2,
  '',
  '',
  '',
  '',
);

const existingBpiAccount1 = TestDataHelper.createBpiAccount([
  fromBpiSubjectAccount,
]);
const existingWorkstep1 =
  TestDataHelper.createTestWorkstep(existingWorkgroupId);
const existingWorkflow1 = TestDataHelper.createTestWorkflow(
  existingWorkgroupId,
  [existingWorkstep1],
  existingBpiAccount1,
);

beforeAll(async () => {
  // TODO: https://github.com/prisma/prisma/issues/10203
  transactionAgent = new TransactionAgent(
    transactionStorageAgentMock,
    workstepStorageAgentMock,
    workflowStorageAgentMock,
    authAgentMock,
    merkleTreeServiceMock,
    circuitsServiceMock,
  );
});

describe('Transaction Agent', () => {
  it('Should return false when validateTransactionForExecution invoked with tx with non existent workflow id', async () => {
    // Arrange
    workflowStorageAgentMock.getWorkflowById.mockResolvedValueOnce(undefined);

    const tx = new Transaction(
      '1',
      1,
      '123',
      '123',
      fromBpiSubjectAccount,
      toBpiSubjectAccount,
      'transaction payload',
      'sig',
      TransactionStatus.Processing,
    );

    // Act
    const validationResult =
      await transactionAgent.validateTransactionForExecution(tx);

    // Assert
    expect(validationResult).toBeFalsy();
  });

  it('Should return false when validateTransactionForExecution invoked with tx with non existent workstep id', async () => {
    // Arrange
    workflowStorageAgentMock.getWorkflowById.mockResolvedValueOnce(
      existingWorkflow1,
    );

    workstepStorageAgentMock.getWorkstepById.mockResolvedValueOnce(undefined);

    const tx = new Transaction(
      '1',
      1,
      '123',
      '123',
      fromBpiSubjectAccount,
      toBpiSubjectAccount,
      'transaction payload',
      'sig',
      TransactionStatus.Processing,
    );

    // Act
    const validationResult =
      await transactionAgent.validateTransactionForExecution(tx);

    // Assert
    expect(validationResult).toBeFalsy();
  });

  it('Should return false when validateTransactionForExecution invoked with tx with non existent fromBpiSubjectAccount', async () => {
    // Arrange
    workflowStorageAgentMock.getWorkflowById.mockResolvedValueOnce(
      existingWorkflow1,
    );

    workstepStorageAgentMock.getWorkstepById.mockResolvedValueOnce(
      existingWorkstep1,
    );

    const tx = new Transaction(
      '1',
      1,
      '123',
      '123',
      undefined as unknown as BpiSubjectAccount,
      toBpiSubjectAccount,
      'transaction payload',
      'sig',
      TransactionStatus.Processing,
    );

    // Act
    const validationResult =
      await transactionAgent.validateTransactionForExecution(tx);

    // Assert
    expect(validationResult).toBeFalsy();
  });

  it('Should return false when validateTransactionForExecution invoked with tx with non existent toBpiSubjectAccount', async () => {
    // Arrange
    workflowStorageAgentMock.getWorkflowById.mockResolvedValueOnce(
      existingWorkflow1,
    );

    workstepStorageAgentMock.getWorkstepById.mockResolvedValueOnce(
      existingWorkstep1,
    );

    const tx = new Transaction(
      '1',
      1,
      '123',
      '123',
      fromBpiSubjectAccount,
      undefined as unknown as BpiSubjectAccount,
      'transaction payload',
      'sig',
      TransactionStatus.Processing,
    );

    // Act
    const validationResult =
      await transactionAgent.validateTransactionForExecution(tx);

    // Assert
    expect(validationResult).toBeFalsy();
  });

  it('Should return false when validateTransactionForExecution invoked with tx with wrong signature', async () => {
    // Arrange
    workflowStorageAgentMock.getWorkflowById.mockResolvedValueOnce(
      existingWorkflow1,
    );

    workstepStorageAgentMock.getWorkstepById.mockResolvedValueOnce(
      existingWorkstep1,
    );

    authAgentMock.verifySignatureAgainstPublicKey.mockReturnValue(false);

    const tx = new Transaction(
      '1',
      1,
      '123',
      '123',
      fromBpiSubjectAccount,
      toBpiSubjectAccount,
      'transaction payload',
      'wrong sig',
      TransactionStatus.Processing,
    );

    // Act
    const validationResult =
      await transactionAgent.validateTransactionForExecution(tx);

    // Assert
    expect(validationResult).toBeFalsy();
  });

  it('Should return false when validateTransactionForExecution invoked with tx with status not processing', async () => {
    // Arrange
    workflowStorageAgentMock.getWorkflowById.mockResolvedValueOnce(
      existingWorkflow1,
    );

    workstepStorageAgentMock.getWorkstepById.mockResolvedValueOnce(
      existingWorkstep1,
    );

    authAgentMock.verifySignatureAgainstPublicKey.mockReturnValue(true);

    const tx = new Transaction(
      '1',
      1,
      '123',
      '123',
      fromBpiSubjectAccount,
      toBpiSubjectAccount,
      'transaction payload',
      'correct sig',
      TransactionStatus.Executed,
    );

    // Act
    const validationResult =
      await transactionAgent.validateTransactionForExecution(tx);

    // Assert
    expect(validationResult).toBeFalsy();
  });

  it('Should return false when validateTransactionForExecution invoked with tx with nonce not  bpi account nonce +  1', async () => {
    // Arrange
    workflowStorageAgentMock.getWorkflowById.mockResolvedValueOnce(
      existingWorkflow1,
    );

    workstepStorageAgentMock.getWorkstepById.mockResolvedValueOnce(
      existingWorkstep1,
    );

    authAgentMock.verifySignatureAgainstPublicKey.mockReturnValue(true);

    const tx = new Transaction(
      '1',
      999,
      '123',
      '123',
      fromBpiSubjectAccount,
      toBpiSubjectAccount,
      'transaction payload',
      'correct sig',
      TransactionStatus.Executed,
    );

    // Act
    const validationResult =
      await transactionAgent.validateTransactionForExecution(tx);

    // Assert
    expect(validationResult).toBeFalsy();
  });

  it('Should return true when validateTransactionForExecution invoked with tx with all properties correctly set', async () => {
    // Arrange
    workflowStorageAgentMock.getWorkflowById.mockResolvedValueOnce(
      existingWorkflow1,
    );

    workstepStorageAgentMock.getWorkstepById.mockResolvedValueOnce(
      existingWorkstep1,
    );

    authAgentMock.verifySignatureAgainstPublicKey.mockReturnValue(true);

    const tx = new Transaction(
      '1',
      1,
      '123',
      '123',
      fromBpiSubjectAccount,
      toBpiSubjectAccount,
      'transaction payload',
      'correct sig',
      TransactionStatus.Processing,
    );

    // Act
    const validationResult =
      await transactionAgent.validateTransactionForExecution(tx);

    // Assert
    expect(validationResult).toBeTruthy();
  });
});
