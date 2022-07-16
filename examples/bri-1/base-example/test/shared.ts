import { assert, expect } from 'chai';
import { ParticipantStack } from '../src';
import { spawnSync } from 'child_process'
import { tryTimes } from '../src/index'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const shouldBehaveLikeAWorkgroupOrganization = (getApp: () => ParticipantStack) => () => {
  describe(`organization details`, () => {
    let org;

    before(async () => {
      org = await getApp().getOrganization();
      assert(org, 'org should not be null');
    });

    describe('contracts', () => {
      let erc1820Registry;
      let orgRegistry;
      let shield;
      let verifier;
      let workflowIdentifier;

      before(async () => {
        erc1820Registry = await getApp().requireWorkgroupContract('erc1820-registry');
        orgRegistry = await getApp().requireWorkgroupContract('organization-registry');
        shield = getApp().getWorkgroupContract('shield');
        verifier = getApp().getWorkgroupContract('verifier');
        workflowIdentifier = getApp().getWorkflowIdentifier();
      });

      it('should have a local reference to the on-chain ERC1820 registry contract', async () => {
        assert(erc1820Registry, 'ERC1820 registry contract should not be null');
        assert(erc1820Registry.address, 'should have a reference to the on-chain ERC1820 registry contract address');
      });

      it('should have a local reference to the on-chain organization registry contract', async () => {
        assert(orgRegistry, 'organization registry contract should not be null');
        assert(orgRegistry.address, 'should have a reference to the on-chain organization registry contract address');
      });

      it('should have a local reference to the on-chain workgroup shield contract', async () => {
        assert(shield, 'workgroup shield contract should not be null');
        assert(shield.address, 'should have a reference to the on-chain workgroup shield contract address');
      });

      it('should have a local reference to the on-chain workflow prover verifier contract', async () => {
        assert(verifier, 'workflow prover verifier contract should not be null');
        assert(verifier.address, 'should have a reference to the on-chain workflow prover verifier contract address');
      });

      it('should have a local reference to the workflow prover identifier', async () => {
        assert(workflowIdentifier, 'workflow prover identifier should not be null');
      });
    });

    describe('messaging', () => {
      let natsService;
      let natsSubscriptions;

      before(async () => {
        natsService = getApp().getMessagingService();
        natsSubscriptions = getApp().getProtocolSubscriptions();
      });

      it('should have an established NATS connection', async () => {
        assert(natsService, 'should not be null');
        assert(natsService.isConnected() === true, 'should have established a connection');
      });

      it('should have an established a subscription on the baseline.proxy subject', async () => {
        assert(natsSubscriptions, 'should not be null');
        assert(natsSubscriptions.length === 1, 'should have established a subscription');
      });
    });

    describe('registration', () => {
      let address;

      before(async () => {
        const keys = await getApp().fetchKeys();
        address = keys && keys.length >= 3 ? keys[2].address : null;
        assert(address, 'default secp256k1 keypair should not be null');
      });

      it('should register the organization in the local registry', async () => {
        assert(org.id, 'org id should not be null');
      });

      it('should register the organization in the on-chain registry using its default secp256k1 address', async () => {
        const org = await getApp().requireOrganization(address);
        assert(org, 'org should be present in on-chain registry');
      });

      it('should associate the organization with the local workgroup', async () => {
        const orgs = await getApp().fetchWorkgroupOrganizations();
        assert(orgs.length === 1, 'workgroup should have associated org');
      });
    });

    // TODO: Assert a subject account was created

    describe('vault', () => {
      let address;
      let keys;

      before(async () => {
        keys = await getApp().fetchKeys();
        address = keys && keys.length >= 3 ? keys[2].address : null;
      });

      // TODO: Create first vault manually, it is no longer automatic
      it('should create a default vault for the organization', async () => {
        const vaults = await getApp().fetchVaults();
        assert(vaults.length === 1, 'default vault not created');
      });

      it('should create a set of keypairs for the organization', async () => {
        assert(keys, 'default keypairs should not be null');
        assert(keys.length >= 4, 'minimum default keypairs not created');
        // assert(keys.length === 4, 'default keypairs not created');
      });

      it('should create a babyJubJub keypair for the organization', async () => {
        assert(keys[1].spec === 'babyJubJub', 'default babyJubJub keypair not created');
      });

      it('should create a secp256k1 keypair for the organization', async () => {
        assert(keys[2].spec === 'secp256k1', 'default secp256k1 keypair not created');
      });

      it('should resolve the created secp256k1 keypair as the organization address', async () => {
        const addr = await getApp().resolveOrganizationAddress();
        assert(keys[2].address === addr, 'default secp256k1 keypair should resolve as the organization address');
      });

      it('should create a BIP39 HD wallet for the organization', async () => {
        assert(keys[3].spec === 'BIP39', 'default BIP39 HD wallet not created');
      });
    });

    describe('workflow privacy', () => {
      let prover;

      describe('zkSNARK provers', () => {
        describe('synchronization', () => {
          before(async () => {
            // We need to Wait for the Sync
            await tryTimes(async () => {
                if (getApp().getBaselineProver() === undefined) {
                  throw new Error();
                }else{
                  return true;
                }
              }, 100, 5000);
            prover = getApp().getBaselineProver();
            assert(prover, 'setup artifacts should not be null');
          });

          it('should have a copy of the unique identifier for the prover', async () => {
            assert(prover.id, 'identifier should not be null');
          });

          it('should have a copy of the proving key id', async () => {
            assert(prover.provingKeyId, 'proving key id should not be null');
          });

          it('should have a copy of the verifying key id', async () => {
            assert(prover.verifyingKeyId, 'verifying key id should not be null');
          });

          it('should have a copy of the raw verifier source code', async () => {
            assert(prover.verifierContract, 'verifier contract should not be null');
            assert(prover.verifierContract.source, 'verifier source should not be null');
          });

          it('should store a reference to the workflow prover identifier', async () => {
            assert(getApp().getWorkflowIdentifier() === prover.id, 'workflow prover identifier should have a reference');
          });

          it('should have a copy of the compiled prover r1cs', async () => {
            assert(prover.artifacts, 'prover artifacts should not be null');
            assert(prover.artifacts.binary, 'prover r1cs artifact should not be null');
          });

          it('should have a copy of the keypair for proving and verification', async () => {
            assert(prover.artifacts, 'prover artifacts should not be null');
            assert(prover.artifacts.proving_key, 'proving key artifact should not be null');
            assert(prover.artifacts.verifying_key, 'verifying key artifact should not be null');
          });

          // it('should have a copy of the ABI of the compiled prover', async () => {
          //   assert(prover.abi, 'artifacts should contain the abi');
          // });

          describe('on-chain artifacts', () => {
            let shield;
            let verifier;

            before(async () => {
              shield = getApp().getWorkgroupContract('shield');
              verifier = getApp().getWorkgroupContract('verifier');
            });

            it('should reference the deposited workgroup shield contract on-chain', async () => {
              assert(shield, 'workgroup shield contract should not be null');
              assert(shield.address, 'workgroup shield contract should have been deployed');
            });

            it('should reference the deposited prover verifier on-chain', async () => {
              assert(verifier, 'workflow prover verifier contract should not be null');
              assert(verifier.address, 'workflow prover verifier contract should have been deployed');
            });
          });
        });
      });
    });
  });
};

