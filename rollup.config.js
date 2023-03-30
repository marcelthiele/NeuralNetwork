import dts from "rollup-plugin-dts";

const config = [
  // …
  {
    input: "./types/src/index.d.ts",
    output: [{ file: "./lib/my-library.d.ts", format: "es" }],
    plugins: [dts()],
  },
];

export default config;