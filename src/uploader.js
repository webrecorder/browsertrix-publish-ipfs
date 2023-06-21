export class Uploader
{
  constructor(ipfs, config, downloadOrigin) {
    this.ipfs = ipfs;
    this.downloadOrigin = downloadOrigin;
    this.config = config;
  }

  async run() {
    const files = [];

    const archives = [];

    for (const coll of this.config.collections) {
      const prefix = `collections/${coll.name}/`;
      const manifestFile = "archive.json";
      await this.processColl(coll, files, prefix, manifestFile);

      archives.push({
        name: coll.name,
        description: coll.description,
        url: prefix + manifestFile
      });
    }

    const mainConfig = {
      "site": {
        "title": this.config.name,
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
      console.log("upload", upload);
      if (upload.path) {
        filesToAdd[upload.path] = {cid: upload.cid};
      }
    }

    return filesToAdd;
  }

  async processColl(coll, files, prefix, manifestFile) {
    for (const resource of coll.resources) {
      if (!resource.cid && !resource.path.startsWith("ipfs://")) {
        const url = new URL(resource.path, this.downloadOrigin);

        const resp = await fetch(url);
        if (!resp.ok) {
          console.log(`${resp.status} - ${url}`);
          continue;
        }

        const name = "files/" + resource.name.replace("/", "-");
        resource.path = name;
        //resource.path = `ipfs://${res.cid}#.wacz`;

        files.push({path: prefix + name, content: resp.body});
      }
    }

    files.push({path: prefix + manifestFile, content: JSON.stringify(coll, null, 2)});
  }
}


