/**
 * @fileoverview Implicit Free List implementation
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { ImplicitFreeList } from "./implicit-free-list.js";

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * @typedef {Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array} TypedArray;
 */

//-----------------------------------------------------------------------------
// Memory
//-----------------------------------------------------------------------------

const list = Symbol("list");

/**
 * Represents a map of memory in an ArrayBuffer.
 */
export class Memory {
    
    /**
     * Creates a new instance.
     * @param {ArrayBuffer} buffer The ArrayBuffer to use as memory. 
     * @param {number} [byteOffset=0] The starting byte offset in the buffer for
     *      memory.
     * @param {number} [byteLength=buffer.length] The total number of bytes
     *      available in the memory.
     */
    constructor(buffer, byteOffset = 0, byteLength = buffer.byteLength) {
  
        /**
         * The buffer used as the source of bytes.
         * @property buffer
         * @type ArrayBuffer
         */
        this.buffer = buffer;

        /**
         * The starting offset to use in the buffer.
         * @property buffer
         * @type ArrayBuffer
         */
        this.byteOffset = byteOffset;

        /**
         * The number of bytes to use in the buffer.
         * @property buffer
         * @type ArrayBuffer
         */
        this.byteLength = byteLength;

        /**
         * The free list used to manage space.
         * @property list
         * @type ImplicitFreeList
         */
        this[list] = new ImplicitFreeList(buffer, byteOffset, byteLength);

        // lock everything down
        Object.defineProperties(this, {
            buffer: {
                writable: false,
                configurable: false
            },
            byteOffset: {
                writable: false,
                configurable: false
            },
            byteLength: {
                writable: false,
                configurable: false
            },
            [list]: {
                writable: false,
                configurable: false
            }
        });
    }

    /**
     * Allocates the given number of bytes in memory. This uses the first-fit
     * algorithm to locate the available space.
     * @param {number} byteCount The total number of bytes to allocate. 
     * @returns {number} The address where the bytes were allocated.
     * @throws {Error} If there are not enough free bytes to allocate.
     */
    allocate(byteCount) {
        return this[list].allocate(byteCount);
    }

    /**
     * Frees the given memory address. 
     * @param {number} address The memory address to free.
     * @returns {void}
     * @throws {Error} If address is invalid. 
     */
    free(address) {
        return this[list].free(address);
    }

    /**
     * Reads data from a given memory address. 
     * @param {number} address The memory address to free.
     * @returns {Uint8Array} The data found at the memory address.
     * @throws {Error} If address is invalid.
     */
    read(address) {
        return this[list].read(address);
    }

    /**
     * Writes data to a given memory address. 
     * @param {number} address The memory address to free.
     * @param {TypedArray} data The data to write.
     * @returns {void}
     * @throws {Error} If address is invalid.
     * @throws {Error} If data isn't a TypedArray.
     * @throws {Error} If the data is larger than the available space.
     */
    write(address, data) {
        return this[list].write(address, data);
    }

}
