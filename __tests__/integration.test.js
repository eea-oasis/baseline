import request from 'supertest';
import { concatenateThenHash } from '../radish-api/src/utils/crypto/hashes/sha256/sha256';

jest.setTimeout(600000);

// Check <repo-root>/docker-compose.yml for correct URLs
const buyerApiURL = 'http://localhost:8001';
const buyerMessengerURL = 'http://localhost:4001';
const supplierMessengerURL = 'http://localhost:4002';
const supplierApiURL = 'http://localhost:8002';

describe('Check that containers are ready', () => {
  describe('Buyer containers', () => {
    test('Buyer messenger GET /health-check returns 200', async () => {
      const res = await request(buyerMessengerURL).get('/api/v1/health-check');
      expect(res.statusCode).toEqual(200);
    });

    test('Buyer radish-api REST server GET /health-check returns 200', async () => {
      const res = await request(buyerApiURL).get('/api/v1/health-check');
      expect(res.statusCode).toEqual(200);
    });
  });

  describe('Supplier containers', () => {
    test('Supplier messenger GET /health-check returns 200', async () => {
      const res = await request(supplierMessengerURL).get('/api/v1/health-check');
      expect(res.statusCode).toEqual(200);
    });

    test('Supplier radish-api REST server GET /health-check returns 200', async () => {
      const res = await request(supplierApiURL).get('/api/v1/health-check');
      expect(res.statusCode).toEqual(200);
    });
  });

});