export const shouldBehaveLikeAWorkgroupCounterpartyOrganization = (getApp: () => ParticipantStack) => () => {
  describe('counterparties', async () => {
    let counterparties;
    let authorizedBearerTokens;
    let authorizedBearerToken;
    let messagingEndpoint;

    before(async () => {
      counterparties = getApp().getWorkgroupCounterparties();
      authorizedBearerTokens = getApp().getNatsBearerTokens();
      authorizedBearerToken = await getApp().resolveNatsBearerToken(counterparties[0]);
      messagingEndpoint = await getApp().resolveMessagingEndpoint(counterparties[0]);
      await getApp().requireOrganization(await getApp().resolveOrganizationAddress());
    });

    it('should have a local reference to the workgroup counterparties', async () => {
      assert(counterparties, 'workgroup counterparties should not be null');
      assert(counterparties.length === 1, 'workgroup counterparties should not be empty');
      assert(counterparties[0] !== await getApp().resolveOrganizationAddress(), 'workgroup counterparties should not contain local org address');
    });

    it('should have a local reference to peer-authorized messaging endpoints and associated bearer tokens', async () => {
      assert(authorizedBearerTokens, 'authorized bearer tokens should not be null');
      assert(Object.keys(authorizedBearerTokens).length === 1, 'a local reference should exist for a single authorized bearer token');
    });

    it('should have a local reference to the peer-authorized messaging endpoint', async () => {
      assert(messagingEndpoint, 'peer-authorized messaging endpoint should not be null');
    });

    it('should have a local reference to the peer-authorized bearer token', async () => {
      assert(authorizedBearerToken, 'peer-authorized bearer token should not be null');
    });
  });
};

