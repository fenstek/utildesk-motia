import { createRequire } from "node:module";

const requireFromSite = createRequire(new URL("../site/package.json", import.meta.url));

export default requireFromSite("sharp");
