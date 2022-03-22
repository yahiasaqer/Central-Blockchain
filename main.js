const {Blockchain, Transaction} = require('./Blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('8890a9c240852619fef12c081cbe2bc1a0a3b2f9cae6d3544204b25e8e847200'); //the private key
const myWalletAddress = myKey.getPublic('hex'); //the public key



//testing the code

let myBlockchain  = new Blockchain();
const tx1 = new Transaction(myWalletAddress, "to address public key goes here", 10); //creating a transaction
tx1.signTransaction(myKey); //sign the transaction.
myBlockchain.addTransaction(tx1) //push it in the array.


console.log("Starting the miner... "); //create a block.
myBlockchain.minePendingTransactions(myWalletAddress); //mining reward goes to the address "myWalletAddress"


console.log("My balance is: " + myBlockchain.getBalanceOfAddress(myWalletAddress)); 

//myBlockchain.chain[1].transactions[0].amount = 5; this tampering will break the chain

console.log("Is chain valid?" + myBlockchain.isChainValid())

//converting the data to JSON format
var data = {
  Address: myWalletAddress.toString(),
  Amount: myBlockchain.getBalanceOfAddress(myWalletAddress) 
};



// Writing to external file "data.txt"
var fs = require('fs');
  
// append data to file
fs.appendFile('data.txt',"Transactions: " + JSON.stringify(data) + "\n", 'utf8',
    // callback function
    function(err) {     
        if (err) throw err;
        // if no error
        console.log("Data is appended to file successfully.")
});