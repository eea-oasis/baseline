import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ethers } from 'ethers';
import * as request from 'supertest';
import { v4 } from 'uuid';
import { AppModule } from '../src/app.module';

jest.setTimeout(120000);

let accessToken: string;
let app: INestApplication;
let server: any;

const supplierBPiSubjectPublicKey =
  '0x047a197a795a747c154dd92b217a048d315ef9ca1bfa9c15bfefe4e02fb338a70af23e7683b565a8dece5104a85ed24a50d791d8c5cb09ee21aabc927c98516539';
const supplierBPiSubjectPrivateKey =
  '0x93b7ed4405c73a1dbd8936e67419ee4e711ed44225aeabe9a5acf49a9ec90e68';
const buyerBPiSubjectPublicKey =
  '0x04203db7d27bab8d711acc52479efcfa9d7846e4e176d82389689f95cf06a51818b0b9ab1c2c8d72f1a32e236e6296c91c922a0dc3d0cb9afc269834fc5646b980';
const buyerBPiSubjectPrivateKey =
  '0x32c8d8f4e53cd1920d1ad22b9d51a7b28216337f2b664fb8d33bbcfc3c455c62';

let createdWorkgroupId: string;
let createdWorkstepId: string;
let createdWorkflowId: string;
let createdBpiSubjectAccountSupplierId: string;
let createdBpiSubjectAccountBuyerId: string;

describe('SRI use-case end-to-end test', () => {
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    server.close();
  });

  // TODO: Add detailed explanation of the SRI use-case setup and necessary seed data
  it('Logs in an internal Bpi Subject, creates two external Bpi Subjects (Supplier and Buyer) and a Workgroup and adds the created Bpi Subjects as participants to the Workgroup', async () => {
    accessToken = await loginAsInternalBpiSubjectAndReturnAnAccessToken();

    const createdBpiSubjectSupplierId =
      await createExternalBpiSubjectAndReturnId(
        'External Bpi Subject - Supplier',
        supplierBPiSubjectPublicKey,
      );

    createdBpiSubjectAccountSupplierId =
      await createBpiSubjectAccountAndReturnId(
        createdBpiSubjectSupplierId,
        createdBpiSubjectSupplierId,
      );

    const createdBpiSubjectBuyerId = await createExternalBpiSubjectAndReturnId(
      'External Bpi Subject 2 - Buyer',
      buyerBPiSubjectPublicKey,
    );

    createdBpiSubjectAccountBuyerId = await createBpiSubjectAccountAndReturnId(
      createdBpiSubjectBuyerId,
      createdBpiSubjectBuyerId,
    );

    createdWorkgroupId = await createAWorkgroupAndReturnId();

    await updateWorkgroupAdminsAndParticipants(
      createdWorkgroupId,
      [createdBpiSubjectSupplierId],
      [createdBpiSubjectSupplierId, createdBpiSubjectBuyerId],
    );

    const resultWorkgroup = await fetchWorkgroup(createdWorkgroupId);

    expect(resultWorkgroup.participants.length).toBe(2);
    expect(resultWorkgroup.participants[0].id).toEqual(
      createdBpiSubjectSupplierId,
    );
    expect(resultWorkgroup.participants[1].id).toEqual(
      createdBpiSubjectBuyerId,
    );
  });

  it('Sets up a workflow with a workstep in the previously created workgroup', async () => {
    // TODO: Auth as supplier?
    // TODO: Can we  listen and fire NATS messages here

    createdWorkstepId = await createWorkstepAndReturnId(
      'workstep1',
      createdWorkgroupId,
    );

    createdWorkflowId = await createWorkflowAndReturnId(
      'worksflow1',
      createdWorkgroupId,
      [createdWorkstepId],
      [createdBpiSubjectAccountSupplierId, createdBpiSubjectAccountBuyerId],
    );
  });

  it('Add a circuit input translation schema to a workstep', async () => {
    const schema =
      '{"mapping": [{"circuitInput": "input1", "description": "desc1", "payloadJsonPath": "path1", "dataType": "string"}]}';
    await addCircuitInputsSchema(createdWorkstepId, schema);
  });

  it('Submits a transaction for execution of the workstep 1', async () => {
    // TODO: CheckAuthz on createTransaction and in other places
    // TODO: Faking two items in the payload as the circuit is hardcoded to 4
    const createdTransactionId = await createTransactionAndReturnId(
      v4(),
      1,
      createdWorkflowId,
      createdWorkstepId,
      createdBpiSubjectAccountSupplierId,
      supplierBPiSubjectPrivateKey,
      createdBpiSubjectAccountBuyerId,
      `{
        "supplierInvoiceID": "INV123",
        "amount": 300,
        "issueDate": "2023-06-15",
        "dueDate": "2023-07-15",
        "status": "NEW",
        "items": [
          { "id": 1, "productId": "product1", "price": 100, "amount": 1 },
          { "id": 2, "productId": "product2", "price": 200, "amount": 1 },
          { "id": 3, "productId": "placeholder", "price": 0, "amount": 0 },
          { "id": 4, "productId": "placeholder", "price": 0, "amount": 0 }
        ]
      }`,
    );
  });

  it('Waits for a single VSM cycle and then verifies that the transaction has been executed and that the state has been properly stored', async () => {
    await new Promise((r) => setTimeout(r, 20000));
    const resultWorkflow = await fetchWorkflow(createdWorkflowId);
    const resultBpiAccount = await fetchBpiAccount(resultWorkflow.bpiAccountId);

    const stateTree = JSON.parse(resultBpiAccount.stateTree.tree);
    const historyTree = JSON.parse(resultBpiAccount.historyTree.tree);

    expect(stateTree.leaves.length).toBe(1);
    expect(historyTree.leaves.length).toBe(1);
  });
});

