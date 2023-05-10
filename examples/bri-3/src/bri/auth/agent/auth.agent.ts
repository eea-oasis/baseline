import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createJWT, ES256KSigner, hexToBytes } from 'did-jwt';
import { ethers } from 'ethers';
import { BpiSubjectStorageAgent } from '../../../bri/identity/bpiSubjects/agents/bpiSubjectsStorage.agent';
import { BpiSubject } from '../../../bri/identity/bpiSubjects/models/bpiSubject';
import { LoggingService } from '../../../shared/logging/logging.service';
import { INVALID_SIGNATURE, USER_NOT_AUTHORIZED } from '../api/err.messages';
import { jwtConstants } from '../constants';

@Injectable()
export class AuthAgent {
  constructor(
    private readonly bpiSubjectStorageAgent: BpiSubjectStorageAgent,
    private readonly jwtService: JwtService,
    private readonly logger: LoggingService,
  ) {}

  // TODO: Move into a separate service once signature verification
  // capabilities grow
  throwIfSignatureVerificationFails(
    message: string,
    signature: string,
    publicKey: string,
  ): void {
    if (!this.verifySignatureAgainstPublicKey(message, signature, publicKey)) {
      throw new UnauthorizedException(INVALID_SIGNATURE);
    }
  }

  verifySignatureAgainstPublicKey(
    message: string,
    signature: string,
    senderPublicKey: string,
  ): boolean {
    let publicKeyFromSignature = '';

    try {
      publicKeyFromSignature = ethers.utils.verifyMessage(message, signature);
    } catch (error) {
      this.logger.logError(
        `Error validating signature: ${signature} for message ${message}. Error: ${error}}`,
      );
      return false;
    }

    const isValid = publicKeyFromSignature.toLowerCase() === senderPublicKey.toLowerCase();

    if (!isValid) {
      this.logger.logWarn(
        `Signature: ${signature} for public key ${senderPublicKey} is invalid.`,
      );
    }

    return isValid;
  }

  async getBpiSubjectByPublicKey(publicKey: string) {
    return this.bpiSubjectStorageAgent.getBpiSubjectByPublicKey(publicKey);
  }

  throwIfLoginNonceMismatch(bpiSubject: BpiSubject, nonce: string) {
    if (bpiSubject.loginNonce !== nonce) {
      throw new Error(USER_NOT_AUTHORIZED);
    }
  }

  async updateLoginNonce(bpiSubject: BpiSubject) {
    bpiSubject.updateLoginNonce();
    return this.bpiSubjectStorageAgent.updateBpiSubject(bpiSubject);
  }

  async generateJwt(payload: any) {
    const access_token = this.jwtService.sign(payload);
    return { access_token };
  }

  async generateDidJwt(bpiSubject: BpiSubject) {
    const serviceUrl = process.env.SERVICE_URL;
    const now = Math.floor(Date.now() / 1000);

    const didJwtPayload = {
      aud: serviceUrl,
      sub: bpiSubject.getBpiSubjectDid(),
      exp: now + Math.floor(jwtConstants.expiresIn / 1000),
      nbf: now,
      iat: now,
    };

    const serviceDid = process.env.GOERLI_SERVICE_DID;
    const privateKey = process.env.GEORLI_SERVICE_SIGNER_PRIVATE_KEY;

    const serviceSigner = ES256KSigner(hexToBytes(privateKey));

    const access_token = await createJWT(
      didJwtPayload,
      { issuer: serviceDid, signer: serviceSigner },
      { typ: 'JWT', alg: 'ES256K' },
    );

    return { access_token };
  }
}
