const { mode } = require('crypto-js');
const SHA256 = require('crypto-js/sha256'); //importing sha256 (The hashing algorithm)
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');


class Transaction{
    //this is a class that acts as template for one of the main content of the block: Transaction.
    constructor(fromAddress, toAddress, amount){
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
    }

    calculateHash(){
        //calculating the hash, this hash is what we use for signing.
        return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
    }

    signTransaction(signingKey){
        if(signingKey.getPublic('hex') !== this.fromAddress){
            //insuring that the sender only sends from a wallet that is linked to his public key.
            //the public key must equal the from address public key.
            throw new Error('You cannot sign transactions for other wallets!');
        }

        const hashTx = this.calculateHash(); //the hash we want to sign
        const sig = signingKey.sign(hashTx, 'base64') //specifying the content of the signature, which is the previous hash
        this.signature = sig.toDER('hex') //storing the signature in hexadecimal form.

    }

    isValid(){
        //this method is used to ensure that the signature exists

        //if the transaction does not have a from address that means it's a mining reward, which is valid.
        if (this.fromAddress === null) return true;

        if (!this.signature || this.signature.length === 0) {
            //if the signature is non-existant or it's emptt, throw an exception
           throw new Error('No signature in this transaction');
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex'); //getting the public key of the from address
        return publicKey.verify(this.calculateHash(), this.signature); //compare the hash and the signature
    }
}

class Block{
    //creating a class as a template for creating chained blocks.
    constructor(timestamp, transactions, previousHash = '00e5d8e4414c1fbffa3fe030aa36be7690f0f62734994363408f9a767c5f443e'){ //IMPORTANT: you have to set the previousHash manually, by getting it form "data.txt" file!
        this.timestamp = timestamp; //the time of creation of the block
        this.transactions = transactions; //the data
        this.previousHash = previousHash; //the hash of the previous block
        this.hash = this.calculateHash(); //the hash of the current block.
        this.nonce = 0; //the only part of the block that we can change, so we can have the right difficulty target.
    }

    calculateHash(){
        //a method for calculating the hash of the current block, outputs a string.
        return SHA256(this.index + this.timestamp + this.previousHash + JSON.stringify(this.transactions) + this.nonce).toString();
    }

    mineBlock(difficulty){
        //this is a proof-of-work (mining) method
        while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")){ //difficulty specifies the number of zeros at the start of the hash
            // " Array(difficulty + 1).join("0")" is an array that contains a number of zeros (specified by the difficulty) 
            this.nonce++; //since we can not change anything in the block to have differnt amount of zeros, we will change the nonce. 
            this.hash = this.calculateHash();
        }
        console.log("Block mined: "  +  this.hash);

        //converting the header data to JSON format

        var header = {
            Hash: this.hash.toString(),
            TimeStamp: this.timestamp.toString(),
            Nonce: this.nonce.toString(),
            PreviousHash: this.previousHash.toString(),
            Difficulty: difficulty.toString()
          };

          //writing the header data to external file

        var fs = require('fs');
  
        // append data to file
        fs.appendFile('data.txt',"Block Header: " + JSON.stringify(header) + "\n", 'utf8',
        // callback function
         function(err) {     
            if (err) throw err;
             // if no error
            console.log("Data is appended to file successfully.")
        });

       

    }

    hasValidTransactions(){
        //this method is used to ensure that every transaction in the block is valid.
        for(const tx of this.transactions){ //loop thru all of the transactions in the block.
            if(!tx.isValid()){
                return false;
            }
        }
        return true;
    }

}




class Blockchain{
    //creating a class representing a blockchain
    constructor(){
        this.chain = [this.createGenesisBlock()]; //the contents (blocks) of the blockchain are stored here in this array.
        this.difficulty = 2; //specifing the difficulty, now every block's hash starts with two zeros.
        this.pendingTransactions = []; //this an array of the transactions that are waiting to be handeled.
        this.miningReward = 100; //a reward for succeful mining 
    }

    createGenesisBlock(){
        return new Block('01/01/2021', "Genesis Block", "0"); //creating a starting point
    }

    getLatestBlock(){
        //creating a method for getting the last block so we can add a new block after it later.
        return this.chain[this.chain.length - 1]; 
    }
    
   /* addBlock(newBlock){
        newBlock.previousHash = this.getLatestBlock().hash; //getting the last block's hash so we can add new block after it.
        //newBlock.hash = newBlock.calculateHash(); //calculating the hash of the new added block.
        newBlock.mineBlock(this.difficulty); //calculating the hash of the new added block, with the right amount of zeros.
        this.chain.push(newBlock); //pushing the block into the blockchain.

    }*/

    //the new addBlock() method:
    minePendingTransactions(miningRewardAddress){
         const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);
        //miningRewardAdress is the address to send the reward to.
        let block = new Block(Date.now(), this.pendingTransactions,  this.getLatestBlock().hash); //creating new block that contains the pending transactions.
        block.mineBlock(this.difficulty); //calculating the hash of the new added block, with the right amount of zeros.
        console.log("Block successfully mined!");
        this.chain.push(block);  //pushing the block into the blockchain.

        this.pendingTransactions = [
            new Transaction(null, miningRewardAddress, this.miningReward)
        ]; //reset the pendingTransactions array by creating an initial transaction that is why the first parameter is null.
        //IMORTANT: by resetting the array the reward will not be sent to the "miningRewardAddress" until the next block is mined (creating a new block).
    }

    addTransaction(transaction){
        
        if (!transaction.fromAddress || !transaction.toAddress) { //the from address and to address must be included in the transaction
            throw new Error('Transaction must include from and to address');
          }
      
          // checking if the transaction valid.
          if (!transaction.isValid()) {
            throw new Error('Cannot add invalid transaction to chain');
          }

        //pushing the transaction into the array.
        this.pendingTransactions.push(transaction);
    }

    getBalanceOfAddress(address){
        let Balance = 0; //default value.

        for(const block of this.chain){ //loop over each block in the chain
            for(const trans of block.transactions){ //then loop over each transaction in the current block
                if(trans.fromAddress === address){
                    Balance -= trans.amount; //if the given address is sending a transaction, decrease the balance.
                }

                if(trans.toAddress === address){
                    Balance += trans.amount; //if the given address is recieving  a transaction, increase the balance.
                }
            }
        }

        return Balance;
    }

    isChainValid(){
        for(let i = 1; i < this.chain.length; i++){
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if(!currentBlock.hasValidTransactions()){ //checking if all transactions in the block are valid.
                return false; 
            }

            if(currentBlock.hash !== currentBlock.calculateHash()){ //checking if the hash of each block is true.
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash){ //comparing each block's hash to the previous block's hash 
                return false;
            }
        }

        return true; //return true if all the conditions are met.
    }

}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;
