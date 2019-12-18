const Web3 = require('web3');
const Config = require('../config');

let nodeNum = process.env.NODE_NUM || 1;
let whisper_port = Config.nodes[`node_${nodeNum}`].whisper_port;
let ip_address = Config.nodes[`node_${nodeNum}`].ip_address;

let web3client;

async function isConnected() {
  let connected = false;
  if (typeof web3client !== 'undefined') {
    connected = await web3client.eth.net.isListening();
  }
  return connected;
};

async function getWeb3() {
  if (typeof web3client === 'undefined') {
    // set the provider you want from Web3.providers
    console.log("Creating initial Web3 connection");
    let newClient = await new Web3.providers.WebsocketProvider(`ws://${ip_address}:${whisper_port}`, { headers: { Origin: 'mychat2' } });
    web3client = await new Web3(newClient);
  } else if (await isConnected()) {
    web3client = await new Web3(web3client.currentProvider);
  } else {
    console.log("Web3 connection missing. Will open a new one");
    let newClient = await new Web3.providers.WebsocketProvider(`ws://${ip_address}:${whisper_port}`, { headers: { Origin: 'mychat2' } });
    web3client = await new Web3(newClient);
  }
  return web3client;
}

module.exports = {
  getWeb3,
  isConnected
};