async function loginAsInternalBpiSubjectAndReturnAnAccessToken(): Promise<string> {
  // These two values must be inline with the value for the bpiAdmin from seed.ts
  // These values are used for testing purposes only
  const internalBpiSubjectPublicKey =
    '0x044e851fa6118d0d33f11ebf8d4cae2a25dca959f06c1ab87b8fec9ccbf0ca0021b7efc27c786f9480f9f11cfe8df1ae991329654308611148a35a2277ba5909fe';
  const internalBpiSubjectPrivateKey =
    '0x0fbdb56ab0fecb2f406fa807d9e6558baedacc1c15c0e2703b77d4c08441e4fe';

  const nonceResponse = await request(server)
    .post('/auth/nonce')
    .send({ publicKey: internalBpiSubjectPublicKey })
    .expect(201);

  const signer = new ethers.Wallet(internalBpiSubjectPrivateKey, undefined);
  const signature = await signer.signMessage(nonceResponse.text);

  const loginResponse = await request(server)
    .post('/auth/login')
    .send({
      message: nonceResponse.text,
      signature: signature,
      publicKey: internalBpiSubjectPublicKey,
    })
    .expect(201);

  return JSON.parse(loginResponse.text)['access_token'];
}

async function createExternalBpiSubjectAndReturnId(
  bpiSubjectName: string,
  pk: string,
): Promise<string> {
  const createdBpiSubjectResponse = await request(server)
    .post('/subjects')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      name: bpiSubjectName,
      desc: 'A test Bpi Subject',
      publicKey: pk,
    })
    .expect(201);

  return createdBpiSubjectResponse.text;
}

async function createBpiSubjectAccountAndReturnId(
  creatorBpiSubjectId: string,
  ownerBpiSubjectId: string,
): Promise<string> {
  const createdBpiSubjectAccountResponse = await request(server)
    .post('/subjectAccounts')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      creatorBpiSubjectId: creatorBpiSubjectId,
      ownerBpiSubjectId: ownerBpiSubjectId,
    })
    .expect(201);

  return createdBpiSubjectAccountResponse.text;
}

async function createAWorkgroupAndReturnId(): Promise<string> {
  const createdWorkgroupResponse = await request(server)
    .post('/workgroups')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      name: 'Test workgroup',
      securityPolicy: 'Dummy security policy',
      privacyPolicy: 'Dummy privacy policy',
    })
    .expect(201);

  return createdWorkgroupResponse.text;
}

async function updateWorkgroupAdminsAndParticipants(
  workgroupId: string,
  administratorIds: string[],
  participantIds: string[],
): Promise<void> {
  await request(server)
    .put(`/workgroups/${workgroupId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      name: 'Test workgroup',
      administratorIds: administratorIds,
      securityPolicy: 'Dummy security policy',
      privacyPolicy: 'Dummy privacy policy',
      participantIds: participantIds,
    })
    .expect(200);
}

async function fetchWorkgroup(workgroupId: string): Promise<any> {
  const getWorkgroupResponse = await request(server)
    .get(`/workgroups/${workgroupId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(200);

  return JSON.parse(getWorkgroupResponse.text);
}

async function createWorkstepAndReturnId(
  name: string,
  workgroupId: string,
): Promise<string> {
  const createdWorkstepResponse = await request(server)
    .post('/worksteps')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      name: name,
      version: '1',
      status: 'NEW',
      workgroupId: workgroupId,
      securityPolicy: 'Dummy security policy',
      privacyPolicy: 'Dummy privacy policy',
    })
    .expect(201);

  return createdWorkstepResponse.text;
}

async function addCircuitInputsSchema(
  workstepId: string,
  schema: string,
): Promise<string> {
  const addCircuitInputsSchemaResponse = await request(server)
    .put(`/worksteps/${workstepId}/circuitinputsschema`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      schema: schema,
    })
    .expect(200);

  return addCircuitInputsSchemaResponse.text;
}

async function createWorkflowAndReturnId(
  name: string,
  workgroupId: string,
  workstepIds: string[],
  ownerIds: string[],
): Promise<string> {
  const createdWorkflowResponse = await request(server)
    .post('/workflows')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      name: name,
      workgroupId: workgroupId,
      workstepIds: workstepIds,
      workflowBpiAccountSubjectAccountOwnersIds: ownerIds,
    })
    .expect(201);

  return createdWorkflowResponse.text;
}

async function createTransactionAndReturnId(
  id: string,
  nonce: number,
  workflowInstanceId: string,
  workstepInstanceId: string,
  fromSubjectAccountId: string,
  fromPrivatekey: string,
  toSubjectAccountId: string,
  payload: string,
): Promise<string> {
  const signer = new ethers.Wallet(fromPrivatekey, undefined);
  const signature = await signer.signMessage(payload);

  const createdTransactionResponse = await request(server)
    .post('/transactions')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      id: id,
      nonce: nonce,
      workflowInstanceId: workflowInstanceId,
      workstepInstanceId: workstepInstanceId,
      fromSubjectAccountId: fromSubjectAccountId,
      toSubjectAccountId: toSubjectAccountId,
      payload: payload,
      signature: signature,
    })
    .expect(201);

  return createdTransactionResponse.text;
}

async function fetchWorkflow(workflowId: string): Promise<any> {
  const getWorkflowResponse = await request(server)
    .get(`/workflows/${workflowId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(200);

  return JSON.parse(getWorkflowResponse.text);
}

async function fetchBpiAccount(bpiAccountId: string): Promise<any> {
  const getBpiAccountResponse = await request(server)
    .get(`/accounts/${bpiAccountId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(200);

  return JSON.parse(getBpiAccountResponse.text);
}
