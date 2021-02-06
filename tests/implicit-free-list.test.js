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

});

describe("ImplicitCursor", () => {

    describe("new ImplicitCursor()", () => {

    });

    describe("Members", () => {

        let cursor;

        beforeEach(() => {
            cursor = new ImplicitCursor(new DataView(new Int32Array(10).buffer));
        });

        describe("allocated", () => {

            it("should be 0 when the array buffer isn't initialized", () => {
                expect(cursor.allocated).to.equal(0);
            });
        });

        describe("size", () => {

            it("should be 0 when the array buffer isn't initialized", () => {
                expect(cursor.size).to.equal(0);
            });

            it("should set size when assigned a value", () => {
                cursor.size = 8;
                expect(cursor.size).to.equal(8);
            });


        });

        describe("data", () => {

            it("should throw an error when the memory hasn't been allocated", () => {
                expect(() => {
                    cursor.data = "foo";
                }).throws(/allocated/);
            });

            it("should throw an error when the value isn't a typed array", () => {
                cursor.allocate(1);
                expect(() => {
                    cursor.data = "foo";
                }).throws(/typed array/);
            });

            it("should return a Uint8Array when read", () => {
                cursor.allocate(1);
                const data = cursor.data;
                expect(data).instanceOf(Uint8Array);
            });
            
            it.only("should set data when written", () => {
                const values = [120, 2, 45, 8];
                const bytes = new Uint8Array(values);
                cursor.allocate(bytes.length);
                cursor.data = bytes;
                expect(cursor.data).to.deep.equal(values);
            });


        });

        describe("allocate()", () => {

            it("should throw an error when trying to allocate the same block twice", () => {
                cursor.allocate(1);
                expect(() => {
                    cursor.allocate(2);
                }).throws(/re-allocate/);
            });

            it("should set the last bit of the first 32 bits to 1", () => {
                cursor.allocate(1);
                expect(cursor.allocated).to.equal(1);
                expect(cursor.size).to.equal(6);
            });

            it("should not affect the size value when called", () => {
                cursor.allocate(4);
                expect(cursor.size).to.equal(8);
            });
        });

        describe("free()", () => {

            it("should set the last bit of the first 32 bits to 0", () => {
                cursor.allocate();
                cursor.free();
                expect(cursor.allocated).to.equal(0);
            });
        });

    });


});
