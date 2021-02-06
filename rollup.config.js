/**
 * @fileoverview Rollup config file
 * @author Nicholas C. Zakas
 */

export default [
    {
        input: "src/pkg.js",
        output: [
            {
                file: "dist/memory.cjs.js",
                format: "cjs"
            },
            {
                file: "dist/memory.js",
                format: "esm"
            }
        ]
    }    
];
