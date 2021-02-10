/**
 * @fileoverview Tests for the Memory class.
 */
/*global describe, it, beforeEach*/

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

import { Memory } from "../src/memory.js";
import { expect } from "chai";

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------


describe("Memory", () => {

    describe("new Memory()", () => {

        it("should throw an error when there are not enough bytes", () => {
            expect(() => {
                new Memory({byteLength: 6}, 0, 8);
            }).throws(/Cannot/);
        });

        it("should throw an error when there are not enough bytes", () => {
            expect(() => {
                new Memory({byteLength: 6}, 2, 6);
            }).throws(/Cannot/);
        });
    });

    describe("allocate()", () => {

        let list;

        beforeEach(() => {
            list = new Memory(new Uint8Array(25).buffer);
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
            list = new Memory(new Uint8Array(25).buffer);
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

        let memory, data;

        beforeEach(() => {
            data = new Uint8Array(25);
            memory = new Memory(data.buffer);
        });


        it("should throw error when the block isn't allocated", () => {
            expect(() => {
                memory.write(0, new Uint8Array(2));
            }).throws(/block/);

        });
        
        it("should throw error when the block isn't big enough for the data", () => {
            const address = memory.allocate(4);
            expect(() => {
                memory.write(address, new Uint8Array(5));
            }).throws(/block/);
        });
        
        it("should throw error when the argument isn't a typed array", () => {
            const address = memory.allocate(4);
            expect(() => {
                memory.write(address, {});
            }).throws(/typed array/);
        });
        
        it("should write data into underlying buffer when called with a typed array", () => {
            const address = memory.allocate(4);
            memory.write(address, new Uint8Array([1, 2, 3, 4]));

            const dataInMemory = new Uint8Array(data.buffer, address, 4);
            expect(dataInMemory).to.deep.equal(new Uint8Array([1, 2, 3, 4]));
        });

    });
});
