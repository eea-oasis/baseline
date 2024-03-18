import { AuthAgent } from '../../auth/agent/auth.agent';
import { BpiSubjectAccount as BpiSubjectAccountPrismaModel } from '../../identity/bpiSubjectAccounts/models/bpiSubjectAccount';
import { WorkflowStorageAgent } from '../../workgroup/workflows/agents/workflowsStorage.agent';
import { WorkstepStorageAgent } from '../../workgroup/worksteps/agents/workstepsStorage.agent';
import { Transaction } from '../models/transaction';
import { TransactionStatus } from '../models/transactionStatus.enum';
import { TransactionStorageAgent } from './transactionStorage.agent';
import { TransactionAgent } from './transactions.agent';
import { MerkleTreeService } from '../../merkleTree/services/merkleTree.service';
import {
  BpiSubject,
  BpiSubjectAccount,
  Workflow,
  Workgroup,
  Workstep,
  BpiAccount,
  PrismaClient,
  PublicKeyType,
} from '../../../../__mocks__/@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { SnarkjsCircuitService } from '../../zeroKnowledgeProof/services/circuit/snarkjs/snarkjs.service';
import { PrismaMapper } from '../../../shared/prisma/prisma.mapper';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { BpiSubjectStorageAgent } from '../../identity/bpiSubjects/agents/bpiSubjectsStorage.agent';
import { LoggingModule } from '../../../shared/logging/logging.module';
import { NotFoundException } from '@nestjs/common';
import { NOT_FOUND_ERR_MESSAGE as WORKSTEP_NOT_FOUND_ERR_MESSAGE } from '../../workgroup/worksteps/api/err.messages';
import { NOT_FOUND_ERR_MESSAGE as WORKFLOW_NOT_FOUND_ERR_MESSAGE } from '../../workgroup/workflows/api/err.messages';
import { AuthModule } from '../../../bri/auth/auth.module';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';

let agent: TransactionAgent;
let authAgent: AuthAgent;
let prisma = new PrismaClient();
let bpiSubject1: BpiSubject;
let bpiSubject2: BpiSubject;
let bpiSubjectAccount1: BpiSubjectAccount;
let bpiSubjectAccount2: BpiSubjectAccount;
let bpiAccount1: BpiAccount;
let workgroup: Workgroup;
let workstep: Workstep;
let workflow: Workflow;

