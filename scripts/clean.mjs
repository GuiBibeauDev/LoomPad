import { rm } from "node:fs/promises";
import { glob } from "node:fs/promises";

for await (const path of glob("{apps,packages,examples}/*/{dist,dist-types,coverage}")) {
  await rm(path, { recursive: true, force: true });
}

for await (const path of glob("{apps,packages}/*/*.tsbuildinfo")) {
  await rm(path, { force: true });
}
