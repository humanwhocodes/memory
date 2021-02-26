/**
 * @fileoverview Tests for the ImplicitFreeList class.
 */
/*global describe, it, beforeEach*/

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

import { ImplicitCursor, ImplicitFreeList } from "../src/implicit-free-list.js";
import { expect } from "chai";

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------


describe("ImplicitFreeList", () => {

    describe("new ImplicitFreeList()", () => {

        it("should throw an error when there are not enough bytes", () => {
            expect(() => {
                new ImplicitFreeList({byteLength: 6}, 0, 8);
            }).throws(/Cannot/);
        });

        it("should throw an error when there are not enough bytes", () => {
            expect(() => {
                new ImplicitFreeList({byteLength: 6}, 2, 6);
            }).throws(/Cannot/);
        });
    });

    describe("allocate()", () => {

        let list;

        beforeEach(() => {
            list = new ImplicitFreeList(new Uint8Array(25).buffer);
        });


        it("should allocate space when list is empty", () => {
            const address = list.allocate(4);
            expect(address).to.equal(4);
        });
        
        it("should allocate space when list has one spot allocated already", () => {
            list.allocate(4);
            const address = list.allocate(4);
            expect(address).to.equal(12);
        });
        
        it("should allocate space when list has two spots allocated already", () => {
            list.allocate(4);
            list.allocate(6);
            const address = list.allocate(2);
            expect(address).to.equal(22);
        });
        
        it("should return 0 when trying to allocate more memory than present", () => {
            list.allocate(4);
            list.allocate(6);
            const address = list.allocate(18);
            expect(address).to.equal(0);
        });
        
    });

    describe("free()", () => {

        let list;

        beforeEach(() => {
            list = new ImplicitFreeList(new Uint8Array(25).buffer);
        });


        it("should throw error when the list is empty", () => {
            expect(() => {
                list.free(0);
            }).throws(/block/);

            expect(() => {
                list.free(10);
            }).throws(/block/);
        });
        
        it("should throw error when 0 is passed in", () => {
            list.allocate(4);
            expect(() => {
                list.free(0);
            }).throws(/block/);
        });
        
        it("should free allocated space for reuse when there's only one block", () => {
            const address = list.allocate(4);
            list.free(address);
            const newAddress = list.allocate(4);
            expect(address).to.equal(newAddress);
        });

        it("should free allocated space for reuse when there are multiple blocks", () => {
            list.allocate(5);
            const address = list.allocate(4);
            list.allocate(2);

            list.free(address);
            const newAddress = list.allocate(2);
            expect(address).to.equal(newAddress);

        });
        
    });

    describe("write()", () => {

        let list, data;

        beforeEach(() => {
            data = new Uint8Array(25);
            list = new ImplicitFreeList(data.buffer);
        });


        it("should throw error when the block isn't allocated", () => {
            expect(() => {
                list.write(0, new Uint8Array(2));
            }).throws(/block/);

        });
        
        it("should throw error when the block isn't big enough for the data", () => {
            const address = list.allocate(4);
            expect(() => {
                list.write(address, new Uint8Array(5));
            }).throws(/block/);
        });
        
        it("should throw error when the argument isn't a typed array", () => {
            const address = list.allocate(4);
            expect(() => {
                list.write(address, {});
            }).throws(/typed array/);
        });
        
        it("should write data into underlying buffer when called with a typed array", () => {
            const address = list.allocate(4);
            list.write(address, new Uint8Array([1, 2, 3, 4]));

            const dataInMemory = new Uint8Array(data.buffer, address, 4);
            expect(dataInMemory).to.deep.equal(new Uint8Array([1, 2, 3, 4]));
        });

    });
});