beforeEach(async () => {
  prisma = new PrismaClient();
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      LoggingModule,
      AuthModule,
      AutomapperModule.forRoot({
        strategyInitializer: classes(),
      }),
    ],
    providers: [
      TransactionAgent,
      WorkstepStorageAgent,
      WorkflowStorageAgent,
      MerkleTreeService,
      TransactionStorageAgent,
      PrismaService,
      PrismaMapper,
      BpiSubjectStorageAgent,
      {
        provide: 'ICircuitService',
        useClass: SnarkjsCircuitService,
      },
    ],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .compile();

  agent = module.get<TransactionAgent>(TransactionAgent);
  authAgent = module.get<AuthAgent>(AuthAgent);
  bpiSubject1 = await prisma.bpiSubject.create({
    data: {
      name: 'name',
      description: 'desc',
    },
  });

  await prisma.publicKey.createMany({
    data: [
      {
        type: PublicKeyType.ECDSA,
        value:
          '0x047a197a795a747c154dd92b217a048d315ef9ca1bfa9c15bfefe4e02fb338a70af23e7683b565a8dece5104a85ed24a50d791d8c5cb09ee21aabc927c98516539',
        bpiSubjectId: bpiSubject1.id,
      },
      {
        type: PublicKeyType.EDDSA,
        value:
          '0x047a197a795a747c154dd92b217a048d315ef9ca1bfa9c15bfefe4e02fb338a70af23e7683b565a8dece5104a85ed24a50d791d8c5cb09ee21aabc927c98516539',
        bpiSubjectId: bpiSubject1.id,
      },
    ],
  });

  bpiSubject2 = await prisma.bpiSubject.create({
    data: {
      name: 'name2',
      description: 'desc2',
    },
  });

  await prisma.publicKey.createMany({
    data: [
      {
        type: PublicKeyType.ECDSA,
        value:
          '0x04203db7d27bab8d711acc52479efcfa9d7846e4e176d82389689f95cf06a51818b0b9ab1c2c8d72f1a32e236e6296c91c922a0dc3d0cb9afc269834fc5646b980',
        bpiSubjectId: bpiSubject2.id,
      },
      {
        type: PublicKeyType.EDDSA,
        value:
          '0x04203db7d27bab8d711acc52479efcfa9d7846e4e176d82389689f95cf06a51818b0b9ab1c2c8d72f1a32e236e6296c91c922a0dc3d0cb9afc269834fc5646b980',
        bpiSubjectId: bpiSubject2.id,
      },
    ],
  });

  bpiSubjectAccount1 = await prisma.bpiSubjectAccount.create({
    data: {
      creatorBpiSubjectId: bpiSubject1.id,
      ownerBpiSubjectId: bpiSubject1.id,
      authenticationPolicy: '',
      authorizationPolicy: '',
      verifiableCredential: '',
      recoveryKey: '',
    },
    include: {
      ownerBpiSubject: true,
    },
  });
  bpiSubjectAccount2 = await prisma.bpiSubjectAccount.create({
    data: {
      creatorBpiSubjectId: bpiSubject2.id,
      ownerBpiSubjectId: bpiSubject2.id,
      authenticationPolicy: '',
      authorizationPolicy: '',
      verifiableCredential: '',
      recoveryKey: '',
    },
    include: {
      ownerBpiSubject: true,
    },
  });
  bpiAccount1 = await prisma.bpiAccount.create({
    data: {
      nonce: 0,
      ownerBpiSubjectAccounts: {
        connect: [
          {
            id: bpiSubjectAccount1.id,
          },
        ],
      },
    },
  });

  workgroup = await prisma.workgroup.create({
    data: {
      name: '',
      securityPolicy: '',
      privacyPolicy: '',
    },
  });

  workstep = await prisma.workstep.create({
    data: {
      name: '',
      version: '',
      status: '',
      securityPolicy: '',
      privacyPolicy: '',
      workgroupId: workgroup.id,
    },
  });

  workflow = await prisma.workflow.create({
    data: {
      name: '',
      workgroupId: workgroup.id,
      bpiAccountId: bpiAccount1.id,
    },
    include: {
      bpiAccount: true,
    },
  });
});

