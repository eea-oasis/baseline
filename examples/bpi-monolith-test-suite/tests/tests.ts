import { BPI } from '../bpi/bpi';
import { expect } from 'chai';
import { Agreement } from '../bpi/agreement';
import { Workstep } from '../bpi/workstep';
import { Order } from '../domain-objects/order';
import { Workgroup } from '../bpi/workgroup';
import { BpiMessage } from '../bpi/bpiMessage';

describe('BPI, Workgroup and Worflow setup', () => {
    it('Given beggining of time, Alice initiates a new BPI with her organization as owner and an inital agreement state object, BPI created with inherent owner and a global agreement', () => {
        const aliceBpi = new BPI("AL1", "AliceOrganisation", ["555333"]);

        expect(aliceBpi.owner.id).to.be.equal("AL1");
        expect(aliceBpi.owner.name).to.be.equal("AliceOrganisation");
        expect(aliceBpi.agreement.productIds.length).to.be.equal(1);
        expect(aliceBpi.agreement.productIds[0]).to.be.equal("555333");
        expect(aliceBpi.agreement.orders).to.be.an("array").that.is.empty;
        expect(aliceBpi.agreement.proofs).to.be.an("array").that.is.empty;
    });

    it('Given freshly instantiated BPI, Alice creates a workgroup, workgroup is added to the BPI and available in the list of workgroups', () => {
        const aliceBpi = new BPI("AL1", "AliceOrganisation", ["555333"]);

        const exchangeOrdersWorkgroup = aliceBpi.addWorkgroup("AB1", "ABOrder", []);

        expect(aliceBpi.workgroups.length).to.be.equal(1);
        expect(aliceBpi.workgroups[0].id).to.be.equal(exchangeOrdersWorkgroup.id);
        expect(aliceBpi.workgroups[0].name).to.be.equal(exchangeOrdersWorkgroup.name);
        expect(aliceBpi.workgroups[0].participants.length).to.be.equal(1);
        expect(aliceBpi.workgroups[0].participants[0].id).to.be.equal("AL1");
    });

    it('Given newly created workgroup, Alice creates a workstep, workstep is added to the workgroup and is visible in the list of worksteps for a given workgroup', () => {
        const aliceBpi = new BPI("AL1", "AliceOrganisation", ["555333"]);
        const exchangeOrdersWorkgroup = aliceBpi.addWorkgroup("AB1", "ABOrder", []);
        
        const workStep = new Workstep("W1", "WRKSTP1");
        workStep.setBusinessLogicToExecute(aliceBpi.agreement.addOrder);
        exchangeOrdersWorkgroup.addWorkstep(workStep);

        expect(exchangeOrdersWorkgroup.worksteps.length).to.be.equal(1);
        expect(exchangeOrdersWorkgroup.worksteps.length).to.be.above(0);
        expect(exchangeOrdersWorkgroup.worksteps[0]).to.be.equal(workStep);
        expect(exchangeOrdersWorkgroup.worksteps[0].id).to.be.equal("W1");
        expect(exchangeOrdersWorkgroup.worksteps[0].name).to.be.equal("WRKSTP1");
    });

    it('Given a prepared workgroup with a workstep, Alice invites Bob, BPI stores the invitation and invitee email and this information is available for querying', () => {
        const aliceBpi = new BPI("AL1", "AliceOrganisation", ["555333"]);
        const exchangeOrdersWorkgroup = aliceBpi.addWorkgroup("AB1", "ABOrder", []);
        const workStep = new Workstep("W1", "WRKSTP1");
        workStep.setBusinessLogicToExecute(aliceBpi.agreement.addOrder);
        exchangeOrdersWorkgroup.addWorkstep(workStep);

        aliceBpi.inviteToWorkgroup("BI1", "BobsInvite", aliceBpi.owner, "bob@bob.com", exchangeOrdersWorkgroup.id, aliceBpi.agreement);
        const bobsInvitation = aliceBpi.getInvitationById("BI1");

        expect(bobsInvitation.id).to.be.equal("BI1");
        expect(bobsInvitation.name).to.be.equal("BobsInvite");
        expect(bobsInvitation.recipient).to.be.equal("bob@bob.com");
        expect(bobsInvitation.sender).to.be.equal(aliceBpi.owner);
        expect(bobsInvitation.agreement.productIds).to.be.equal(aliceBpi.agreement.productIds);
    });

    it('Given a sent invitation, Bob queries list of received invitations, can see invitation details from Alice', () => {
        const aliceBpi = new BPI("AL1", "AliceOrganisation", ["555333"]);
        const exchangeOrdersWorkgroup = aliceBpi.addWorkgroup("AB1", "ABOrder", []);
        const workStep = new Workstep("W1", "WRKSTP1");
        workStep.setBusinessLogicToExecute(aliceBpi.agreement.addOrder);
        exchangeOrdersWorkgroup.addWorkstep(workStep);
        aliceBpi.inviteToWorkgroup("BI1", "BobsInvite", aliceBpi.owner, "bob@bob.com", exchangeOrdersWorkgroup.id, aliceBpi.agreement);
        
        const bobsInvitations = aliceBpi.getReceivedInvitationsByEmail("bob@bob.com");

        expect(bobsInvitations[0].id).to.be.equal("BI1");
        expect(bobsInvitations[0].name).to.be.equal("BobsInvite");
        expect(bobsInvitations[0].recipient).to.be.equal("bob@bob.com");
        expect(bobsInvitations[0].sender).to.be.equal(aliceBpi.owner);
        expect(bobsInvitations[0].agreement.productIds).to.be.equal(aliceBpi.agreement.productIds);
    });

    it('Given a received invitation, Bob accepts by singing the agreement, Bob is added as a subject to the Bpi, to the collection of workgroup participants and proof is stored in the collection of proofs for the workgroup', () => {
        const aliceBpi = new BPI("AL1", "AliceOrganisation", ["555333"]);
        const exchangeOrdersWorkgroup = aliceBpi.addWorkgroup("AB1", "ABOrder", []);
        const workStep = new Workstep("W1", "WRKSTP1");
        workStep.setBusinessLogicToExecute(aliceBpi.agreement.addOrder);
        exchangeOrdersWorkgroup.addWorkstep(workStep);
        aliceBpi.inviteToWorkgroup("BI1", "BobsInvite", aliceBpi.owner, "bob@bob.com", exchangeOrdersWorkgroup.id, aliceBpi.agreement);

        const bobsInvitation = aliceBpi.getReceivedInvitationsByEmail("bob@bob.com");
        //signed invitation "triggers" Bpi to create dummy proof and add Bob to orgs and workgrouop participants
        aliceBpi.signInvitation(bobsInvitation[0].id, "bobsSignature", "BO1", "BobOrganisation");

        const workgroup = aliceBpi.getWorkgroupById(exchangeOrdersWorkgroup.id); 
        expect(aliceBpi.getOrganizationById("BO1")).to.not.be.undefined;
        expect(workgroup.participants.length).to.be.equal(2);
        expect(workgroup.participants[1].id).to.be.equal("BO1");
        expect(workgroup.participants[1].name).to.be.equal("BobOrganisation");
        expect(aliceBpi.agreement.proofs.length).to.be.equal(1);
        expect(aliceBpi.agreement.proofs[0].length).to.be.above(0);
    });

    it('Given accepted invite, Alice queries the list of sent invitations, and can verify the proof aginst the Bpi', () => {
        const aliceBpi = new BPI("AL1", "AliceOrganisation", ["555333"]);
        const exchangeOrdersWorkgroup = aliceBpi.addWorkgroup("AB1", "ABOrder", []);
        const workStep = new Workstep("W1", "WRKSTP1");
        workStep.setBusinessLogicToExecute(aliceBpi.agreement.addOrder);
        exchangeOrdersWorkgroup.addWorkstep(workStep);
        aliceBpi.inviteToWorkgroup("BI1", "BobsInvite", aliceBpi.owner, "bob@bob.com", exchangeOrdersWorkgroup.id, aliceBpi.agreement);        
        const bobsInvitation = aliceBpi.getReceivedInvitationsByEmail("bob@bob.com");
        aliceBpi.signInvitation(bobsInvitation[0].id, "bobsSignature", "BO1", "BobOrganisation");
        const invQuedByAlice = aliceBpi.getInvitationById("BI1");

        const proofVerificationResult = aliceBpi.verifyProof(invQuedByAlice.agreement.proofs[0]);

        expect(proofVerificationResult).to.be.true;
    });

});

