import { CID } from "multiformats/cid";
import { create as createKubo } from 'kubo-rpc-client';

import { Uploader } from "./src/uploader.js";
import { DirAdder } from "./src/diradder.js";

import { updateOrgIPFSUrl } from "./src/db.js";

const replayRoot = process.env.REPLAY_ROOT_CID || "bafybeic3zi46caikdvukly7xwnjrecbvmllafvopvlyw6ylt3oeht7h5om";

const kuboUrl = process.env.KUBO_URL || "http://localhost:5001/";

const uploadConfigFile = process.env.UPLOAD_CONFIG || "config.json";

const downloadOrigin = process.env.DOWNLOAD_ORIGIN || "http://localhost:30870";


async function main() {
  const ipfs = createKubo({url: kuboUrl});

  const allColls = `${downloadOrigin}/api/orgs/${process.env.ORG_ID}/collections/allpublic`;

  const resp = await fetch(allColls);
  if (!resp.ok) {
    console.log(`invalid config: ${resp.status} - ${url}`);
    process.exit(1);
  }

  const uploadConfig = await resp.json();

  const uploader = new Uploader(ipfs, uploadConfig, downloadOrigin);

  const filesToAdd = await uploader.run();
  console.log(filesToAdd);

  const adder = new DirAdder(ipfs);

  const cid = await adder.addToDir(CID.parse(replayRoot), filesToAdd);

  await updateOrgIPFSUrl(process.env.ORG_ID, cid.toString());

  console.log("cid", cid.toString());

  process.exit(0);
}
 

main();

