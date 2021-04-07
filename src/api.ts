/**
 * @file API
 * @desc These methods facilitate HTTP requests to the Strike API.
 */

import { request } from './util';
import {
  APIRequest,
  APIResponse,
  AccountServiceRequest,
  STokenServiceRequest,
  MarketHistoryServiceRequest,
  GovernanceServiceRequest,
} from './types';

// import { version } from '../package.json';

// let userPlatform;

// try {
//   if (typeof document !== 'undefined') {
//     userPlatform = 'web';
//   } else if (
//     typeof navigator !== 'undefined' &&
//     navigator.product === 'ReactNative'
//   ) {
//     userPlatform = 'react-native';
//   } else if (
//     typeof navigator !== 'undefined' && 
//     navigator.userAgent.toLowerCase().indexOf('electron') > -1
//   ) {
//     userPlatform = 'electron-js';
//   } else {
//     userPlatform = 'node-js';
//   }
// } catch (e) {
//   userPlatform = 'unknown';
// }

/**
 * Makes a request to the AccountService API. The Account API retrieves
 *     information for various accounts which have interacted with the protocol.
 *     For more details, see the Strike API documentation.
 *
 * @param {object} options A JavaScript object of API request parameters.
 *
 * @returns {object} Returns the HTTP response body or error.
 *
 * @example
 *
 * ```
 * (async function() {
 *   const account = await Strike.api.account({
 *     "addresses": "0xB61C5971d9c0472befceFfbE662555B78284c307",
 *     "network": "ropsten"
 *   });
 * 
 *   let strkBorrowBalance = 0;
 *   if (Object.isExtensible(account) && account.accounts) {
 *     account.accounts.forEach((acc) => {
 *       acc.tokens.forEach((tok) => {
 *         if (tok.symbol === Strike.sSTRK) {
 *           strkBorrowBalance = +tok.borrow_balance_underlying.value;
 *         }
 *       });
 *     });
 *   }
 * 
 *   console.log('strkBorrowBalance', strkBorrowBalance);
 * })().catch(console.error);
 * ```
 */
// TODO -- this will be updated when api is ready
export function account(options: AccountServiceRequest): Promise<APIResponse> {
  return queryApi(options, 'account', '/api/v2/account');
}

/**
 * Makes a request to the STokenService API. The sToken API retrieves
 *     information about sToken contract interaction. For more details, see the 
 *     Strike API documentation.
 *
 * @param {object} options A JavaScript object of API request parameters.
 *
 * @returns {object} Returns the HTTP response body or error.
 *
 * @example
 *
 * ```
 * (async function() {
 *   const sStrkData = await Strike.api.sToken({
 *     "addresses": Strike.util.getAddress(Strike.sSTRK)
 *   });
 * 
 *   console.log('sStrkData', sStrkData); // JavaScript Object
 * })().catch(console.error);
 * ```
 */
export function sToken(options: STokenServiceRequest): Promise<APIResponse> {
  return queryApi(options, 'sToken', '/api/stoken');
}

/**
 * Makes a request to the MarketHistoryService API. The market history service
 *     retrieves information about a market. For more details, see the Strike
 *     API documentation.
 *
 * @param {object} options A JavaScript object of API request parameters.
 *
 * @returns {object} Returns the HTTP response body or error.
 *
 * @example
 *
 * ```
 * (async function() {
 *   const sUsdcMarketData = await Strike.api.marketHistory({
 *     "asset": Strike.util.getAddress(Strike.sUSDC),
 *     "min_block_timestamp": 1559339900,
 *     "max_block_timestamp": 1598320674,
 *     "num_buckets": 10,
 *   });
 * 
 *   console.log('sUsdcMarketData', sUsdcMarketData); // JavaScript Object
 * })().catch(console.error);
 * ```
 */
export function marketHistory(options: MarketHistoryServiceRequest): Promise<APIResponse> {
  // return queryApi(options, 'Market History', '/api/v2/market_history/graph');
  return queryApi(options, 'Market History', '/api/market_history/graph');
}

/**
 * Makes a request to the GovernanceService API. The Governance Service includes
 *     three endpoints to retrieve information about COMP accounts. For more 
 *     details, see the Strike API documentation.
 *
 * @param {object} options A JavaScript object of API request parameters.
 * @param {string} endpoint A string of the name of the corresponding governance
 *     service endpoint. Valid values are `proposals`, `voteReceipts`, or
 *     `accounts`.
 *
 * @returns {object} Returns the HTTP response body or error.
 *
 * @example
 *
 * ```
 * (async function() {
 *   const proposal = await Strike.api.governance(
 *     { "proposal_ids": [ 20 ] }, 'proposals'
 *   );
 * 
 *   console.log('proposal', proposal); // JavaScript Object
 * })().catch(console.error);
 * ```
 */
export function governance(options: GovernanceServiceRequest, endpoint: string): Promise<APIResponse> {
  if (endpoint === 'proposals') {
    // endpoint = '/api/v2/governance/proposals';
    endpoint = '/api/governance/proposals';
  } else if (endpoint === 'voteReceipts') {
    // endpoint = '/api/v2/governance/proposal_vote_receipts';
    endpoint = '/api/governance/proposal_vote_receipts';
  } else {
    // endpoint = '/api/v2/governance/accounts';
    endpoint = '/api/governance/accounts';
  }

  return queryApi(options, 'GovernanceService', endpoint);
}

function queryApi(options: APIRequest, name: string, path: string): Promise<APIResponse> {
  return new Promise((resolve, reject) => {
    const errorPrefix = `Strike [api] [${name}] | `;
    let responseCode, responseMessage;

    // TODO -- api service endpoint should be updated.
    let hostname = 'https://mainnetapi.strike.org';
    if (options && (options.network === 'ropsten')) hostname = 'https://testnetapi.strike.org';

    request({
      hostname,
      path,
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
        // 'strike-js': `[${version}]_[${userPlatform}]`,
      },
      body: options
    }).then((response) => {
      responseCode = response.status;
      responseMessage = response.statusText;

      const responseBody = JSON.parse(response.body);

      if (responseCode >= 200 && responseCode <= 299) {
        resolve(responseBody);
      } else {
        throw 'Invalid request made to the Strike API.';
      }
    }).catch((error) => {
      let errorMessage = '';

      if (error.name === 'SyntaxError') {
        errorMessage = errorPrefix + `Unable to parse response body.`;
      } else {
        errorMessage = errorPrefix + error.toString();
      }

      reject({ error: errorMessage, responseCode, responseMessage });
    });
  });
}
