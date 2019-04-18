/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

'use strict';
const shim = require('fabric-shim');
const util = require('util');

let Chaincode = class {

  // The Init method is called when the Smart Contract 'fabcar' is instantiated by the blockchain network
  // Best practice is to have any Ledger initialization in separate function -- see initLedger()
  async Init(stub) {
    console.info('=========== Instantiated obcs_cc_sample chaincode ===========');
    return shim.success();
  }

  // The Invoke method is called as a result of an application request to run the Smart Contract
  // 'fabcar'. The calling application program has also specified the particular smart contract
  // function to be called, with arguments
  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);

    let method = this[ret.fcn];
    if (!method) {
      console.error('no function of name:' + ret.fcn + ' found');
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async queryHuman(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting HumanNumber ex: HUMAN01');
    }
    let humanNumber = args[0];

    let humanAsBytes = await stub.getState(humanNumber);
    if (!humanAsBytes || humanAsBytes.toString().length <= 0) {
      throw new Error(humanNumber + ' does not exist: ');
    }
    console.log(humanAsBytes.toString());
    return humanAsBytes;
  }

  async initLedger(stub, args) {
    console.info('============= START : Initialize Ledger ===========');
    let human = [];
    human.push({
      name: 'Tanaka',
      birthday: '19900101'
    });
    human.push({
      name: 'Yamada',
      birthday: '19800401'
    });

    for (let i = 0; i < human.length; i++) {
      human[i].docType = 'human';
      await stub.putState('Human' + i, Buffer.from(JSON.stringify(human[i])));
      console.info('Added <--> ', human[i]);
    }
    console.info('============= END : Initialize Ledger ===========');
  }

  async createHuman(stub, args) {
    console.info('============= START : Create Human ===========');
    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3');
    }

    var human = {
      docType: 'human',
      name: args[1],
      birthday: args[2]
    };

    await stub.putState(args[0], Buffer.from(JSON.stringify(human)));
    console.info('============= END : Create Human ===========');
  }

  async queryAllHuman(stub, args) {

    let startKey = 'Human0';
    let endKey = 'Human999';

    let iterator = await stub.getStateByRange(startKey, endKey);

    let allResults = [];
    while (true) {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        jsonRes.Key = res.value.key;
        try {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toString('utf8');
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return Buffer.from(JSON.stringify(allResults));
      }
    }
  }

  async changeHumanName(stub, args) {
    console.info('============= START : changeCHumanName ===========');
    if (args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }

    let humanAsBytes = await stub.getState(args[0]);
    let human = JSON.parse(humanAsBytes);
    human.name = args[1];

    await stub.putState(args[0], Buffer.from(JSON.stringify(human)));
    console.info('============= END : changeCHumanName ===========');
  }
};

shim.start(new Chaincode());
