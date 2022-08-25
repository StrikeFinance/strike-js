const assert = require('assert');
const ethers = require('ethers');
const sToken = require('../src/sToken.ts');
const Strike = require('../src/index.ts');
const providerUrl = 'http://localhost:8545';

module.exports = function suite([ publicKeys, privateKeys ]) {

  const acc1 = { address: publicKeys[0], privateKey: privateKeys[0] };
  const acc2 = { address: publicKeys[1], privateKey: privateKeys[1] };
  
  it('runs sToken.supply ETH', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const trx = await strike.supply(Strike.ETH, 2);
    const receipt = await trx.wait(1);

    const numEvents = receipt.events.length;
    const events = receipt.events.map(e => e.event);

    const numEventsExpected = 4;

    assert.equal(numEvents, numEventsExpected);
    assert.equal(events.includes('AccrueInterest'), true);
    assert.equal(events.includes('Mint'), true);
    assert.equal(events.includes('Transfer'), true);
  });

  it('runs sToken.supply USDC', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const supplyEthTrx = await strike.supply(Strike.ETH, 2);
    await supplyEthTrx.wait(1);

    const enterEthMarket = await strike.enterMarkets(Strike.ETH);
    await enterEthMarket.wait(1);

    const borrowUsdcTrx = await strike.borrow(Strike.USDC, 5, { gasLimit: 600000 });
    await borrowUsdcTrx.wait(1);

    const supplyUsdcTrx = await strike.supply(Strike.USDC, 2);
    const receipt = await supplyUsdcTrx.wait(1);

    const numEvents = receipt.events.length;
    const events = receipt.events.map(e => e.event);

    let numbTransfers = 0;
    events.forEach(e => { if (e === 'Transfer') numbTransfers++ });

    const numEventsExpected = 5;
    const numbTransfersExpected = 2;

    assert.equal(numEvents, numEventsExpected);
    assert.equal(numbTransfers, numbTransfersExpected);
    assert.equal(events.includes('AccrueInterest'), true);
    assert.equal(events.includes('Mint'), true);
    assert.equal(events.includes('Transfer'), true);
  });
