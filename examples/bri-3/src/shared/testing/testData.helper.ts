import { uuid } from 'uuidv4';
import { BpiAccount } from '../../bri/state/bpiAccounts/models/bpiAccount';
import { BpiSubjectAccount } from '../../bri/identity/bpiSubjectAccounts/models/bpiSubjectAccount';
import { BpiSubject } from '../../bri/identity/bpiSubjects/models/bpiSubject';
import {
  BpiSubjectRole,
  BpiSubjectRoleName,
} from '../../bri/identity/bpiSubjects/models/bpiSubjectRole';
import {
  PublicKey,
  PublicKeyType,
} from '../../bri/identity/bpiSubjects/models/publicKey';
import { Workflow } from '../../bri/workgroup/workflows/models/workflow';
import { Workstep } from '../../bri/workgroup/worksteps/models/workstep';
import {
  BpiAccountBuilder,
  BpiSubjectAccountBuilder,
  BpiSubjectBuilder,
  WorkflowBuilder,
  WorkgroupBuilder,
  WorkstepBuilder,
} from './builders';

// A place to encapsulate  creation of test data objects used for controller testing.
// These objects will later be used to mock prisma.client calls only once during test bootstrap
// (https://www.prisma.io/docs/guides/testing/unit-testing)
// which will help avoid the need to mock all agents separately
export class TestDataHelper {
  public static createTestWorkstep = (workgroupId: string) => {
    const workstep = new WorkstepBuilder()
      .setId('123')
      .setName('Example Workstep')
      .setVersion('1.0')
      .setStatus('Active')
      .setWorkgroupId(workgroupId)
      .build();

    return workstep;
  };

  public static createTestWorkflow = (
    workgroupId: string,
    worksteps: Workstep[],
    bpiAccount: BpiAccount,
  ) => {
    const workflow = new WorkflowBuilder()
      .setId(uuid())
      .setName('Example Workflow')
      .setWorksteps(worksteps)
      .setWorkgroupId(workgroupId)
      .setBpiAccount(bpiAccount)
      .build();

    return workflow;
  };

  public static createBpiSubject = () => {
    const bpiSubjectId = uuid();
    const bpiSubject = new BpiSubjectBuilder()
      .setId(bpiSubjectId)
      .setName('name')
      .setDescription('desc')
      .setPublicKey([
        new PublicKey(uuid(), PublicKeyType.ECDSA, 'ecdsaPk', bpiSubjectId),
        new PublicKey(uuid(), PublicKeyType.EDDSA, 'eddsaPk', bpiSubjectId),
      ])
      .setRoles([
        new BpiSubjectRole(
          uuid(),
          BpiSubjectRoleName.EXTERNAL_BPI_SUBJECT,
          'desc',
        ),
      ])
      .build();

    return bpiSubject;
  };

  public static createWorkgroup = (
    id: string,
    admins: BpiSubject[],
    participants: BpiSubject[],
    worksteps: Workstep[],
    workflows: Workflow[],
  ) => {
    const workgroup = new WorkgroupBuilder()
      .setId(id)
      .setAdministrators(admins)
      .setSecurityPolicy('security policy')
      .setPrivacyPolicy('privacy policy')
      .setParticipants(participants)
      .setWorksteps(worksteps)
      .setWorkflows(workflows)
      .build();

    return workgroup;
  };

  public static createBpiSubjectAccount = (
    owner: BpiSubject,
    creator: BpiSubject,
  ) => {
    const bpiSubjectAccount = new BpiSubjectAccountBuilder()
      .setId(uuid())
      .setOwnerBpiSubject(owner)
      .setCreatorBpiSubject(creator)
      .setAuthenticationPolicy('authentication policy')
      .setAuthorizationPolicy('authorization policy')
      .setVerifiableCredential('verifiable credential')
      .setRecoveryKey('recovery key')
      .build();

    return bpiSubjectAccount;
  };

  public static createBpiAccount = (
    ownerBpiSubjectAccounts: BpiSubjectAccount[],
  ) => {
    const bpiAccount = new BpiAccountBuilder()
      .setId(uuid())
      .setNonce(0)
      .setOwnerBpiSubjectAccounts(ownerBpiSubjectAccounts)
      .setAuthorizationCondition('authorization condition')
      .setStateObjectProverSystem('prover system')
      .build();

    return bpiAccount;
  };
}
