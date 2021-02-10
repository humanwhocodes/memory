# Memory utility

by [Nicholas C. Zakas](https://humanwhocodes.com)

If you find this useful, please consider supporting my work with a [donation](https://humanwhocodes.com/donate).

## Description

A JavaScript implementation of dynamic memory using an `ArrayBuffer` as the memory storage.

**Warning:** Very experimental right now. May or may not be useful.

## Usage

### Node.js

Install using [npm][npm] or [yarn][yarn]:

```
npm install @humanwhocodes/memory --save

# or

yarn add @humanwhocodes/memory
```

Import into your Node.js project:

```js
// CommonJS
const { Memory } = require("@humanwhocodes/memory");

// ESM
import { Memory } from "@humanwhocodes/memory";
```

### Deno

Import into your Deno project:

```js
import { Memory } from "https://cdn.skypack.dev/@humanwhocodes/memory?dts";
```

### Browser

It's recommended to import the minified version to save bandwidth:

```js
import { Memory } from "https://cdn.skypack.dev/@humanwhocodes/memory?min";
```

However, you can also import the unminified version for debugging purposes:

```js
import { Memory } from "https://cdn.skypack.dev/@humanwhocodes/memory";
```

## API

After importing, create a new instance of `Memory` and pass in an `ArrayBuffer` to represent your memory:

```js
const memory = new Memory(new ArrayBuffer(64));

// allocate 4 bytes
const address = memory.allocate(4);

// address is 0 if no memory could be allocated
if (address) {

    // write some data into that address - must be a typed array
    memory.write(address, new Uint8Array([1, 2, 3, 4]));

    // read the data back out - returns a Uint8Array
    const data = memory.read(address);

    // free up the mory
    memory.free(address);

} else {
    console.error("Could not allocate memory.");
}
```

## Safety

The `Memory` class provides safeguards to ensure you aren't accidentally writing or reading data where you shouldn't:

1. `allocate()` returns `0` when no more memory can be allocated, allowing you to handle out-of-memory issues gracefully.
1. `write()` throws an error when:
    1. You try to write to address `0`.
    1. You try to write to an unallocated address.
    1. The data you're writing is larger than the allocated space.
1. `read()` throws an error if you attempt to read from an invalid address.
1. `free()` throws an error if you attempt to free an invalid address.

All of this is to say, it should be difficult to accidentally overwrite memory locations.

## Developer Setup

1. Fork the repository
2. Clone your fork
3. Run `npm install` to setup dependencies
4. Run `npm test` to run tests

## License

Apache 2.0

[npm]: https://npmjs.com/
[yarn]: https://yarnpkg.com/
