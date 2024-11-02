const { 
  Connection, 
  PublicKey, 
  Transaction, 
  Keypair 
} = require('@solana/web3.js');
const { Market } = require('@project-serum/serum');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');

class TradeManager {
  constructor(privateKey, rpcUrl) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.wallet = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(privateKey))
    );
  }

  async copyTrade(tradeInfo) {
    // Implement trade copying logic here
    // Return transaction signature
    return { signature: '' };
  }

  async sellAllTokens() {
    // Implement sell all tokens logic here
    // Return array of transaction signatures
    return { signatures: [] };
  }

  async getWalletBalance() {
    const solBalance = await this.connection.getBalance(this.wallet.publicKey);
    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
      this.wallet.publicKey,
      { programId: TOKEN_PROGRAM_ID }
    );

    const tokens = tokenAccounts.value.map(account => ({
      symbol: account.account.data.parsed.info.mint,
      amount: account.account.data.parsed.info.tokenAmount.uiAmount
    }));

    return {
      sol: solBalance / 1e9,
      tokens
    };
  }
}

module.exports = { TradeManager };