describe('Transaction Agent', () => {
  it('Should throw not found workflow when validateTransactionForExecution invoked with tx with non existent workflow id', async () => {
    // Arrange
    const tx = new Transaction(
      '1',
      1,
      '123',
      '123',
      bpiSubjectAccount1 as BpiSubjectAccountPrismaModel,
      bpiSubjectAccount2 as BpiSubjectAccountPrismaModel,
      'transaction payload',
      'sig',
      TransactionStatus.Processing,
    );

    // Act and assert
    expect(async () => {
      await agent.validateTransactionForExecution(tx);
    }).rejects.toThrow(new NotFoundException(WORKFLOW_NOT_FOUND_ERR_MESSAGE));
  });

  it('Should throw not found workstep when validateTransactionForExecution invoked with tx with non existent workstep id', async () => {
    // Arrange
    const tx = new Transaction(
      '1',
      1,
      workflow.id,
      '123',
      bpiSubjectAccount1 as BpiSubjectAccountPrismaModel,
      bpiSubjectAccount2 as BpiSubjectAccountPrismaModel,
      'transaction payload',
      'sig',
      TransactionStatus.Processing,
    );

    // Act and assert
    expect(async () => {
      await agent.validateTransactionForExecution(tx);
    }).rejects.toThrow(new NotFoundException(WORKSTEP_NOT_FOUND_ERR_MESSAGE));
  });

  it('Should return false when validateTransactionForExecution invoked with tx with undefined fromBpiSubjectAccount', async () => {
    // Arrange
    const tx = new Transaction(
      '1',
      1,
      workflow.id,
      workstep.id,
      undefined as unknown as BpiSubjectAccountPrismaModel,
      bpiSubjectAccount2 as BpiSubjectAccountPrismaModel,
      'transaction payload',
      'sig',
      TransactionStatus.Processing,
    );

    // Act
    const validationResult = await agent.validateTransactionForExecution(tx);

    // Assert
    expect(validationResult).toBeFalsy();
  });

  it('Should return false when validateTransactionForExecution invoked with tx with undefined toBpiSubjectAccount', async () => {
    // Arrange
    const tx = new Transaction(
      '1',
      1,
      workflow.id,
      workstep.id,
      bpiSubjectAccount1 as BpiSubjectAccountPrismaModel,
      undefined as unknown as BpiSubjectAccountPrismaModel,
      'transaction payload',
      'sig',
      TransactionStatus.Processing,
    );

    // Act
    const validationResult = await agent.validateTransactionForExecution(tx);

    // Assert
    expect(validationResult).toBeFalsy();
  });

  it('Should return false when validateTransactionForExecution invoked with tx with wrong signature', async () => {
    // Arrange
    jest
      .spyOn(authAgent, 'verifyEddsaSignatureAgainstPublicKey')
      .mockImplementationOnce(async () => false);
    const tx = new Transaction(
      '1',
      1,
      workflow.id,
      workstep.id,
      bpiSubjectAccount1 as BpiSubjectAccountPrismaModel,
      bpiSubjectAccount2 as BpiSubjectAccountPrismaModel,
      'transaction payload',
      'wrong sig',
      TransactionStatus.Processing,
    );

    // Act
    const validationResult = await agent.validateTransactionForExecution(tx);

    // Assert
    expect(validationResult).toBeFalsy();
  });

  it('Should return false when validateTransactionForExecution invoked with tx with status not processing', async () => {
    // Arrange
    jest
      .spyOn(authAgent, 'verifyEddsaSignatureAgainstPublicKey')
      .mockImplementationOnce(async () => true);
    const tx = new Transaction(
      '1',
      1,
      workflow.id,
      workstep.id,
      bpiSubjectAccount1 as BpiSubjectAccountPrismaModel,
      bpiSubjectAccount2 as BpiSubjectAccountPrismaModel,
      'transaction payload',
      'correct sig',
      TransactionStatus.Executed,
    );

    // Act
    const validationResult = await agent.validateTransactionForExecution(tx);

    // Assert
    expect(validationResult).toBeFalsy();
  });

  it('Should return false when validateTransactionForExecution invoked with tx with nonce not bpi account nonce + 1', async () => {
    // Arrange
    jest
      .spyOn(authAgent, 'verifyEddsaSignatureAgainstPublicKey')
      .mockImplementationOnce(async () => true);
    const tx = new Transaction(
      '1',
      2,
      workflow.id,
      workstep.id,
      bpiSubjectAccount1 as BpiSubjectAccountPrismaModel,
      bpiSubjectAccount2 as BpiSubjectAccountPrismaModel,
      'transaction payload',
      'wrong sig',
      TransactionStatus.Processing,
    );

    // Act
    const validationResult = await agent.validateTransactionForExecution(tx);

    // Assert
    expect(validationResult).toBeFalsy();
  });

  it('Should return true when validateTransactionForExecution invoked with tx with all properties correctly set', async () => {
    // Arrange
    jest
      .spyOn(authAgent, 'verifyEddsaSignatureAgainstPublicKey')
      .mockImplementationOnce(async () => true);
    const tx = new Transaction(
      '1',
      1,
      workflow.id,
      workstep.id,
      bpiSubjectAccount1 as BpiSubjectAccountPrismaModel,
      bpiSubjectAccount2 as BpiSubjectAccountPrismaModel,
      'transaction payload',
      'wrong sig',
      TransactionStatus.Processing,
    );

    // Act
    const validationResult = await agent.validateTransactionForExecution(tx);

    // Assert
    expect(validationResult).toBeTruthy();
  });
});
