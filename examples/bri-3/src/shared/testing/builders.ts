/* eslint-disable @typescript-eslint/no-empty-function */

import { BpiAccount } from '../../bri/state/bpiAccounts/models/bpiAccount';
import { BpiSubjectAccount } from '../../bri/identity/bpiSubjectAccounts/models/bpiSubjectAccount';
import { BpiSubject } from '../../bri/identity/bpiSubjects/models/bpiSubject';
import { BpiSubjectRole } from '../../bri/identity/bpiSubjects/models/bpiSubjectRole';
import { PublicKey } from '../../bri/identity/bpiSubjects/models/publicKey';
import { BpiMerkleTree } from '../../bri/merkleTree/models/bpiMerkleTree';
import { Workflow } from '../../bri/workgroup/workflows/models/workflow';
import { Workgroup } from '../../bri/workgroup/workgroups/models/workgroup';
import { Workstep } from '../../bri/workgroup/worksteps/models/workstep';

export class WorkstepBuilder {
  private id: string;
  private name: string;
  private version: string;
  private status: string;
  private workgroupId: string;
  private securityPolicy: string;
  private privacyPolicy: string;

  constructor() {}

  setId(id: string): WorkstepBuilder {
    this.id = id;
    return this;
  }

  setName(name: string): WorkstepBuilder {
    this.name = name;
    return this;
  }

  setVersion(version: string): WorkstepBuilder {
    this.version = version;
    return this;
  }

  setStatus(status: string): WorkstepBuilder {
    this.status = status;
    return this;
  }

  setWorkgroupId(workgroupId: string): WorkstepBuilder {
    this.workgroupId = workgroupId;
    return this;
  }

  setSecurityPolicy(securityPolicy: string): WorkstepBuilder {
    this.securityPolicy = securityPolicy;
    return this;
  }

  setPrivacyPolicy(privacyPolicy: string): WorkstepBuilder {
    this.privacyPolicy = privacyPolicy;
    return this;
  }

  build(): Workstep {
    return new Workstep(
      this.id,
      this.name,
      this.version,
      this.status,
      this.workgroupId,
      this.securityPolicy,
      this.privacyPolicy,
    );
  }
}

export class WorkflowBuilder {
  private id: string;
  private name: string;
  private worksteps: Workstep[];
  private workgroupId: string;
  private bpiAccount: BpiAccount;

  constructor() {}

  setId(id: string): WorkflowBuilder {
    this.id = id;
    return this;
  }

  setName(name: string): WorkflowBuilder {
    this.name = name;
    return this;
  }

  setWorksteps(worksteps: Workstep[]): WorkflowBuilder {
    this.worksteps = worksteps;
    return this;
  }

  setWorkgroupId(workgroupId: string): WorkflowBuilder {
    this.workgroupId = workgroupId;
    return this;
  }

  setBpiAccount(bpiAccount: BpiAccount): WorkflowBuilder {
    this.bpiAccount = bpiAccount;
    return this;
  }

  build(): Workflow {
    const workflow = new Workflow(
      this.id,
      this.name,
      this.worksteps,
      this.workgroupId,
      this.bpiAccount.id,
    );

    workflow.bpiAccount = this.bpiAccount;

    return workflow;
  }
}

export class BpiSubjectBuilder {
  private id: string;
  private name: string;
  private description: string;
  private publicKeys: PublicKey[];
  private loginNonce: string;
  private roles: BpiSubjectRole[];

  constructor() {}

  setId(id: string): BpiSubjectBuilder {
    this.id = id;
    return this;
  }

  setName(name: string): BpiSubjectBuilder {
    this.name = name;
    return this;
  }

  setDescription(description: string): BpiSubjectBuilder {
    this.description = description;
    return this;
  }

  setPublicKey(publicKeys: PublicKey[]): BpiSubjectBuilder {
    this.publicKeys = publicKeys;
    return this;
  }

  setLoginNonce(loginNonce: string): BpiSubjectBuilder {
    this.loginNonce = loginNonce;
    return this;
  }

  setRoles(roles: BpiSubjectRole[]): BpiSubjectBuilder {
    this.roles = roles;
    return this;
  }

  build(): BpiSubject {
    return new BpiSubject(
      this.id,
      this.name,
      this.description,
      this.publicKeys,
      this.roles,
    );
  }
}

export class WorkgroupBuilder {
  private id: string;
  private name: string;
  private administrators: BpiSubject[] = [];
  private securityPolicy: string;
  private privacyPolicy: string;
  private participants: BpiSubject[] = [];
  private worksteps: Workstep[] = [];
  private workflows: Workflow[] = [];

  constructor() {}

  setId(id: string): WorkgroupBuilder {
    this.id = id;
    return this;
  }

  setName(name: string): WorkgroupBuilder {
    this.name = name;
    return this;
  }

