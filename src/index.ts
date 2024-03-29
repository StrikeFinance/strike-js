/**
 * @file Strike
 * @desc This file defines the constructor of the `Strike` class.
 * @hidden
 */

import { ethers } from 'ethers';
import * as eth from './eth';
import * as util from './util';
import * as comptroller from './comptroller';
import * as sToken from './sToken';
import * as priceFeed from './priceFeed';
import * as strk from './strk';
import * as gov from './gov';
import * as api from './api';
import { constants, decimals } from './constants';
import { Provider, StrikeOptions, StrikeInstance } from './types';

// Turn off Ethers.js warnings
ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR);

/**
 * Creates an instance of the Strike.js SDK.
 *
 * @param {Provider | string} [provider] Optional Ethereum network provider.
 *     Defaults to Ethers.js fallback mainnet provider.
 * @param {object} [options] Optional provider options.
 *
 * @example
 * ```
 * var strike = new Strike(window.ethereum); // web browser
 * 
 * var strike = new Strike('http://127.0.0.1:8545'); // HTTP provider
 * 
 * var strike = new Strike(); // Uses Ethers.js fallback mainnet (for testing only)
 * 
 * var strike = new Strike('ropsten'); // Uses Ethers.js fallback (for testing only)
 * 
 * // Init with private key (server side)
 * var strike = new Strike('https://mainnet.infura.io/v3/_your_project_id_', {
 *   privateKey: '0x_your_private_key_', // preferably with environment variable
 * });
 * 
 * // Init with HD mnemonic (server side)
 * var strike = new Strike('mainnet' {
 *   mnemonic: 'clutch captain shoe...', // preferably with environment variable
 * });
 * ```
 *
 * @returns {object} Returns an instance of the Strike.js SDK.
 */
const Strike = function(
  provider: Provider | string = 'mainnet', options: StrikeOptions = {}
) : StrikeInstance {
  const originalProvider = provider;

  options.provider = provider || options.provider;
  provider = eth._createProvider(options);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instance: any = {
    _originalProvider: originalProvider,
    _provider: provider,
    ...comptroller,
    ...sToken,
    ...priceFeed,
    ...gov,
    claimStrike: strk.claimStrike,
    delegate: strk.delegate,
    delegateBySig: strk.delegateBySig,
    createDelegateSignature: strk.createDelegateSignature,
  };

  // Instance needs to know which network the provider connects to, so it can
  //     use the correct contract addresses.
  instance._networkPromise = eth.getProviderNetwork(provider).then((network) => {
    delete instance._networkPromise;
    instance._network = network;
  });

  return instance;
};

Strike.eth = eth;
Strike.api = api;
Strike.util = util;
Strike._ethers = ethers;
Strike.decimals = decimals;
Strike.strk = {
  getStrikeBalance: strk.getStrikeBalance,
  getStrikeAccrued: strk.getStrikeAccrued,
};
Object.assign(Strike, constants);

export = Strike;