export const shouldCreateBaselineStack = (getApp: () => ParticipantStack) => () => {
  var org
  before(async () => {
    org = await getApp().getOrganization();
    await sleep(10000)
  });

  it('should have the baseline stack running ', async () => {
    // TODO: Call status on each endpoint
  })
}

export const shouldBehaveLikeAnInitialWorkgroupOrganization = (getApp: () => ParticipantStack) => () => {
  describe('baseline config', () => {
    let cfg;
    var org

    before(async () => {
      cfg = getApp().getBaselineConfig();
      org = await getApp().getOrganization();
      await sleep(11000)
    });

    it('should have a non-null config', async () => {
      assert(cfg, 'config should not be null');
    });

    it('should indicate that this instance is the workgroup initiator', async () => {
      assert(cfg.initiator === true, 'config should indicate this instance is the workgroup initiator');
    });
  });

  describe('workflow privacy', () => {
    let prover;

    describe('zkSNARK provers', () => {
      describe('provisioning', () => {
        before(async () => {
          prover = await getApp().deployBaselineProver();
          assert(prover, 'setup artifacts should not be null');
        });

        it('should output a unique identifier for the prover', async () => {
          assert(prover.id, 'identifier should not be null');
        });

        it('should output the proving key id', async () => {
          assert(prover.provingKeyId, 'proving key id should not be null');
        });

        it('should output the verifying key id', async () => {
          assert(prover.verifyingKeyId, 'verifying key id should not be null');
        });

        it('should output the raw verifier source code', async () => {
          assert(prover.verifierContract, 'verifier contract should not be null');
          assert(prover.verifierContract.source, 'verifier source should not be null');
        });

        it('should store a reference to the workflow prover identifier', async () => {
          assert(getApp().getWorkflowIdentifier() === prover.id, 'workflow prover identifier should have a reference');
        });

        it('should output the compiled prover r1cs', async () => {
          assert(prover.artifacts, 'prover artifacts should not be null');
          assert(prover.artifacts.binary, 'prover r1cs artifact should not be null');
        });

        it('should output the keypair for proving and verification', async () => {
          assert(prover.artifacts, 'prover artifacts should not be null');
          assert(prover.artifacts.proving_key, 'proving key artifact should not be null');
          assert(prover.artifacts.verifying_key, 'verifying key artifact should not be null');
        });

        // it('should output the ABI of the compiled prover', async () => {
        //   assert(prover.abi, 'artifacts should contain the abi');
        // });

        describe('on-chain artifacts', () => {
          let shield;
          let verifier;

          before(async () => {
            shield = getApp().getWorkgroupContract('shield');
            verifier = getApp().getWorkgroupContract('verifier');
          });

          it('should deposit the workgroup shield contract on-chain', async () => {
            assert(shield, 'workgroup shield contract should not be null');
            assert(shield.address, 'workgroup shield contract should have been deployed');
          });
          it('should deposit the prover verifier on-chain', async () => {
            assert(verifier, 'workflow prover verifier contract should not be null');
            assert(verifier.address, 'workflow prover verifier contract should have been deployed');
          });
        });
      });
    });
  });
};

export const shouldBehaveLikeAnInvitedWorkgroupOrganization = (getApp: () => ParticipantStack) => () => {
  describe('baseline config', () => {
    let cfg;

    before(async () => {
      cfg = getApp().getBaselineConfig();
    });

    it('should have a non-null config', async () => {
      assert(cfg, 'config should not be null');
    });

    it('should indicate that this instance is not the workgroup initiator', async () => {
      assert(cfg.initiator === false, 'config should indicate this instance is not the workgroup initiator');
    });
  });

  describe('workgroup', () => {
    let workgroup;
    let workgroupToken;

    before(async () => {
      workgroup = getApp().getWorkgroup();
      workgroupToken = getApp().getWorkgroupToken();
    });

    it('should persist the workgroup in the local registry', async () => {
      assert(workgroup, 'workgroup should not be null');
      assert(workgroup.id, 'workgroup id should not be null');
    });

    it('should authorize a bearer token for the workgroup', async () => {
      assert(workgroupToken, 'workgroup token should not be null');
    });
  });
};
