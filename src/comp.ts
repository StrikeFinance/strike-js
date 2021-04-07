/**
 * @file COMP
 * @desc These methods facilitate interactions with the COMP token smart
 *     contract.
 */

import { ethers } from 'ethers';
import * as eth from './eth';
import { netId } from './helpers';
import { address, abi } from './constants';
import { sign } from './EIP712';
import {
  CallOptions,
  TrxResponse,
  Signature,
  EIP712Domain,
  DelegateTypes,
  DelegateSignatureMessage,
  Provider,
} from './types';

const keccak256 = ethers.utils.keccak256;

/**
 * Applies the EIP-55 checksum to an Ethereum address.
 *
 * @param {string} _address The Ethereum address to apply the checksum.
 *
 * @returns {string} Returns a string of the Ethereum address.
 */
function toChecksumAddress(_address) {
  const chars = _address.toLowerCase().substring(2).split('');
  const expanded = new Uint8Array(40);

  for (let i = 0; i < 40; i++) {
    expanded[i] = chars[i].charCodeAt(0);
  }

  const hash = keccak256(expanded);
  let ret = '';

  for (let i = 0; i < _address.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += _address[i].toUpperCase();
    } else {
      ret += _address[i];
    }
  }

  return ret;
}

/**
 * Get the balance of STRIKE tokens held by an address.
 *
 * @param {string} _address The address in which to find the STRIKE balance.
 * @param {Provider | string} [_provider] An Ethers.js provider or valid network
 *     name string.
 *
 * @returns {string} Returns a string of the numeric balance of STRIKE. The value
 *     is scaled up by 18 decimal places.
 *
 * @example
 *
 * ```
 * (async function () {
 *   const bal = await Strike.strike.getStrikeBalance('0x2775b1c75658Be0F640272CCb8c72ac986009e38');
 *   console.log('Balance', bal);
 * })().catch(console.error);
 * ```
 */
export async function getStrikeBalance(
  _address: string,
  _provider : Provider | string='mainnet'
) : Promise<string> {
  const provider = await eth._createProvider({ provider: _provider });
  const net = await eth.getProviderNetwork(provider);

  const errorPrefix = 'Strike [getStrikeBalance] | ';

  if (typeof _address !== 'string') {
    throw Error(errorPrefix + 'Argument `_address` must be a string.');
  }

  try {
    _address = toChecksumAddress(_address);
  } catch(e) {
    throw Error(errorPrefix + 'Argument `_address` must be a valid Ethereum address.');
  }

  const compAddress = address[net.name].STRK;
  const parameters = [ _address ];
  const trxOptions: CallOptions = {
    _compoundProvider: provider,
    abi: abi.STRK,
  };

  const result = await eth.read(compAddress, 'balanceOf', parameters, trxOptions);
  return result.toString();
}

/**
 * Get the amount of STRIKE tokens accrued but not yet claimed by an address.
 *
 * @param {string} _address The address in which to find the STRIKE accrued.
 * @param {Provider | string} [_provider] An Ethers.js provider or valid network
 *     name string.
 *
 * @returns {string} Returns a string of the numeric accruement of STRIKE. The
 *     value is scaled up by 18 decimal places.
 *
 * @example
 *
 * ```
 * (async function () {
 *   const acc = await Strike.strike.getStrikeAccrued('0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5');
 *   console.log('Accrued', acc);
 * })().catch(console.error);
 * ```
 */
export async function getStrikeAccrued(
  _address: string,
  _provider : Provider | string='mainnet'
) : Promise<string> {
  const provider = await eth._createProvider({ provider: _provider });
  const net = await eth.getProviderNetwork(provider);

  const errorPrefix = 'Strike [getStrikeAccrued] | ';

  if (typeof _address !== 'string') {
    throw Error(errorPrefix + 'Argument `_address` must be a string.');
  }

  try {
    _address = toChecksumAddress(_address);
  } catch(e) {
    throw Error(errorPrefix + 'Argument `_address` must be a valid Ethereum address.');
  }

  const lensAddress = address[net.name].CompoundLens;
  const compAddress = address[net.name].STRK;
  const comptrollerAddress = address[net.name].Comptroller;
  const parameters = [ compAddress, comptrollerAddress, _address ];
  const trxOptions: CallOptions = {
    _compoundProvider: provider,
    abi: abi.CompoundLens,
  };

  const result = await eth.read(lensAddress, 'getStrikeBalanceMetadataExt', parameters, trxOptions);
  return result.allocated.toString();
}

