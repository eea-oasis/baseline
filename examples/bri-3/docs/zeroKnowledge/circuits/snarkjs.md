# Snarkjs Circuit

This document describes the setup and process for generating zero-knowledge proofs using snarkjs. The circuits are written and compiled using [Circom](https://docs.circom.io/getting-started/installation/). Then, the [snarkjs](https://github.com/iden3/snarkjs) library is used to generate proofs from these compiled circuits.

```NOTE
There are other available zk circuit libraries such as gnark.

Here is a [link](https://blog.celer.network/2023/03/01/the-pantheon-of-zero-knowledge-proof-development-frameworks/) for comparing performances of gnark and snarkjs circuit libraries. To summarise,

- Proof generation time: For Groth16, gnark is 5~10 times faster than snarkjs
- Peak memory usage: It is comparable for both libraries.
- CPU utilisation: Gnark shows better CPU utilisation.

As discussed during call on 27/04/2023, snarkjs is preferred due to its ease of development (a separate service for running zk-circuits in golang is not required). Also, It is deemed sufficient for our use case based on the number of constraints in our circuit.

The zero knowledge proof module interface allows these libraries to be used interchangeably. According to your requirement, you may write new circuits in your preferred library and plug it into this module.
```

## Pre-Setup Installations

[Detailed Instructions](https://docs.circom.io/getting-started/installation/#installing-dependencies)

Step 1: Install Rust

Circom is written in Rust.

`curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh`

Step 2: Install Circom

Run the following commands from the directory where your computer stores global libraries.

`git clone https://github.com/iden3/circom.git`

`cd circom`

`cargo build --release`

`cargo install --path circom`

Step 3: Install Snarkjs

`npm install -g snarkjs`

## Setup

[Detailed Instructions](https://github.com/iden3/snarkjs)

We are going to use the Groth16 zk-SNARK protocol. To use this protocol, we need to generate a trusted setup. Groth16 requires a per circuit trusted setup. This trusted setup consists of 2 parts:

- The powers of tau, which is independent of the circuit.
- The phase 2, which depends on the circuit.

The commands for these two steps have been combined into ptau.sh and circuit.sh, respectively.

Step 1: `npm run snarkjs:ptau`

Step 2: `npm run snarkjs:circuit`