/**
 * @fileoverview Implicit Free List implementation
 * @author Nicholas C. Zakas
 */

const HEADER_BYTES = 4;

export class ImplicitCursor {
    constructor(view, byteOffset = 0) {
        this.view = view;
        this.byteOffset = byteOffset;
    }

    /**
     * This value always includes 32 bits for the header.
     */
    get size() {
        return this.view.getInt32(this.byteOffset) & ~1; 
    }

    set size(value) {
        this.view.setInt32(this.byteOffset, value);
    }

    get allocated() {
        return this.view.getInt32(this.byteOffset) & 1; 
    }

    get address() {
        return this.byteOffset + HEADER_BYTES;
    }

    get dataSize() {
        return this.size - HEADER_BYTES;
    }

    get data() {
        if (!this.allocated) {
            throw new Error("Memory hasn't been allocated.");
        }

        return new Uint8Array(this.view.buffer, this.address, this.dataSize);
    }

    set data(value) {

        if (!this.allocated) {
            throw new Error("Memory hasn't been allocated.");
        }

        if (!(value.buffer instanceof ArrayBuffer)) {
            throw new TypeError("Value must a typed array.");
        }

        const source = new Uint8Array(value.buffer);
        const destination = new Uint8Array(this.view.buffer);
        const offset = this.address / 8;
        destination.set(source, offset);
    }

    allocate(byteLength) {

        if (this.allocated) {
            throw new Error("Cannot re-allocate memory that's in use.");
        }

        // byteLength must be a multiple of 2
        if (byteLength % 2) {
            byteLength += 1;
        }

        this.view.setInt32(this.byteOffset, (HEADER_BYTES + byteLength) | 1);
    }

    free() {
        this.view.setInt32(this.byteOffset, this.size & 0);
    }

    next() {
        this.byteOffset += this.size;
    }

}

export class ImplicitFreeList {
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
            }
        });
    }
}