describe('Exchanging business objects', () => {
    it('Given verified proof, Alice sends request for the order that is valid, the request is verified against the agreement, the proof and order is sent to Bob', () => {
        const [aliceBpi, exchangeOrdersWorkgroup] = setupOrderExchangeWorkgroupWithACleanAgreementState();

        const orderBusinessObject = new Order("0001", "Purchase", 30, "555333");
        const orgAlice = aliceBpi.organizations[0];
        const orgBob = aliceBpi.organizations[1];
        const addOrderMessage = new BpiMessage("M1", "W1", orgAlice, orgBob, exchangeOrdersWorkgroup.id, orderBusinessObject);

        // Alice sends to BPI for agreement update, validation and proof generation

        const proof = aliceBpi.sendWorkstepMessage(addOrderMessage);
        addOrderMessage.setExecutionProof(proof);

        // Alice sends to BPI to message to Bob

        aliceBpi.sendMessageToCounterParty(addOrderMessage);

        // Bob receives\queries messages and fetches the message from Alice

        const receivedMessage = aliceBpi.getNewvlyReceivedMessages(orgBob);
        
        // Bob verifies the state against the BPI

        var verificationResult = aliceBpi.verifyProof(receivedMessage[0].executionProof)

        expect(aliceBpi.agreement.orders.length).to.be.equal(1);
        expect(aliceBpi.agreement.orders[0].acceptanceStatus).to.be.equal("pending");
        expect(aliceBpi.agreement.proofs.length).to.be.equal(2);
        expect(verificationResult).to.be.true;
    });

    it('Given newly setup workgroup between Alice and Bob, Alice sends request for the order that is invalid, the request is verified against the agreement, error response is sent back to Alice', () => {
        const [aliceBpi, exchangeOrdersWorkgroup] = setupOrderExchangeWorkgroupWithACleanAgreementState();

        const orderBusinessObject = new Order("0001", "Purchase", 15, "555333");
        const orgAlice = aliceBpi.organizations[0];
        const orgBob = aliceBpi.organizations[1];
        const addOrderMessage = new BpiMessage("M1", "W1", orgAlice, orgBob, exchangeOrdersWorkgroup.id, orderBusinessObject);

        const proof = aliceBpi.sendWorkstepMessage(addOrderMessage);

        expect(proof).to.be.equal("err: workstep execution failed to satisfy the agreement.");
    });

    // it('Given recieved Order, Bob validates proof against Bpi, gets positive result from Bpi', () => {
    //     const aliceBpi = new BPI("AL1", "AliceOrganisation", ["555333"]);
    //     const exchangeOrdersWorkgroup = aliceBpi.addWorkgroup("AB1", "ABOrder", []);
    //     const workStep = new Workstep("W1", "WRKSTP1");
    //     workStep.setBusinessLogicToExecute(aliceBpi.agreement.orderPriceIsGreater);
    //     exchangeOrdersWorkgroup.addWorkstep(workStep);
    //     const inviteBob = aliceBpi.inviteToWorkgroup("BI1", "BobsInvite", aliceBpi.owner, "bob@bob.com", exchangeOrdersWorkgroup.id, aliceBpi.agreement);
    //     const bobsEnteredData = inviteBob.sign();
    //     aliceBpi.signedInviteEvent(inviteBob.id, bobsEnteredData);
    //     //Alice creates an order with a given price...that will be checked in the validation process
    //     const businessObject = new Order("0001", "Purchase", 30);
    //     //Order is saved in Alices databse of orders
    //     const aliceOrg = aliceBpi.getOrganizationById("AL1");
    //     aliceOrg.orders.push(businessObject);
    //     //send request with the order (valid)
    //     const bpiResponse = aliceBpi.sendOrder(businessObject, exchangeOrdersWorkgroup.id);
    //     //bob validates the recieved proof and should recieve a positive result
    //     const bpiResponseForBob = aliceBpi.verifyProof(aliceBpi.getOrganizationById("BO1").proofForActualWorkstep);
    //     //if response is true or false
    //     expect(bpiResponseForBob).to.be.true;
    // });

    it('Given Bob receives a positive result, Bob performs acceptance, the acceptance is returned to Alice', () => {
        const [aliceBpi, exchangeOrdersWorkgroup] = setupOrderExchangeWorkgroupWithACleanAgreementState();
        const orderBusinessObject = new Order("0001", "Purchase", 30, "555333");
        const orgAlice = aliceBpi.organizations[0];
        const orgBob = aliceBpi.organizations[1];
        const addOrderMessage = new BpiMessage("M1", "W1", orgAlice, orgBob, exchangeOrdersWorkgroup.id, orderBusinessObject);

        // Alice sends to BPI for agreement update, validation and proof generation
        let proof = aliceBpi.sendWorkstepMessage(addOrderMessage);
        addOrderMessage.setExecutionProof(proof);

        // Alice sends request to BPI to message Bob
        aliceBpi.sendMessageToCounterParty(addOrderMessage);

        // Create workStep2, set workStep's business logic, and add work step to workgroup
        const workStep = new Workstep("W2", "WRKSTP2");
        workStep.setBusinessLogicToExecute(aliceBpi.agreement.acceptOrder);
        exchangeOrdersWorkgroup.addWorkstep(workStep);
        
        // Bob sends to BPI for agreement update, vlaidation, and proof generation
        const acceptOrderMessage = new BpiMessage("M2", "W2", orgBob, orgAlice, exchangeOrdersWorkgroup.id, orderBusinessObject);
        proof = aliceBpi.sendWorkstepMessage(acceptOrderMessage);
        acceptOrderMessage.setExecutionProof(proof);
        
        // Bob sends request to BPI to message Alice 
        aliceBpi.sendMessageToCounterParty(acceptOrderMessage);
        
        // Alice receives\queries messages and fetches the message from Bob
        const receivedMessage = aliceBpi.getNewvlyReceivedMessages(orgAlice);

        // Alice verifies the state against the BPI
        const verificationResult = aliceBpi.verifyProof(receivedMessage[0].executionProof);

        expect(aliceBpi.agreement.orders.length).to.be.equal(1);
        expect(aliceBpi.agreement.orders[0].acceptanceStatus).to.be.equal("accepted");
        expect(aliceBpi.agreement.proofs.length).to.be.equal(3);
        expect(aliceBpi.agreement.proofs[2]).to.be.equal(proof);
        expect(verificationResult).to.be.true;
    });

    // it('Alice receives Bobs acceptance and proof, Alice validates the proof, Alice recieves a positive result', () => {
    //     expect(1).to.be.equal(2);
    // });

    function setupOrderExchangeWorkgroupWithACleanAgreementState(): [BPI, Workgroup] {
        const aliceBpi = new BPI("AL1", "AliceOrganisation", ["555333"]);
        const exchangeOrdersWorkgroup = aliceBpi.addWorkgroup("AB1", "ABOrder", []);
        const workStep = new Workstep("W1", "WRKSTP1");
        workStep.setBusinessLogicToExecute(aliceBpi.agreement.addOrder);
        exchangeOrdersWorkgroup.addWorkstep(workStep);
        aliceBpi.inviteToWorkgroup("BI1", "BobsInvite", aliceBpi.owner, "bob@bob.com", exchangeOrdersWorkgroup.id, aliceBpi.agreement);        
        const bobsInvitation = aliceBpi.getReceivedInvitationsByEmail("bob@bob.com");
        aliceBpi.signInvitation(bobsInvitation[0].id, "bobsSignature", "BO1", "BobOrganisation");

        return [aliceBpi, exchangeOrdersWorkgroup];
    }
});



