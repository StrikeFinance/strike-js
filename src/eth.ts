/**
 * @file Ethereum
 * @desc These methods facilitate interactions with the Ethereum blockchain.
 */

import { ethers } from 'ethers';
import { AbiItem, CallOptions, Provider, ProviderNetwork } from './types';

enum JsonRpc {
  EthSendTransaction,
  EthCall,
  // NetVersion,
}

/**
 * This is a generic method for invoking JSON RPC's `eth_call` or `eth_send` 
 *     with Ethers.js. This function supports the public `read` and `trx`
 *     methods in this module.
 *
 * @param {boolean} isWrite True for `eth_send` and false for `eth_call`.
 * @param {string} address The Ethereum address the transaction is directed to.
 * @param {string} method The smart contract member in which to invoke.
 * @param {any[]} [parameters] Parameters of the method to invoke.
 * @param {CallOptions} [options] Options to set for `eth_call`, optional ABI
 *     (as JSON object), and Ethers.js method overrides. The ABI can be a string
 *     of the single intended method, an array of many methods, or a JSON object
 *     of the ABI generated by a Solidity compiler.
 *
 * @hidden
 *
 * @returns {Promise<any>} Return value of the invoked smart contract member 
 *     or an error object if the call failed.
 */
function _ethJsonRpc(
  jsonRpcMethod: JsonRpc,
  address: string,
  method: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters: any[] = [],
  options: CallOptions = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Promise<any>((resolve, reject) => {
    const provider = options._strikeProvider || _createProvider(options);

    const overrides = {
      gasPrice: options.gasPrice,
      nonce: options.nonce,
      value: options.value,
      chainId: options.chainId,
      from: options.from,
      gasLimit: options.gasLimit,
      blockTag: options.blockTag,
    };

    parameters.push(overrides);

    let contract;
    let abi: string | string[] | AbiItem[];
    if (options.abi) {
      // Assumes `method` is a string of the member name
      // Assumes `abi` is a JSON object
      abi = options.abi;
      contract = new ethers.Contract(address, abi, provider);
    } else {
      // Assumes `method` is a string of the member definition
      abi = [ method ];
      contract = new ethers.Contract(address, abi, provider);
      method = Object.keys(contract.functions)[1];
    }

    if (jsonRpcMethod === JsonRpc.EthSendTransaction) {
      contract[method].apply(null, parameters).then((result) => {
        resolve(result);
      }).catch((error) => {
        try { delete parameters[parameters.length-1].privateKey } catch(e) {}
        try { delete parameters[parameters.length-1].mnemonic   } catch(e) {}
        reject({
          message: 'Error occurred during [eth_sendTransaction]. See {error}.',
          error,
          method,
          parameters,
        });
      });
    } else if (jsonRpcMethod === JsonRpc.EthCall) {
      contract.callStatic[method].apply(null, parameters).then((result) => {
        resolve(result);
      }).catch((error) => {
        try { delete parameters[parameters.length-1].privateKey } catch(e) {}
        try { delete parameters[parameters.length-1].mnemonic   } catch(e) {}
        reject({
          message: 'Error occurred during [eth_call]. See {error}.',
          error,
          method,
          parameters,
        });
      });
    }
  });
}

/**
 * This is a generic method for invoking JSON RPC's `eth_call` with Ethers.js. 
 *     Use this method to execute a smart contract's constant or non-constant 
 *     member without using gas. This is a read-only method intended to read a 
 *     value or test a transaction for valid parameters. It does not create a 
 *     transaction on the block chain.
 *
 * @param {string} address The Ethereum address the transaction is directed to.
 * @param {string} method The smart contract member in which to invoke.
 * @param {any[]} [parameters] Parameters of the method to invoke.
 * @param {CallOptions} [options] Options to set for `eth_call`, optional ABI
 *     (as JSON object), and Ethers.js method overrides. The ABI can be a string
 *     of the single intended method, an array of many methods, or a JSON object
 *     of the ABI generated by a Solidity compiler.
 *
 * @returns {Promise<any>} Return value of the invoked smart contract member or an error 
 *     object if the call failed.
 *
 * @example
 * ```
 * const sEthAddress = Strike.util.getAddress(Strike.sETH);
 * 
 * (async function() {
 * 
 *   const srpb = await Strike.eth.read(
 *     sEthAddress,
 *     'function supplyRatePerBlock() returns (uint256)',
 *     // [], // [optional] parameters
 *     // {}  // [optional] call options, provider, network, plus Ethers.js "overrides"
 *   );
 * 
 *   console.log('sETH market supply rate per block:', srpb.toString());
 * 
 * })().catch(console.error);
 * ```
 */
export function read(
  address: string,
  method: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters: any[] = [],
  options: CallOptions = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) : Promise<any> {
  return _ethJsonRpc(JsonRpc.EthCall, address, method, parameters, options);
}