/**
 * Create a transaction to claim accrued STRIKE tokens for the user.
 *
 * @param {CallOptions} [options] Options to set for a transaction and Ethers.js
 *     method overrides.
 *
 * @returns {object} Returns an Ethers.js transaction object of the vote
 *     transaction.
 *
 * @example
 *
 * ```
 * const strike = new Strike(window.ethereum);
 * 
 * (async function() {
 * 
 *   console.log('Claiming Strike...');
 *   const trx = await strike.claimStrike();
 *   console.log('Ethers.js transaction object', trx);
 * 
 * })().catch(console.error);
 * ```
 */
export async function claimStrike(
  options: CallOptions = {}
) : Promise<TrxResponse> {
  await netId(this);

  try {
    let userAddress = this._provider.address;
    if (!userAddress && this._provider.getAddress) {
      userAddress = await this._provider.getAddress();
    }

    const comptrollerAddress = address[this._network.name].Comptroller;
    const trxOptions: CallOptions = {
      ...options,
      _compoundProvider: this._provider,
      abi: abi.Comptroller,
    };
    const parameters = [ userAddress ];
    const method = 'claimStrike(address)';

    return eth.trx(comptrollerAddress, method, parameters, trxOptions);
  } catch(e) {
    const errorPrefix = 'Strike [claimStrike] | ';
    e.message = errorPrefix + e.message;
    return e;
  }
}

/**
 * Create a transaction to delegate Strike Governance voting rights to an
 *     address.
 *
 * @param {string} _address The address in which to delegate voting rights to.
 * @param {CallOptions} [options] Options to set for `eth_call`, optional ABI
 *     (as JSON object), and Ethers.js method overrides. The ABI can be a string
 *     of the single intended method, an array of many methods, or a JSON object
 *     of the ABI generated by a Solidity compiler.
 *
 * @returns {object} Returns an Ethers.js transaction object of the vote
 *     transaction.
 *
 * @example
 *
 * ```
 * const strike = new Strike(window.ethereum);
 * 
 * (async function() {
 *   const delegateTx = await strike.delegate('0xa0df350d2637096571F7A701CBc1C5fdE30dF76A');
 *   console.log('Ethers.js transaction object', delegateTx);
 * })().catch(console.error);
 * ```
 */
export async function delegate(
  _address: string,
  options: CallOptions = {}
) : Promise<TrxResponse> {
  await netId(this);

  const errorPrefix = 'Strike [delegate] | ';

  if (typeof _address !== 'string') {
    throw Error(errorPrefix + 'Argument `_address` must be a string.');
  }

  try {
    _address = toChecksumAddress(_address);
  } catch(e) {
    throw Error(errorPrefix + 'Argument `_address` must be a valid Ethereum address.');
  }

  const compAddress = address[this._network.name].STRK;
  const trxOptions: CallOptions = {
    ...options,
    _compoundProvider: this._provider,
    abi: abi.STRK,
  };
  const parameters = [ _address ];
  const method = 'delegate(address)';

  return eth.trx(compAddress, method, parameters, trxOptions);
}

/**
 * Delegate voting rights in Strike Governance using an EIP-712 signature.
 *
 * @param {string} _address The address to delegate the user's voting rights to.
 * @param {number} nonce The contract state required to match the signature.
 *     This can be retrieved from the STRIKE contract's public nonces mapping.
 * @param {number} expiry The time at which to expire the signature. A block 
 *     timestamp as seconds since the unix epoch.
 * @param {object} signature An object that contains the v, r, and, s values of
 *     an EIP-712 signature.
 * @param {CallOptions} [options] Options to set for `eth_call`, optional ABI
 *     (as JSON object), and Ethers.js method overrides. The ABI can be a string
 *     of the single intended method, an array of many methods, or a JSON object
 *     of the ABI generated by a Solidity compiler.
 *
 * @returns {object} Returns an Ethers.js transaction object of the vote
 *     transaction.
 *
 * @example
 *
 * ```
 * const strike = new Strike(window.ethereum);
 * 
 * (async function() {
 *   const delegateTx = await strike.delegateBySig(
 *     '0xa0df350d2637096571F7A701CBc1C5fdE30dF76A',
 *     42,
 *     9999999999,
 *     {
 *       v: '0x1b',
 *       r: '0x130dbca2fafa07424c033b4479687cc1deeb65f08809e3ab397988cc4c6f2e78',
 *       s: '0x1debeb8250262f23906b1177161f0c7c9aa3641e8bff5b6f5c88a6bb78d5d8cd'
 *     }
 *   );
 *   console.log('Ethers.js transaction object', delegateTx);
 * })().catch(console.error);
 * ```
 */
