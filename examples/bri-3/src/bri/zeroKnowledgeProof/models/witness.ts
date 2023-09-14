import { Proof } from './proof';

export class Witness {
  proof: Proof;

  publicInputs?: string[];

  verificationKey?: object;

  circuitBinary?: Uint8Array;
}