/**
 * This is a generic method for invoking JSON RPC's `eth_sendTransaction` with 
 *     Ethers.js. Use this method to create a transaction that invokes a smart 
 *     contract method. Returns an Ethers.js `TransactionResponse` object.
 *
 * @param {string} address The Ethereum address the transaction is directed to.
 * @param {string} method The smart contract member in which to invoke.
 * @param {any[]} [parameters] Parameters of the method to invoke.
 * @param {CallOptions} [options] Options to set for `eth_sendTransaction`, 
 *     (as JSON object), and Ethers.js method overrides. The ABI can be a string
 *     optional ABI of the single intended method, an array of many methods, or 
 *     a JSON object of the ABI generated by a Solidity compiler.
 *
 * @returns {Promise<any>} Returns an Ethers.js `TransactionResponse` object or an error 
 *     object if the transaction failed.
 *
 * @example
 * ```
 * const oneEthInWei = '1000000000000000000';
 * const sEthAddress = '0xbEe9Cf658702527b0AcB2719c1FAA29EdC006a92';
 * const provider = window.ethereum;
 * 
 * (async function() {
 *   console.log('Supplying ETH to the Strike Protocol...');
 * 
 *   // Mint some sETH by supplying ETH to the Strike Protocol
 *   const trx = await Strike.eth.trx(
 *     sEthAddress,
 *     'function mint() payable',
 *     [],
 *     {
 *       provider,
 *       value: oneEthInWei
 *     }
 *   );
 * 
 *   // const result = await trx.wait(1); // JSON object of trx info, once mined
 * 
 *   console.log('Ethers.js transaction object', trx);
 * })().catch(console.error);
 * ```
 */
export function trx(
  address: string,
  method: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters: any[] = [],
  options: CallOptions = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) : Promise<any> {
  return _ethJsonRpc(JsonRpc.EthSendTransaction, address, method, parameters, options);
}

/**
 * This helps the Strike.js constructor discover which Ethereum network the
 *     developer wants to use.
 *
 * @param {Provider | string} [provider] Optional Ethereum network provider.
 *     Defaults to Ethers.js fallback mainnet provider.
 *
 * @hidden
 *
 * @returns {object} Returns a metadata object containing the Ethereum network
 *     name and ID.
 */
export async function getProviderNetwork(
  provider: Provider
) : Promise<ProviderNetwork> {
  let _provider;
  if (provider._isSigner) {
    _provider = provider.provider;
  } else {
    _provider = provider;
  }

  let networkId;
  if (_provider.send) {
    networkId = await _provider.send('net_version');
  } else {
    networkId = _provider._network.chainId;
  }

  networkId = isNaN(networkId) ? 0 : +networkId;

  const network = ethers.providers.getNetwork(networkId) || { name: 'unknown' };

  return {
    id: networkId,
    name: network.name === 'homestead' ? 'mainnet' : network.name
  };
}

/**
 * Fetches the current Ether balance of a provided Ethereum address.
 *
 * @param {string} address The Ethereum address in which to get the ETH balance.
 * @param {Provider | string} [provider] Optional Ethereum network provider.
 *     Defaults to Ethers.js fallback mainnet provider.
 *
 * @returns {BigNumber} Returns a BigNumber hexadecimal value of the ETH balance
 *     of the address.
 *
 * @example
 * ```
 * (async function () {
 * 
 *   balance = await Strike.eth.getBalance(myAddress, provider);
 *   console.log('My ETH Balance', +balance);
 * 
 * })().catch(console.error);
 * ```
 */
export async function getBalance(
  address: string,
  provider: Provider | string
) : Promise<string> {
  let _provider;
  if (typeof provider === 'object' && provider._isSigner) {
    _provider = provider.provider;
  } else {
    _provider = provider;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let providerInstance: any = _createProvider({ provider: _provider });

  if (!providerInstance.send && providerInstance.providerConfigs) {
    const url = providerInstance.providerConfigs[0].provider.connection.url;
    providerInstance = new ethers.providers.JsonRpcProvider(url);
  } else if (!providerInstance.send && providerInstance.provider) {
    providerInstance = providerInstance.provider;
  }

  const balance = await providerInstance.send(
    'eth_getBalance', [ address, 'latest' ]
  );
  return balance;
}

/**
 * Creates an Ethereum network provider object.
 *
 * @param {CallOptions} options The call options of a pending Ethereum
 *     transaction.
 *
 * @hidden
 *
 * @returns {object} Returns a valid Ethereum network provider object.
 */
export function _createProvider(options: CallOptions = {}) : Provider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let provider: any = options.provider || (options.network || 'mainnet');
  const isADefaultProvider = !!ethers.providers.getNetwork(provider.toString());

  const isObject = typeof provider === 'object';

  // User passed an ethers.js provider/signer/wallet object
  if (isObject && (provider._isSigner || provider._isProvider)) {
    return provider;
  }

  // Create an ethers provider, web3s can sign
  if (isADefaultProvider) {
    provider = ethers.getDefaultProvider(provider);
  } else if (isObject) {
    provider = new ethers.providers.Web3Provider(provider).getSigner();
  } else {
    provider = new ethers.providers.JsonRpcProvider(provider);
  }

  // Add an explicit signer
  if (options.privateKey) {
    provider = new ethers.Wallet(options.privateKey, provider);
  } else if (options.mnemonic) {
    provider = new ethers.Wallet(ethers.Wallet.fromMnemonic(options.mnemonic), provider);
  }

  return provider;
}
