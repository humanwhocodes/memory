/**
 * @fileoverview Free List implementation
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

const listCursor = Symbol("listCursor");

/**
 * Represents a map of memory in an ArrayBuffer.
 */
export class FreeList {

    /**
     * Creates a new instance.
     * @param {Cursor} cursor The Cursor object to use to navigate the memory.
     * @param {ArrayBuffer} buffer The ArrayBuffer to use as memory. 
     * @param {number} [byteOffset=0] The starting byte offset in the buffer for
     *      memory.
     * @param {number} [byteLength=buffer.length] The total number of bytes
     *      available in the memory.
     */
    constructor(cursor, buffer, byteOffset = 0, byteLength = buffer.byteLength) {

        if (byteOffset + byteLength > buffer.byteLength) {
            throw new RangeError(`Cannot allocate ${byteOffset + byteLength} bytes; only ${buffer.byteLength} bytes available.`);
        }

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
         * The cursor used to navigate the list.
         * @property listCursor
         * @type Cursor
         * @private
         */
        this[listCursor] = cursor;

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
            [listCursor]: {
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

        const cursor = this[listCursor];
        let found = false;

        cursor.reset();

        /* eslint-disable-next-line no-constant-condition */
        while (true) {
            if (cursor.dataSize >= byteCount && !cursor.used) {
                found = true;
                break;
            }

            if (cursor.hasNext()) {
                cursor.next();
            } else {
                break;
            }
        }

        if (found) {
            cursor.use();
        } else {

            /*
             * If there's not enough memory, don't throw an error. Just return
             * 0 to indicate no allocation happened. Addresses are always 
             * greater than 0.
             */
            try {
                cursor.allocate(byteCount);
            } catch (error) {
                return 0;
            }
        }

        return cursor.address;
    }

    /**
     * Frees the given memory address. 
     * @param {number} address The memory address to free.
     * @returns {void}
     * @throws {Error} If address is invalid. 
     */
    free(address) {

        const cursor = this[listCursor];

        cursor.findAddress(address);
        cursor.free();
    }

    /**
     * Reads data from a given memory address. 
     * @param {number} address The memory address to free.
     * @returns {Uint8Array} The data found at the memory address.
     * @throws {Error} If address is invalid.
     */
    read(address) {

        const cursor = this[listCursor];

        cursor.findAddress(address);

        if (!cursor.used) {
            throw new Error("Memory hasn't been allocated.");
        }

        return new Uint8Array(this.buffer, this.address, this.dataSize);
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

        const cursor = this[listCursor];
        cursor.findAddress(address);

        if (!cursor.used) {
            throw new Error("Memory hasn't been allocated.");
        }

        if (!ArrayBuffer.isView(data)) {
            throw new TypeError("Value must a typed array.");
        }

        if (data.byteLength > cursor.dataSize) {
            throw new Error("Value is too big for block.");
        }

        const source = new Uint8Array(data.buffer);
        const destination = new Uint8Array(this.buffer);
        destination.set(source, address);
    }
}
