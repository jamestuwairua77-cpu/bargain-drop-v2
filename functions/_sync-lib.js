// Pinned-key CJ webhook registration: webhook topic enablement and product
// subscription are PER-ACCOUNT state, so BOTH calls must hit the SAME CJ key.
// Iterates keys; for each, enables topics then subscribes, both on that key.
// Returns { ok, code, message, data, keyIndex } for the first key that fully
// succeeds (or the last error if none succeed).
const cjThrottle = () => new Promise((res) => setTimeout(res, 1300)); // CJ QPS ~1/s