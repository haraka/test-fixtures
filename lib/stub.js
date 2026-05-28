/**
 * Creates a stub function that records calls.
 *
 * Properties on the returned stub:
 *   .called    {boolean}  true after the first call
 *   .callCount {number}   number of times called
 *   .calls     {Array}    each element is an Array of arguments from one call
 *   .args      {Array}    arguments from the most recent call (undefined if never called)
 *   .thisArg   {*}        `this` from the most recent call
 *   .reset()              resets all tracking state
 *
 * @param {*} [returnValue] - value the stub returns when called
 */
exports.stub = function (returnValue) {
  function stub(...args) {
    stub.called = true
    stub.callCount++
    stub.calls.push(args)
    stub.args = args
    stub.thisArg = this
    return returnValue
  }

  stub.reset = function () {
    stub.called = false
    stub.callCount = 0
    stub.calls = []
    stub.args = undefined
    stub.thisArg = undefined
  }

  stub.reset()
  return stub
}
