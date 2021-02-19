/**
 * @fileoverview Explicit Free List implementation
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Cursor
//-----------------------------------------------------------------------------

const META_SIZE = 4;
const LINKS_SIZE = 8;

export class ExplicitCursor {

    /**
     * Creates a new instance.
     * @param {DataView} view A DataView to focus the cursor on. 
     * @param {number} bytePosition The starting position of the cursor
     */
    constructor(view, bytePosition = 0) {

        /**
         * The view of a buffer to base the cursor on.
         * @type {DataView}
         * @property view
         */
        this.view = view;

        /**
         * The location of the cursor on the view.
         * @type {number}
         * @property bytePosition
         */
        this.bytePosition = bytePosition;
    }

    get byteLength() {
        return this.view.byteLength;
    }

    get byteOffset() {
        return this.view.byteOffset;
    }
    
    /**
     * Returns the complete size of the block including meta information.
     * @type {number}
     */
    get size() {
        return this.view.getInt32(this.bytePosition) & ~1; 
    }
    
    /**
     * Returns the address at which data can be stored in the block. This
     * is always after the header meta information.
     * @type {number}
     */
    get address() {
        return this.bytePosition + META_SIZE;
    }
    
    /**
     * Returns the number of bytes allocated for data in the block. This is
     * the size minus the header and footer meta information.
     * @type {number}
     */
    get dataSize() {
        return this.size ? this.size - META_SIZE : 0;
    }

    
    get data() {
        if (!this.used) {
            throw new Error("Memory hasn't been allocated.");
        }

        return new Uint8Array(this.view.buffer, this.address, this.dataSize);
    }

    set data(value) {

        if (!this.used) {
            throw new Error("Memory hasn't been allocated.");
        }

        if (!(value.buffer instanceof ArrayBuffer)) {
            throw new TypeError("Value must a typed array.");
        }

        if (value.byteLength > this.dataSize) {
            throw new Error("Value is too big for block.");
        }

        const source = new Uint8Array(value.buffer);
        const destination = new Uint8Array(this.view.buffer);
        destination.set(source, this.address);
    }

    /**
     * Allocates the current block with the given number of bytes.
     * @param {number} byteCount The number of bytes to allocate. Odd numbers
     *      automatically are rounded up to next even number.
     * @returns {void}
     * @throws {Error} If block has already been allocated.
     * @throws {Error} If there's not enough memory to allocate.
     */
    allocate(byteCount = 2) {

        if (this.used) {
            throw new Error("Cannot re-allocate memory that's in use.");
        }

        // must be a multiple of 2
        if (byteCount % 2) {
            byteCount += 1;
        }

        if (this.bytePosition + META_SIZE + byteCount > this.byteLength) {
            throw new Error("Out of memory.");
        }

        this.view.setInt32(this.bytePosition, (META_SIZE + byteCount) | 1);
    }

    get allocated() {
        return this.size > 0 ? 1 : 0;
    }

    /**
     * Marks the current block as used.
     * @returns {void}
     * @throws {Error} If the block is already in use.
     */
    use() {
        if (this.used) {
            throw new Error("Block is already in use.");
        }

        this.view.setInt32(this.bytePosition, this.size | 1);
        this.data = new Uint8Array(this.dataSize);
    }

    /**
     * Indicates if the current block is in use.
     * @returns {number} 1 if the block is in use or 0 if not.
     */
    get used() {
        return this.view.getInt32(this.bytePosition) & 1;
    }

    /**
     * Marks the current block as free.
     * @returns {void}
     * @throws {Error} If the block is already free.
     */
    free() {
        if (!this.used) {
            throw new Error("Cannot free memory that's not in use.");
        }

        this.view.setInt32(this.bytePosition, this.size & ~1);

    }

    hasNext() {
        return this.size > 0;
    }

    /**
     * Moves the cursor to the next open block in the buffer.
     * @returns {void}
     * @throws {Error} If the current block is empty.
     * @throws {Error} If the current block is the last one in the buffer.
     */
    next() {

        if (this.size === 0) {
            throw new Error("Can't move past end of free list.");
        }
     
        if (this.bytePosition + this.size > this.byteLength) {
            throw new Error("Out of memory.");
        }

        this.bytePosition += this.size;
    }

    /**
     * Resets the cursor position back to the front of the buffer.
     * @returns {void}
     */
    reset() {
        this.bytePosition = 0;
    }

    /**
     * Moves the cursor into the correct position for the address.
     * @param {number} address The address to find.
     * @returns {void}
     * @throws {Error} When address is invalid.
     */
    findAddress(address) {
        this.reset();

        while (this.address < address) {
            if (this.hasNext()) {
                this.next();
            } else {
                break;
            }
        }

        if (this.address !== address) {
            throw new Error(`Address ${address} is not the start of a memory block.`);
        }
    }

}

ExplicitCursor.HEADER_SIZE = META_SIZE;

//-----------------------------------------------------------------------------
// List
//-----------------------------------------------------------------------------

const cursor = Symbol("cursor");

/**
 * Represents a map of memory in an ArrayBuffer.
 */
export class ExplicitFreeList {
    
    /**
     * Creates a new instance.
     * @param {ArrayBuffer} buffer The ArrayBuffer to use as memory. 
     * @param {number} [byteOffset=0] The starting byte offset in the buffer for
     *      memory.
     * @param {number} [byteLength=buffer.length] The total number of bytes
     *      available in the memory.
     */
    constructor(buffer, byteOffset = 0, byteLength = buffer.byteLength) {
  
        if (byteOffset + byteLength > buffer.byteLength) {
            throw new RangeError(`Cannot allocate ${ byteOffset + byteLength } bytes; only ${ buffer.byteLength } bytes available.`);
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
         * The DataView used to do the work.
         * @property view
         * @type DataView
         */
        this.view = new DataView(buffer, byteOffset, byteLength);

        /**
         * The cursor used to navigate the list.
         * @property cursor
         * @type ExplicitCursor
         * @private
         */
        this[cursor] = new ExplicitCursor(this.view);

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
            view: {
                writable: false,
                configurable: false
            },
            [this]: {
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

        const kursor = this[cursor];
        let found = false;

        kursor.reset();

        /* eslint-disable-next-line no-constant-condition */
        while (true) {
            if (kursor.dataSize >= byteCount && !kursor.used) {
                found = true;
                break;
            }

            if (kursor.hasNext()) {
                kursor.next();
            } else {
                break;
            }
        }

        if (found) {
            kursor.use();
        } else {

            /*
             * If there's not enough memory, don't throw an error. Just return
             * 0 to indicate no allocation happened. Addresses are always 
             * greater than 0.
             */
            try {
                kursor.allocate(byteCount);
            } catch (error) {
                return 0;
            }
        }

        return kursor.address;
    }

    /**
     * Frees the given memory address. 
     * @param {number} address The memory address to free.
     * @returns {void}
     * @throws {Error} If address is invalid. 
     */
    free(address) {

        const kursor = this[cursor];

        kursor.findAddress(address);
        kursor.free();
    }

    /**
     * Reads data from a given memory address. 
     * @param {number} address The memory address to free.
     * @returns {Uint8Array} The data found at the memory address.
     * @throws {Error} If address is invalid.
     */
    read(address) {

        const kursor = this[cursor];

        kursor.findAddress(address);
        return kursor.data;
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

        const kursor = this[cursor];

        kursor.findAddress(address);
        kursor.data = data;
    }
}