  setAdministrators(administrators: BpiSubject[]): WorkgroupBuilder {
    this.administrators = administrators;
    return this;
  }

  setSecurityPolicy(securityPolicy: string): WorkgroupBuilder {
    this.securityPolicy = securityPolicy;
    return this;
  }

  setPrivacyPolicy(privacyPolicy: string): WorkgroupBuilder {
    this.privacyPolicy = privacyPolicy;
    return this;
  }

  setParticipants(participants: BpiSubject[]): WorkgroupBuilder {
    this.participants = participants;
    return this;
  }

  setWorksteps(worksteps: Workstep[]): WorkgroupBuilder {
    this.worksteps = worksteps;
    return this;
  }

  setWorkflows(workflows: Workflow[]): WorkgroupBuilder {
    this.workflows = workflows;
    return this;
  }

  public build(): Workgroup {
    const workgroup = new Workgroup(
      this.id,
      this.name,
      this.administrators,
      this.securityPolicy,
      this.privacyPolicy,
      this.participants,
      this.worksteps,
      this.workflows,
    );
    return workgroup;
  }
}

export class BpiSubjectAccountBuilder {
  private id: string;
  private authenticationPolicy?: string;
  private authorizationPolicy?: string;
  private verifiableCredential?: string;
  private recoveryKey?: string;
  private creatorBpiSubject: BpiSubject;
  private ownerBpiSubject: BpiSubject;

  constructor() {}

  setId(id: string): BpiSubjectAccountBuilder {
    this.id = id;
    return this;
  }

  setCreatorBpiSubject(
    creatorBpiSubject: BpiSubject,
  ): BpiSubjectAccountBuilder {
    this.creatorBpiSubject = creatorBpiSubject;
    return this;
  }

  setOwnerBpiSubject(ownerBpiSubject: BpiSubject): BpiSubjectAccountBuilder {
    this.ownerBpiSubject = ownerBpiSubject;
    return this;
  }

  setAuthenticationPolicy(
    authenticationPolicy: string,
  ): BpiSubjectAccountBuilder {
    this.authenticationPolicy = authenticationPolicy;
    return this;
  }

  setAuthorizationPolicy(
    authorizationPolicy: string,
  ): BpiSubjectAccountBuilder {
    this.authorizationPolicy = authorizationPolicy;
    return this;
  }

  setVerifiableCredential(
    verifiableCredential: string,
  ): BpiSubjectAccountBuilder {
    this.verifiableCredential = verifiableCredential;
    return this;
  }

  setRecoveryKey(recoveryKey: string): BpiSubjectAccountBuilder {
    this.recoveryKey = recoveryKey;
    return this;
  }

  public build(): BpiSubjectAccount {
    const bpiSubjectAccount = new BpiSubjectAccount(
      this.id,
      this.creatorBpiSubject,
      this.ownerBpiSubject,
      this.authenticationPolicy ?? '',
      this.authorizationPolicy ?? '',
      this.verifiableCredential ?? '',
      this.recoveryKey ?? '',
    );
    return bpiSubjectAccount;
  }
}

export class BpiAccountBuilder {
  private id: string;
  private nonce = 0;
  private ownerBpiSubjectAccounts: BpiSubjectAccount[] = [];
  private authorizationCondition: string;
  private stateObjectProverSystem: string;
  private stateTree: BpiMerkleTree;
  private historyTree: BpiMerkleTree;

  constructor() {}

  setId(id: string): BpiAccountBuilder {
    this.id = id;
    return this;
  }

  setNonce(nonce: number): BpiAccountBuilder {
    this.nonce = nonce;
    return this;
  }

  setOwnerBpiSubjectAccounts(
    ownerBpiSubjectAccounts: BpiSubjectAccount[],
  ): BpiAccountBuilder {
    this.ownerBpiSubjectAccounts = ownerBpiSubjectAccounts;
    return this;
  }

  setAuthorizationCondition(authorizationCondition: string): BpiAccountBuilder {
    this.authorizationCondition = authorizationCondition;
    return this;
  }

  setStateObjectProverSystem(
    stateObjectProverSystem: string,
  ): BpiAccountBuilder {
    this.stateObjectProverSystem = stateObjectProverSystem;
    return this;
  }

  setStateTree(stateTree: BpiMerkleTree): BpiAccountBuilder {
    this.stateTree = stateTree;
    return this;
  }

  setHistoryTree(historyTree: BpiMerkleTree): BpiAccountBuilder {
    this.historyTree = historyTree;
    return this;
  }

  public build(): BpiAccount {
    const bpiAccount = new BpiAccount(
      this.id,
      this.ownerBpiSubjectAccounts,
      this.authorizationCondition,
      this.stateObjectProverSystem,
      this.stateTree,
      this.historyTree,
    );
    bpiAccount.nonce = this.nonce;
    return bpiAccount;
  }
}