// One BPI per use-case that can be hosted at Bob's, Alice's or any other infrastructure.

// Alice and bob use BPI clients to communicate with the BPI instance.

// OrgRegistry is per BPI. It is just an implementation of the authz for workflows from bri-1. Standards document
// covers this with policies.

// Alice prepares an agreement, which contains all the elements required to validate a state transition. 
// Product ids for example. Alice instantiates the BPI with a state object carying product ids representing the agreement
// between Alice and Bob.

// T0 - Agree on initial agreement
            // |
            // |
// T1 - Alice Request quote
            // |
            // |
// T2 - Bob Submit quote

// Alice prepares the workgroup with the worksteps. Workstep example:
    // predicate: "request quote"
    // Scope is Alice sending and Bob accepting
    // Bob signature completes the worksteps and updates the agreement state object
    // Circuit 'executes' the business logic of the workstep (i.e. does the quote contain agreement product id)


// Alice finds Bob's contacts information through whatever channel and sends a link with workgroup invitation
// information. Invitation includes:
    // 1. Initial agreement which has to be signed by Bob.
    // 2. APIs available - Wokflow\Workstep level Api definition so that BOBs SOR can speak the languagle of the BPI
    // and propose state changes of the agreement

// All other communcation between Alice and Bob goes through the messaging component