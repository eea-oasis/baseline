import { AutoMap } from '@automapper/classes';

export class Workstep {
  @AutoMap()
  id: string; // TODO: Add uuid after #491

  @AutoMap()
  name: string;

  @AutoMap()
  version: string;

  @AutoMap()
  status: string;

  @AutoMap()
  workgroupId: string;

  @AutoMap()
  securityPolicy: string; // TODO Implement security policy inhereted from workgroup #487

  @AutoMap()
  privacyPolicy: string; // TODO Implement simple privacy policy inhereted from workgroup #487

  @AutoMap()
  circuitInputsTranslationSchema: string;

  constructor(
    id: string,
    name: string,
    version: string,
    status: string,
    workgroupId: string,
    securityPolicy: string,
    privacyPolicy: string,
  ) {
    this.id = id;
    this.name = name;
    this.version = version;
    this.status = status;
    this.workgroupId = workgroupId;
    this.securityPolicy = securityPolicy;
    this.privacyPolicy = privacyPolicy;
  }

  public updateName(newName: string): void {
    this.name = newName;
  }

  public updateVersion(newVersion: string): void {
    this.version = newVersion;
  }

  public updateStatus(newStatus: string): void {
    this.status = newStatus;
  }

  public updateWorkgroupId(newWorkgroupId: string): void {
    this.workgroupId = newWorkgroupId;
  }

  public updateSecurityPolicy(newSecurityPolicy: string): void {
    this.securityPolicy = newSecurityPolicy;
  }

  public updatePrivacyPolicy(newPrivacyPolicy: string): void {
    this.privacyPolicy = newPrivacyPolicy;
  }

  public updateCircuitInputTranslationSchema(schema): void {
    this.circuitInputsTranslationSchema = schema;
  }
}
