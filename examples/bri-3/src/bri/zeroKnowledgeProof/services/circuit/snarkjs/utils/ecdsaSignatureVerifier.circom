pragma circom 2.1.5;

include "../../../../../../../node_modules/circomlib/circuits/comparators.circom";
include "./ecdsa/eff_ecdsa.circom";

template EcdsaSignatureVerifier(){
	signal input signature;
	signal input publicKeyX;
	signal input publicKeyY;
	signal input Tx; // T = r^-1 * R
	signal input Ty; 
	signal input Ux; // U = -(m * r^-1 * G)
	signal input Uy;

	signal output verified;

	component signatureVerifier = EfficientECDSA();

	signatureVerifier.s <== signature;
    	signatureVerifier.Tx <== Tx;
   	signatureVerifier.Ty <== Ty; 
    	signatureVerifier.Ux <== Ux;
    	signatureVerifier.Uy <== Uy;

	component isEqualPubKeyX = IsEqual();
	component isEqualPubKeyY = IsEqual();

	isEqualPubKeyX.in[0] <== signatureVerifier.pubKeyX;
	isEqualPubKeyX.in[1] <== publicKeyX;	

	isEqualPubKeyY.in[0] <== signatureVerifier.pubKeyY;
	isEqualPubKeyY.in[1] <== publicKeyY;

	verified <== isEqualPubKeyX.out * isEqualPubKeyY.out;	
}