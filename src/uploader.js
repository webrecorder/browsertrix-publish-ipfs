export class Uploader
{
  constructor(ipfs, uploadConfig, downloadOrigin) {
    this.ipfs = ipfs;
    this.downloadOrigin = downloadOrigin;
    this.uploadConfig = uploadConfig;
  }

  async run() {
    for (const coll of this.uploadConfig) {
      await this.uploadCollFiles(coll);
    }

    return await this.uploadConfigs();
  }

  async uploadConfigs() {
    const files = [];
    const archives = [];

    for (const coll of this.uploadConfig) {
      const path = `colls/${coll.name}.json`;
      archives.push({name: coll.name, url: path});
      files.push({path, content: JSON.stringify(coll, null, 2)});
    }

    const mainConfig = {
      "site": {
        "title": "My Web Archives",
      },
      "replay": {
        "version": "",
        "deepLink": true
      },
      "archives": archives
    };
    files.push({path: "wrg-config.json", content: JSON.stringify(mainConfig, null, 2)});
     
    const filesToAdd = [];

    for await (const upload of await this.ipfs.addAll(files, {cidVersion: 1, wrapWithDirectory: false, rawLeaves: true})) {
      filesToAdd[upload.path] = {cid: upload.cid};
    }

    return filesToAdd;
  }

  async uploadCollFiles(coll) {
    for (const resource of coll.resources) {
      if (!resource.cid && !resource.path.startsWith("ipfs://")) {
        const url = this.downloadOrigin + resource.path;

        const resp = await fetch(url);
        if (!resp.ok) {
          console.log(`${resp.status} - ${url}`);
          continue;
        }

        const res = await this.ipfs.add({content: resp.body}, {cidVersion: 1, wrapWithDirectory: false});
        resource.path = `ipfs://${res.cid}#.wacz`;
        console.log(resource);
      }
    }
  }
}


