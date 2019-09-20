'use strict';

const express = require('express');
const router = express.Router();
const WhisperWrapper = require('../src/WhisperWrapper');
const ContactUtils = require('../src/ContactUtils');

let whisperWrapper, contactUtils;

router.get('/health-check', async (req, res) => {
  res.status(200);
  res.send({ message: 'Everything is good! Thanks for checking.' });
});

router.get('/identities', async (req, res) => {
  let result = await whisperWrapper.getWhisperIds();
  res.status(200);
  res.send(result);
});

router.post('/identities', async (req, res) => {
  let result = await whisperWrapper.createIdentity();
  res.status(200);
  res.send(result);
});

router.get('/contacts', async (req, res) => {
  let result = await contactUtils.getAllContacts();
  res.status(200);
  res.send(result);
});

router.post('/contacts', async (req, res) => {
  let result = await contactUtils.createContact(req.body);
  res.status(200);
  res.send(result);
});

// Fetch messages from private 1:1 conversation
router.get('/messages/:myId/topic/:topicId/contact/:contactId', async (req, res) => {
  let result = await whisperWrapper.getMessages(req.params.myId, req.params.topic, req.params.contactId);
  res.status(200);
  res.send(result);
});

router.post('/messages/:senderKeyId', async (req, res) => {
  let result;
  // private is a required field to ensure private messages aren't accidentally sent publicly
  if (typeof req.body.private == 'undefined' || !req.body.message) {
    res.status(400);
    res.send({ error: 'Request body must contain following fiels: private, message' });
  }
  if (req.body.private) {
    result = await whisperWrapper.sendPrivateMessage(req.params.senderKeyId, req.body.recipientId, req.body.topic, req.body.message);
  } else {
    result = await whisperWrapper.sendPublicMessage(req.params.senderKeyId, req.body.topic, req.body.message);
  }
  res.status(200);
  res.send(result);
});

//  req.body:
//    dataField: {
//      value: String,
//      dataId: String,
//      description: String
//    },
//    participants: []
router.post('/entanglements/:senderKeyId', async (req, res) => {
  // Will generate random topic and password to use for this entanglement,
  // and share it with other participants via private Whisper messages
  let result = await whisperWrapper.createEntanglement(req.params.senderKeyId, req.body);
  res.status(200);
  res.send(result);
});

async function initialize(ipAddress, port) {
  contactUtils = new ContactUtils();
  whisperWrapper = new WhisperWrapper(ipAddress, port);
  let connected = await whisperWrapper.isConnected();
  await whisperWrapper.loadWhisperIds();
  return connected;
}

module.exports = {
  router: router,
  initialize: initialize
};