/*
  it('runs sToken.supply USDC no approve', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const supplyEthTrx = await strike.supply(Strike.ETH, 2);
    await supplyEthTrx.wait(1);

    const enterEthMarket = await strike.enterMarkets(Strike.ETH);
    await enterEthMarket.wait(1);

    const borrowUsdcTrx = await strike.borrow(Strike.USDC, 5, { gasLimit: 600000 });
    await borrowUsdcTrx.wait(1);

    const supplyUsdcTrx = await strike.supply(Strike.USDC, 2, true);
    const receipt = await supplyUsdcTrx.wait(1);

    const numEvents = receipt.events.length;
    const events = receipt.events.map(e => e.event);

    const numEventsExpected = 3;

    assert.equal(numEvents, numEventsExpected);
    assert.equal(events.includes('AccrueInterest'), true);
    assert.equal(events.includes('Failure'), true);
    
  });*/

  it('fails sToken.supply asset type', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const errorMessage = 'Strike [supply] | Argument `asset` cannot be supplied.';
    try {
      const trx = await strike.supply(null, 10); // bad asset type
    } catch (e) {
      assert.equal(e.message, errorMessage);
    }
  });

  it('fails sToken.supply bad amount', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const errorMessage = 'Strike [supply] | Argument `amount` must be a string, number, or BigNumber.';
    try {
      const trx = await strike.supply('ETH', null); // bad amount
    } catch (e) {
      assert.equal(e.message, errorMessage);
    }
  });

  it('runs sToken.redeem ETH', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const supplyEthTrx = await strike.supply(Strike.ETH, 1);
    await supplyEthTrx.wait(1);

    const trx = await strike.redeem(Strike.ETH, 1);
    const receipt = await trx.wait(1);

    const numEvents = receipt.events.length;
    const events = receipt.events.map(e => e.event);

    const numEventsExpected = 4;

    assert.equal(numEvents, numEventsExpected);
    assert.equal(events.includes('AccrueInterest'), true);
    assert.equal(events.includes('Redeem'), true);
    assert.equal(events.includes('Transfer'), true);
  });

  it('runs sToken.redeem USDC', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const supplyEthTrx = await strike.supply(Strike.ETH, 2);
    await supplyEthTrx.wait(1);

    const enterEthMarket = await strike.enterMarkets(Strike.ETH);
    await enterEthMarket.wait(1);

    const borrowUsdcTrx = await strike.borrow(Strike.USDC, 5, { gasLimit: 600000 });
    await borrowUsdcTrx.wait(1);

    const supplyUsdcTrx = await strike.supply(Strike.USDC, 2);
    await supplyUsdcTrx.wait(1);

    const trx = await strike.redeem(Strike.USDC, 2);
    const receipt = await trx.wait(1);

    const numEvents = receipt.events.length;
    const events = receipt.events.map(e => e.event);

    let numbTransfers = 0;
    events.forEach(e => { if (e === 'Transfer') numbTransfers++ });

    const numEventsExpected = 5;
    const numbTransfersExpected = 2;

    assert.equal(numEvents, numEventsExpected);
    assert.equal(numbTransfers, numbTransfersExpected);
    assert.equal(events.includes('AccrueInterest'), true);
    assert.equal(events.includes('Redeem'), true);
    assert.equal(events.includes('Transfer'), true);
  });

  it('runs sToken.redeem sUSDC', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const supplyEthTrx = await strike.supply(Strike.ETH, 2);
    await supplyEthTrx.wait(1);

    const enterEthMarket = await strike.enterMarkets(Strike.ETH);
    await enterEthMarket.wait(1);

    const borrowUsdcTrx = await strike.borrow(Strike.USDC, 5, { gasLimit: 600000 });
    await borrowUsdcTrx.wait(1);

    const supplyUsdcTrx = await strike.supply(Strike.USDC, 2);
    await supplyUsdcTrx.wait(1);

    const trx = await strike.redeem(Strike.sUSDC, 2);
    const receipt = await trx.wait(1);

    const numEvents = receipt.events.length;
    const events = receipt.events.map(e => e.event);

    let numbTransfers = 0;
    events.forEach(e => { if (e === 'Transfer') numbTransfers++ });

    const numEventsExpected = 5;
    const numbTransfersExpected = 2;

    assert.equal(numEvents, numEventsExpected);
    assert.equal(numbTransfers, numbTransfersExpected);
    assert.equal(events.includes('AccrueInterest'), true);
    assert.equal(events.includes('Redeem'), true);
    assert.equal(events.includes('Transfer'), true);
  });

  it('fails sToken.redeem bad asset', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const errorMessage = 'Strike [redeem] | Argument `asset` must be a non-empty string.';
    try {
      const trx = await strike.redeem(null, 2); // bad asset
    } catch (e) {
      assert.equal(e.message, errorMessage);
    }
  });

  it('fails sToken.redeem invalid asset', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const errorMessage = 'Strike [redeem] | Argument `asset` is not supported.';
    try {
      const trx = await strike.redeem('UUUU', 2); // invalid asset
    } catch (e) {
      assert.equal(e.message, errorMessage);
    }
  });

  it('fails sToken.redeem invalid sToken', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const errorMessage = 'Strike [redeem] | Argument `asset` is not supported.';
    try {
      const trx = await strike.redeem('sUUUU', 2); // invalid asset
    } catch (e) {
      assert.equal(e.message, errorMessage);
    }
  });

  it('fails sToken.redeem bad amount', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const errorMessage = 'Strike [redeem] | Argument `amount` must be a string, number, or BigNumber.';
    try {
      const trx = await strike.redeem(Strike.sUSDC, null); // bad amount
    } catch (e) {
      assert.equal(e.message, errorMessage);
    }
  });

  it('runs sToken.borrow USDC', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const supplyEthTrx = await strike.supply(Strike.ETH, 2);
    await supplyEthTrx.wait(1);

    const enterEthMarket = await strike.enterMarkets(Strike.ETH);
    await enterEthMarket.wait(1);

    const trx = await strike.borrow(Strike.USDC, 5, { gasLimit: 600000 });
    const receipt = await trx.wait(1);

    const events = receipt.events.map(e => e.event);

    assert.equal(events.includes('AccrueInterest'), true, 'Missing event: AccrueInterest');
    assert.equal(events.includes('Borrow'), true, 'Missing event: Borrow');
    assert.equal(events.includes('Transfer'), true, 'Missing event: Transfer');
  });

  it('runs sToken.borrow ETH', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const supplyEthTrx = await strike.supply(Strike.ETH, 10);
    await supplyEthTrx.wait(1);

    const enterEthMarket = await strike.enterMarkets(Strike.ETH);
    await enterEthMarket.wait(1);

    const trx = await strike.borrow(Strike.ETH, 1, { gasLimit: 600000 });
    const receipt = await trx.wait(1);

    const events = receipt.events.map(e => e.event);

    assert.equal(events.includes('AccrueInterest'), true);
    assert.equal(events.includes('Borrow'), true);
  });

  it('fails sToken.borrow invalid asset', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const errorMessage = 'Strike [borrow] | Argument `asset` cannot be borrowed.';
    try {
      const trx = await strike.borrow('UUUU', 5); // invalid asset
    } catch (e) {
      assert.equal(e.message, errorMessage);
    }
  });

  it('fails sToken.borrow bad amount', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const errorMessage = 'Strike [borrow] | Argument `amount` must be a string, number, or BigNumber.';
    try {
      const trx = await strike.borrow(Strike.USDC, null); // bad amount
    } catch (e) {
      assert.equal(e.message, errorMessage);
    }
  });

  it('runs sToken.repayBorrow USDC', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const supplyEthTrx = await strike.supply(Strike.ETH, 2);
    await supplyEthTrx.wait(1);

    const enterEthMarket = await strike.enterMarkets(Strike.ETH);
    await enterEthMarket.wait(1);

    const borrowTrx = await strike.borrow(Strike.USDC, 5, { gasLimit: 600000 });
    await borrowTrx.wait(1);

    const trx = await strike.repayBorrow(Strike.USDC, 5, null, false, { gasLimit: 600000 });
    const receipt = await trx.wait(1);

    const numEvents = receipt.events.length;
    const events = receipt.events.map(e => e.event);

    const numEventsExpected = 4;

    assert.equal(numEvents, numEventsExpected);
    assert.equal(events.includes('AccrueInterest'), true);
    assert.equal(events.includes('RepayBorrow'), true);
    assert.equal(events.includes('Transfer'), true);
  });

  it('runs sToken.repayBorrow ETH', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const supplyEthTrx = await strike.supply(Strike.ETH, 10);
    await supplyEthTrx.wait(1);

    const enterEthMarket = await strike.enterMarkets(Strike.ETH);
    await enterEthMarket.wait(1);

    const borrowTrx = await strike.borrow(Strike.ETH, 1, { gasLimit: 600000 });
    await borrowTrx.wait(1);

    const trx = await strike.repayBorrow(Strike.ETH, 1, null, false, { gasLimit: 600000 });
    const receipt = await trx.wait(1);

    const numEvents = receipt.events.length;
    const events = receipt.events.map(e => e.event);

    const numEventsExpected = 3;

    assert.equal(numEvents, numEventsExpected);
    assert.equal(events.includes('AccrueInterest'), true);
    assert.equal(events.includes('RepayBorrow'), true);
  });

  it('runs sToken.repayBorrow behalf USDC', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const strike2 = new Strike(providerUrl, {
      privateKey: acc2.privateKey
    });

    const supplyEthTrx2 = await strike2.supply(Strike.ETH, 2);
    await supplyEthTrx2.wait(1);

    const enterEthMarket2 = await strike2.enterMarkets(Strike.ETH);
    await enterEthMarket2.wait(1);

    const borrowTrx2 = await strike2.borrow(Strike.USDC, 5, { gasLimit: 600000 });
    await borrowTrx2.wait(1);

    const supplyEthTrx = await strike.supply(Strike.ETH, 2);
    await supplyEthTrx.wait(1);

    const enterEthMarket = await strike.enterMarkets(Strike.ETH);
    await enterEthMarket.wait(1);

    const borrowTrx = await strike.borrow(Strike.USDC, 5, { gasLimit: 600000 });
    await borrowTrx.wait(1);

    // acc1 repays USDCborrow on behalf of acc2
    const trx = await strike.repayBorrow(Strike.USDC, 5, acc2.address, false, { gasLimit: 600000 });
    const receipt = await trx.wait(1);

    const numEvents = receipt.events.length;
    const events = receipt.events.map(e => e.event);
    const repayBorrowEvent = receipt.events.find(e => e.event === 'RepayBorrow');
    const payer = repayBorrowEvent.args[0].toLowerCase();
    const borrower = repayBorrowEvent.args[1].toLowerCase();

    const payerExpected = acc1.address.toLowerCase();
    const borrowerExpected = acc2.address.toLowerCase();
    const numEventsExpected = 4;

    assert.equal(payer, payerExpected);
    assert.equal(borrower, borrowerExpected);
    assert.equal(numEvents, numEventsExpected);
    assert.equal(events.includes('AccrueInterest'), true);
    assert.equal(events.includes('RepayBorrow'), true);
    assert.equal(events.includes('Transfer'), true);
  });

  it('runs sToken.repayBorrow behalf ETH', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const strike2 = new Strike(providerUrl, {
      privateKey: acc2.privateKey
    });

    const supplyEthTrx = await strike2.supply(Strike.ETH, 10);
    await supplyEthTrx.wait(1);

    const enterEthMarket = await strike2.enterMarkets(Strike.ETH);
    await enterEthMarket.wait(1);

    const borrowTrx = await strike2.borrow(Strike.ETH, 1, { gasLimit: 600000 });
    await borrowTrx.wait(1);

    const trx = await strike.repayBorrow(Strike.ETH, 1, acc2.address, false, { gasLimit: 600000 });
    const receipt = await trx.wait(1);

    const numEvents = receipt.events.length;
    const events = receipt.events.map(e => e.event);
    const repayBorrowEvent = receipt.events.find(e => e.event === 'RepayBorrow');
    const payer = repayBorrowEvent.args[0].toLowerCase();
    const borrower = repayBorrowEvent.args[1].toLowerCase();

    const payerExpected = acc1.address.toLowerCase();
    const borrowerExpected = acc2.address.toLowerCase();

    const numEventsExpected = 3;

    assert.equal(numEvents, numEventsExpected);
    assert.equal(events.includes('AccrueInterest'), true);
    assert.equal(events.includes('RepayBorrow'), true);
  });

  it('fails sToken.repayBorrow bad asset', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const errorMessage = 'Strike [repayBorrow] | Argument `asset` is not supported.';
    try {
      const trx = await strike.repayBorrow(null, 1, acc2.address, false); // bad asset
    } catch (e) {
      assert.equal(e.message, errorMessage);
    }
  });

  it('fails sToken.repayBorrow invalid asset', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const errorMessage = 'Strike [repayBorrow] | Argument `asset` is not supported.';
    try {
      const trx = await strike.repayBorrow('xxxx', 1, acc2.address, false); // invalid asset
    } catch (e) {
      assert.equal(e.message, errorMessage);
    }
  });

  it('fails sToken.repayBorrow bad amount', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const errorMessage = 'Strike [repayBorrow] | Argument `amount` must be a string, number, or BigNumber.';
    try {
      const trx = await strike.repayBorrow('USDC', null, acc2.address, false); // invalid asset
    } catch (e) {
      assert.equal(e.message, errorMessage);
    }
  });

  it('fails sToken.repayBorrow behalf address', async function () {
    const strike = new Strike(providerUrl, {
      privateKey: acc1.privateKey
    });

    const errorMessage = 'Strike [repayBorrow] | Invalid `borrower` address.';
    try {
      const trx = await strike.repayBorrow('USDC', 1, '0xbadaddress', false); // bad address
    } catch (e) {
      assert.equal(e.message, errorMessage);
    }
  });
}