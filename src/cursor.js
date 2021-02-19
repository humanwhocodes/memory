/**
 * @fileoverview Generic Cursor implementation
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const HEADER_SIZE = 4;

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

export class Cursor {

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
     * This value always includes 32 bits for the header.
     */
    get size() {
        return this.view.getInt32(this.bytePosition) & ~1; 
    }
    
    get address() {
        return this.bytePosition + HEADER_SIZE;
    }
    
    get dataSize() {
        return this.size ? this.size - HEADER_SIZE : 0;
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

        if (this.bytePosition + HEADER_SIZE + byteCount > this.byteLength) {
            throw new Error("Out of memory.");
        }

        this.view.setInt32(this.bytePosition, (HEADER_SIZE + byteCount) | 1);
    }

    /**
     * Indicates if the current block has been allocated with a size.
     * @returns {number} 1 if allocated and 0 if not.
     */
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

Cursor.HEADER_SIZE = HEADER_SIZE;