describe('Buyer sends new RFP to supplier', () => {
  let supplierMessengerId;
  let buyerMessengerId;
  let rfpId;
  const sku = 'FAKE-SKU-123';

  describe('Retrieve identities from messenger', () => {
    test('Supplier messenger GET /identities', async () => {
      const res = await request(supplierMessengerURL).get('/api/v1/identities');
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThan(0);
      supplierMessengerId = res.body[0].publicKey;
    });

    test('Buyer messenger GET /identities', async () => {
      const res = await request(buyerMessengerURL).get('/api/v1/identities');
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThan(0);
      buyerMessengerId = res.body[0].publicKey;
    });
  });

  describe('Create new RFP through buyer radish-api', () => {
    test('Buyer graphql mutation createRFP() returns 400 withOUT sku', async () => {
      const postBody = ` mutation {
          createRFP( input: {
            skuDescription: "Widget 200",
            description: "Widget order for SuperWidget",
            proposalDeadline: 1578065104,
            recipients: [ { identity: "${supplierMessengerId}" } ]
          })
          { _id }
        } `
      const res = await request(buyerApiURL)
        .post('/graphql')
        .send({ query: postBody });
      expect(res.statusCode).toEqual(400);
    });

      test('Buyer graphql mutation createRFP() returns 200', async () => {
        let zkpPublicKey = '0x99246c83ca94b55a7330f68952ee74574a7d3b1921ccf29c84f75975935e6333';

        const postBody = ` mutation {
            createRFP( input: {
              sku: "${sku}",
              skuDescription: "Widget 200",
              description: "Widget order for SuperWidget",
              proposalDeadline: 1578065104,
              recipients: [{
                partner: {
                  identity: "${supplierMessengerId}",
                  name: "FakeName",
                  address: "0x0D8c04aCd7c417D412fe4c4dbB713f842dcd3A65",
                  role: "supplier",
                  zkpPublicKey: "${zkpPublicKey}",
                }
              }]
            })
            { _id, sku }
          } `
        const res = await request(buyerApiURL)
          .post('/graphql')
          .send({ query: postBody });
        expect(res.statusCode).toEqual(200);
        rfpId = res.body.data.createRFP._id;
      });
  });

  describe('Check RFP existence through radish-api queries', () => {
    test('Buyer graphql query rfp() returns 200', async () => {
      const queryBody = `{ rfp(uuid: "${rfpId}") { _id, sku } } `
      // Wait for db to update
      let res;
      for (let retry = 0; retry < 10; retry++) {
        res = await request(buyerApiURL)
          .post('/graphql')
          .send({ query: queryBody });
        if (res.body.data.rfp !== null) {
          break;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.rfp._id).toEqual(rfpId);
      expect(res.body.data.rfp.sku).toEqual(sku);
    });

    test('Supplier graphql query rfp() returns 200', async () => {
      const queryBody = `{ rfp(uuid: "${rfpId}") { _id, sku } } `
      // Wait for db to update
      let res;
      for (let retry = 0; retry < 10; retry++) {
        res = await request(supplierApiURL)
          .post('/graphql')
          .send({ query: queryBody });
        if (res.body.data.rfp !== null) {
          break;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.rfp._id).toEqual(rfpId);
      expect(res.body.data.rfp.sku).toEqual(sku);
    });
  });

  describe('Check RFP contents through radish-api query', () => {
    let messageId;

    test('Buyer rfp.recipients.origination contents are correct', async () => {
      const queryBody = `{ rfp(uuid: "${rfpId}") { _id, sku, recipients { origination { messageId, receiptDate } } } } `
      const res = await request(buyerApiURL)
        .post('/graphql')
        .send({ query: queryBody });
      expect(res.statusCode).toEqual(200);
      const origination = res.body.data.rfp.recipients[0].origination;
      expect(origination.receiptDate).not.toBeUndefined();
      messageId = origination.messageId;
      const messageRes = await request(buyerMessengerURL)
        .get(`/api/v1/messages/${messageId}`)
        .set('x-messenger-id', buyerMessengerId);
      expect(messageRes.statusCode).toEqual(200);
      const payload = JSON.parse(messageRes.body.payload)
      expect(payload.uuid).toEqual(rfpId);
    });

    test('Supplier messenger has raw message that delivered RFP from buyer', async () => {
      const messageRes = await request(supplierMessengerURL)
        .get(`/api/v1/messages/${messageId}`)
        .set('x-messenger-id', supplierMessengerId);
      expect(messageRes.statusCode).toEqual(200);
      const payload = JSON.parse(messageRes.body.payload)
      expect(payload.uuid).toEqual(rfpId);
    });
  });

});

// create global variables to hold values relating to MSA's for future tests of POs:
let msaId;

describe('Buyer creates MSA, signs it, sends to supplier, supplier responds with signed MSA', () => {
  const supplierAddress = '0x3f7eB8a7d140366423e9551e9532F4bf1A304C65';
  const supplierAddressPadded = '0x0000000000000000000000003f7eB8a7d140366423e9551e9532F4bf1A304C65';
  const sku = 'FAKE-SKU-123';
  const skuPadded = '0x0000000046414b452d534b552d313233';
  const erc20ContractAddress = '0xcd234a471b72ba2f1ccf0a70fcaba648a5eecd8d';
  const erc20ContractAddressPadded = '0x000000000000000000000000cd234a471b72ba2f1ccf0a70fcaba648a5eecd8d';
  const tierBounds = [1, 200, 400, 600];
  const tierBoundsPadded = [
    '0x00000000000000000000000000000001',
    '0x000000000000000000000000000000c8',
    '0x00000000000000000000000000000190',
    '0x00000000000000000000000000000258',
  ]
  const pricesByTier = [10, 9, 8];
  const pricesByTierPadded = [
    '0x0000000000000000000000000000000a',
    '0x00000000000000000000000000000009',
    '0x00000000000000000000000000000008',
  ]

  describe('Create new MSA through buyer radish-api', () => {
    test('Buyer graphql mutation createMSA() returns 400 without sku', async () => {
      const postBody = ` mutation {
          createMSA( input: {
            supplierAddress: "${supplierAddress}",
            tierBounds: [1, 200, 400, 600],
            pricesByTier: [10, 9, 8],
            erc20ContractAddress: "${erc20ContractAddress}",
          })
          { _id }
        } `

      const res = await request(buyerApiURL)
        .post('/graphql')
        .send({ query: postBody });

      expect(res.statusCode).toEqual(400);
    });

    test('Buyer graphql mutation createMSA() returns 200', async () => {
      const postBody = ` mutation {
        createMSA( input: {
          supplierAddress: "${supplierAddress}",
          tierBounds: [1, 200, 400, 600],
          pricesByTier: [10, 9, 8],
          sku: "${sku}",
          erc20ContractAddress: "${erc20ContractAddress}",
        })
        { zkpPublicKeyOfBuyer, zkpPublicKeyOfSupplier, sku, _id, commitment, salt}
      } `

      const res = await request(buyerApiURL)
        .post('/graphql')
        .send({ query: postBody });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.createMSA.zkpPublicKeyOfBuyer).toEqual('0x21864a8a3f24dad163d716f77823dd849043481c7ae683a592a02080e20c1965');
      expect(res.body.data.createMSA.zkpPublicKeyOfSupplier).toEqual('0x03366face983056ea73ff840eee1d8786cf72b0e14a8e44bac13e178ac3cebd5');
      expect(res.body.data.createMSA.sku).toEqual('FAKE-SKU-123');
      expect(res.body.data.createMSA._id).not.toBeNull();
      expect(res.body.data.createMSA.commitment).toEqual(concatenateThenHash(
        '0x21864a8a3f24dad163d716f77823dd849043481c7ae683a592a02080e20c1965',
        '0x03366face983056ea73ff840eee1d8786cf72b0e14a8e44bac13e178ac3cebd5',
        concatenateThenHash(...tierBoundsPadded, ...pricesByTierPadded),
        tierBoundsPadded[0],
        tierBoundsPadded[tierBoundsPadded.length - 1],
        skuPadded,
        erc20ContractAddressPadded,
        '0x00000000000000000000000000000000',
        '0x00000000000000000000000000000000',
        res.body.data.createMSA.salt
      ));

      // assign global states for PO tests:
      msaId = res.body.data.createMSA._id
    });
  });
});

// describe('Buyer creates PO', () => {
//   describe('Create new PO through buyer radish-api', () => {
//     test('Buyer graphql mutation createPO() returns 400 without volume', async () => {
//       const postBody = ` mutation {
//           createPO( input: {
//             msaId: "${msaId}",
//             volume: 300
//           })
//           { _id }
//         } `
//
//       const res = await request(buyerApiURL)
//         .post('/graphql')
//         .send({ query: postBody });
//
//       expect(res.statusCode).toEqual(400);
//     });
//
//     test('Buyer graphql mutation createPO() returns 200', async () => {
//       const postBody = ` mutation {
//         createPO( input: {
//           msaId: "${msaId}",
//           volume: 300
//         })
//         { zkpPublicKeyOfBuyer, zkpPublicKeyOfSupplier, sku, _id, commitment, salt }
//       } `
//
//       const res = await request(buyerApiURL)
//         .post('/graphql')
//         .send({ query: postBody });
//
//       expect(res.statusCode).toEqual(200);
//       expect(res.body.data.createPO.zkpPublicKeyOfBuyer).toEqual('0x99246c83ca94b55a7330f68952ee74574a7d3b1921ccf29c84f75975935e6333');
//       expect(res.body.data.createPO.zkpPublicKeyOfSupplier).toEqual('0x83e7b0ea610bde1adc00f50fa541fd2a220fcc55743fa34d2fb33eb9da563143');
//       expect(res.body.data.createPO.sku).toEqual('FAKE-SKU-123');
//       expect(res.body.data.createPO._id).not.toBeNull();
//       expect(res.body.data.createPO.commitment).not.toEqual(null);
//     });
//   });
// });
