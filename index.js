import fs from "fs";
import { CID } from "multiformats/cid";
import { create as createKubo } from 'kubo-rpc-client';

import { Uploader } from "./src/uploader.js";
import { DirAdder } from "./src/diradder.js";

import { updateOrgIPFSUrl } from "./src/db.js";

const replayCAR = process.env.REPLAY_CAR || "replay.car";

const kuboUrl = process.env.KUBO_URL || "http://localhost:5001/";

const downloadOrigin = process.env.DOWNLOAD_ORIGIN || "http://localhost:30870";

const localConfig = process.env.LOCAL_CONFIG || "";


async function main() {
  const ipfs = createKubo({url: kuboUrl});

  let replayRoot = null;

  if (process.env.REPLAY_ROOT_CID) {
    replayRoot = process.env.REPLAY_ROOT_CID;
    console.log(`Using replay root CID: ${replayRoot}`);
  } else if (replayCAR) {
    console.log(`Importing Replay CAR: ${replayCAR}`);
    const blob = await fs.openAsBlob(replayCAR);
    const formData = new FormData();
    formData.append("path", blob);

    const res = await fetch(kuboUrl + "api/v0/dag/import?allow-big-block=true&pin-roots=true", {body: formData, method: "POST", duplex: "half"});
    const json = await res.json();
    replayRoot = json.Root.Cid["/"];
    console.log("replayRoot", replayRoot);
  }

  let uploadConfig;

  if (!localConfig) {
    const allColls = `${downloadOrigin}/api/orgs/${process.env.ORG_ID}/collections/allpublic`;

    const resp = await fetch(allColls);

    if (!resp.ok) {
      console.log(`invalid config: ${resp.status} - ${allColls}`);
      process.exit(1);
    }

    uploadConfig = await resp.json();
  } else {
    uploadConfig = JSON.parse(fs.readFileSync(localConfig));
  }

  const uploader = new Uploader(ipfs, uploadConfig, downloadOrigin);

  const filesToAdd = await uploader.run();

  const adder = new DirAdder(ipfs);

  const cid = await adder.addToDir(CID.parse(replayRoot), filesToAdd);

  await updateOrgIPFSUrl(process.env.ORG_ID, cid.toString());

  console.log("cid", cid.toString());

  process.exit(0);
}
 

main();