export async function delegateBySig(
  _address: string,
  nonce: number,
  expiry: number,
  signature: Signature = { v: '', r: '', s: '' },
  options: CallOptions = {}
) : Promise<TrxResponse> {
  await netId(this);

  const errorPrefix = 'Strike [delegateBySig] | ';

  if (typeof _address !== 'string') {
    throw Error(errorPrefix + 'Argument `_address` must be a string.');
  }

  try {
    _address = toChecksumAddress(_address);
  } catch(e) {
    throw Error(errorPrefix + 'Argument `_address` must be a valid Ethereum address.');
  }

  if (typeof nonce !== 'number') {
    throw Error(errorPrefix + 'Argument `nonce` must be an integer.');
  }

  if (typeof expiry !== 'number') {
    throw Error(errorPrefix + 'Argument `expiry` must be an integer.');
  }

  if (
    !Object.isExtensible(signature) ||
    !signature.v ||
    !signature.r ||
    !signature.s
  ) {
    throw Error(errorPrefix + 'Argument `signature` must be an object that ' + 
      'contains the v, r, and s pieces of an EIP-712 signature.');
  }

  const compAddress = address[this._network.name].STRK;
  const trxOptions: CallOptions = {
    ...options,
    _compoundProvider: this._provider,
    abi: abi.STRK,
  };
  const { v, r, s } = signature;
  const parameters = [ _address, nonce, expiry, v, r, s ];
  const method = 'delegateBySig';

  return eth.trx(compAddress, method, parameters, trxOptions);
}

/**
 * Create a delegate signature for Strike Governance using EIP-712. The
 *     signature can be created without burning gas. Anyone can post it to the
 *     blockchain using the `delegateBySig` method, which does have gas costs.
 *
 * @param {string} delegatee The address to delegate the user's voting rights
 *     to.
 * @param {number} [expiry] The time at which to expire the signature. A block 
 *     timestamp as seconds since the unix epoch. Defaults to `10e9`.
 *
 * @returns {object} Returns an object that contains the `v`, `r`, and `s` 
 *     components of an Ethereum signature as hexadecimal strings.
 *
 * @example
 *
 * ```
 * const strike = new Strike(window.ethereum);
 *
 * (async () => {
 *
 *   const delegateSignature = await strike.createDelegateSignature('0xa0df350d2637096571F7A701CBc1C5fdE30dF76A');
 *   console.log('delegateSignature', delegateSignature);
 *
 * })().catch(console.error);
 * ```
 */
export async function createDelegateSignature(
  delegatee: string,
  expiry = 10e9
) : Promise<Signature> {
  await netId(this);

  const provider = this._provider;
  const compAddress = address[this._network.name].STRK;
  const chainId = this._network.id;
  let userAddress = this._provider.address;

  if (!userAddress && this._provider.getAddress) {
    userAddress = await this._provider.getAddress();
  }

  const originalProvider = this._originalProvider;

  const nonce = +(await eth.read(
    compAddress,
    'function nonces(address) returns (uint)',
    [ userAddress ],
    { provider: originalProvider }
  )).toString();

  const domain: EIP712Domain = {
    name: 'Compound',
    chainId,
    verifyingContract: compAddress
  };

  const primaryType = 'Delegation';

  const message: DelegateSignatureMessage = { delegatee, nonce, expiry };

  const types: DelegateTypes = {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Delegation: [
      { name: 'delegatee', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'expiry', type: 'uint256' }
    ]
  };

  const signer = provider.getSigner ? provider.getSigner() : provider;

  const signature = await sign(domain, primaryType, message, types, signer);

  return signature;
}