describe("ImplicitCursor", () => {

    describe("new ImplicitCursor()", () => {

    });

    describe("Members", () => {

        let cursor;

        beforeEach(() => {
            cursor = new ImplicitCursor(new DataView(new Int32Array(10).buffer));
        });

        describe("used", () => {

            it("should be 0 when the array buffer isn't initialized", () => {
                expect(cursor.used).to.equal(0);
            });

            it("should be 1 when the memory is allocated", () => {
                cursor.allocate();
                expect(cursor.used).to.equal(1);
            });
        });

        describe("allocated", () => {

            it("should be 0 when the array buffer isn't initialized", () => {
                expect(cursor.allocated).to.equal(0);
            });

            it("should be 1 when the memory is allocated", () => {
                cursor.allocate();
                expect(cursor.allocated).to.equal(1);
            });

            it("should be 1 when the memory is allocated and not used", () => {
                cursor.allocate();
                cursor.free();
                expect(cursor.allocated).to.equal(1);
            });

        });

        describe("size", () => {

            it("should be 0 when the array buffer isn't initialized", () => {
                expect(cursor.size).to.equal(0);
            });

        });

        describe("dataSize", () => {

            it("should be 0 when the array buffer isn't initialized", () => {
                expect(cursor.dataSize).to.equal(0);
            });

            it("should reflect allocated value when allocate() is called", () => {
                cursor.allocate(8);
                expect(cursor.dataSize).to.equal(8);
            });


        });

        describe("allocate()", () => {

            it("should throw an error when trying to allocate the same block twice", () => {
                cursor.allocate();
                expect(() => {
                    cursor.allocate();
                }).throws(/re-allocate/);
            });

            it("should throw an error when there aren't enough free bytes", () => {
                expect(() => {
                    cursor.allocate(10000);
                }).throws(/Out of memory/);
            });

            it("should set the last bit of the first 32 bits to 1", () => {
                cursor.allocate();
                expect(cursor.used).to.equal(1);
            });

            it("should not affect the size value when called", () => {
                cursor.allocate(8);
                expect(cursor.dataSize).to.equal(8);
                expect(cursor.size).to.equal(8 + ImplicitCursor.HEADER_SIZE);
            });
        });

        describe("free()", () => {

            it("should set the last bit of the first 32 bits to 0", () => {
                cursor.allocate();
                cursor.free();
                expect(cursor.used).to.equal(0);
            });

            it("should not affect the block size when called", () => {
                cursor.allocate(2);
                cursor.free();
                expect(cursor.dataSize).to.equal(2);
            });

            it("should throw an error when the memory hasn't been allocated", () => { 
                expect(() => {
                    cursor.free();
                }).throws(/free memory/);
            });


        });

        describe("next()", () => {

            it("should throw an error when nothing is allocated", () => {
                expect(() => {
                    cursor.next();
                }).throws(/move past/);
            });

            it("should move bytePosition when called on allocated block", () => { 
                cursor.allocate(2);
                const startPosition = cursor.bytePosition;
                cursor.next();
                const endPosition = cursor.bytePosition;
                
                expect(endPosition).to.equal(startPosition + 2 + ImplicitCursor.HEADER_SIZE);
            });

            it("should throw an error when called at end of free list", () => { 
                cursor.allocate(2);
                cursor.next();
                
                expect(() => {
                    cursor.next();
                }).throws(/move past/);
            });

        });

        describe("reset()", () => {

            it("should move bytePosition back to 0 when called on allocated block", () => { 
                cursor.allocate(2);
                cursor.next();
                cursor.reset();
                const endPosition = cursor.bytePosition;
                
                expect(endPosition).to.equal(0);
            });

        });

        describe("use()", () => {

            it("should throw an error when the block is in use", () => {
                cursor.allocate();

                expect(() => {
                    cursor.use();
                }).throws(/already in use/);
            });

            it("should reset value to all 0s when called", () => {
                const destination = new Uint8Array(cursor.view.buffer);
                cursor.allocate(2);
                destination.set(new Uint8Array([25, 26]), cursor.address);
                cursor.free();
                
                cursor.use();
                expect(destination.slice(cursor.address / 8, 2)).to.deep.equal(new Uint8Array(2));                
            });
            
            it("should set used to 1 when called", () => {
                const destination = new Uint8Array(cursor.view.buffer);
                cursor.allocate(2);
                destination.set(new Uint8Array([25, 26]), cursor.address);
                cursor.free();

                cursor.use();
                expect(cursor.used).to.equal(1);                
            });

        });

    });


});
