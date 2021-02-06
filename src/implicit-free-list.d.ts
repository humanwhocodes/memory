export class ImplicitCursor {
    constructor(view: any, byteOffset?: number);
    view: any;
    byteOffset: number;
    set size(arg: number);
    /**
     * This value always includes 32 bits for the header.
     */
    get size(): number;
    get allocated(): number;
    get address(): number;
    get dataSize(): number;
    set data(arg: Uint8Array);
    get data(): Uint8Array;
    allocate(byteLength: any): void;
    free(): void;
    next(): void;
}
export class ImplicitFreeList {
    constructor(buffer: any, byteOffset?: number, byteLength?: any);
    /**
     * The buffer used as the source of bytes.
     * @property buffer
     * @type ArrayBuffer
     */
    buffer: ArrayBuffer;
    /**
     * The starting offset to use in the buffer.
     * @property buffer
     * @type ArrayBuffer
     */
    byteOffset: ArrayBuffer;
    /**
     * The number of bytes to use in the buffer.
     * @property buffer
     * @type ArrayBuffer
     */
    byteLength: ArrayBuffer;
    /**
     * The DataView used to do the work.
     * @property view
     * @type DataView
     */
    view: DataView;
}
