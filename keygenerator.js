const EC = require('elliptic').ec;
const ec = new EC('secp256k1'); //a bit coin wallet algorithm

const key = ec.genKeyPair();
const publicKey = key.getPublic('hex'); //public key in hexadecimal form
const privateKey = key.getPrivate('hex'); //private key in  hexadecimal form.

console.log();
console.log("Private key: ", privateKey);

console.log();
console.log("Public key: ", publicKey);