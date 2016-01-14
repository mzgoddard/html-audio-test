'use strict';

import { crc32 } from 'crc';
import Promise from 'bluebird';

export let tests = [];

let State = {
  PENDING: 'pending',
  SKIPPED: 'skipped',
  RUNNING: 'running',
  PASSED: 'passed',
  FAILED: 'failed',
};

class Test {
  constructor(name, skipIf, fn) {
    if (typeof fn === 'undefined' && skipIf && !skipIf.run) {
      fn = skipIf;
      skipIf = null;
    }

    this.name = name;
    this.skipIf = skipIf;
    this.fn = fn;

    this.key = crc32(this.name).toString(16);
    this.state = State.PENDING;
    this._cachedRun = null;
  }

  _run() {
    if (this._cachedRun) {
      return this._cachedRun;
    }

    if (!this.fn) {
      this.state = State.FAILED;
      this._cachedRun = Promise.reject(new Error(`'${this.name}' does not have a defined test`));
      return this._cachedRun;
    }

    this.state = State.RUNNING;
    this._cachedRun = new Promise((resolve, reject) => {
      let thenable = this.fn();
      if (thenable && thenable.then) {
        return thenable.then(resolve, reject);
      }
      resolve();
    })
    .then(() => { this.state = State.PASSED; })
    .catch(error => {
      this.error = error;
      this.state = State.FAILED;
      console.error(error || error.stack);
    });
    return this._cachedRun;
  }

  run() {
    if (this.skipIf) {
      return this.skipIf.run()
      .then(() => {
        if (this.skipIf.state !== State.FAILED) {
          this.state = State.SKIPPED;
        }
        else {
          return this._run();
        }
      });
    }
    return this._run();
  }

  reset() {
    this._cachedRun = null;
    this.state = State.PENDING;
  }
}

export function test(...args) {
  let t = new Test(...args);
  tests.push(t);
  return t;
}
