import { BPI } from '../bpi/bpi';
import { expect } from 'chai';
import { Agreement } from '../bpi/agreement';
import { Workstep } from '../bpi/workstep';

describe('BPI, Workgroup and Worflow setup', () => {
    it('Given beggining of time, Alice initiates a new BPI with her organization as owner and an inital agreement state object, BPI created with inherent owner and a global agreement', () => {
    });

    it('Given freshly instantiated BPI, Alice creates a workgroup, workgroup is added to the BPI and available in the list of workgroups', () => {
    });

    it('Given newly created workgroup, Alice creates a workstep, workstep is added to the workgroup and is visible in the list of worksteps for a given workgroup', () => {
    });

    it('Given a prepared workgroup, Alice invites Bob, BPI stored the invitation per workgroup and invitee email and this information is available to Bob though a list of invitations', () => {
    });

    it('Given a sent invitation, Alice queries list of sent invitations, can see Bob invitation details', () => {
    });

    it('Given a sent invitation, Bob queries list of received invitations, can see invitation details from Alice', () => {
    });

    it('Given a received invitation, Bob accepts by singing the agreement, Bob is added to the collection of workgroup participants and proof is stored in the collection of proofs for the workgroup', () => {
    });
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