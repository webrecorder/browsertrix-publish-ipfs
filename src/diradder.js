import { code as rawCode } from "multiformats/codecs/raw";
import { UnixFS } from "ipfs-unixfs";
import * as dagPb from "@ipld/dag-pb";

export class DirAdder {
  constructor(ipfs) {
    this.ipfs = ipfs;
  }

  async makeDir(files) {
    const node = new UnixFS({ type: "directory" });

    const Data = node.marshal();

    const Links = await this.createDirLinks(files);

    return await this.putBlock({ Data, Links });
  }

  async addToDir(dirCid, files) {
    if (dirCid.code == rawCode) {
      throw new Error("raw cid -- not a directory");
    }

    const block = await this.ipfs.block.get(dirCid);

    let { Data, Links } = dagPb.decode(block);

    let node = UnixFS.unmarshal(Data);

    if (!node.isDirectory()) {
      throw new Error(`file cid -- not a directory`);
    }

    const newLinks = await this.createDirLinks(files);
    console.log(newLinks);

    Links = [...Links, ...newLinks];

    // todo: disallow duplicates
    Links.sort((a, b) => (a.Name < b.Name ? -1 : 1));

    return await this.putBlock({Data, Links});
  }

  async putBlock(data) {
    return await this.ipfs.block.put(dagPb.encode(dagPb.prepare(data)),
      {version: 1, format: "dag-pb"}
    );
  }

  async getSize(cid, allowDir = false) {
    const block = await this.ipfs.block.get(cid);

    // if raw, use length of block
    if (cid.code == rawCode) {
      return block.length;
    }

    const { Data } = dagPb.decode(block);

    // otherwise, parse to unixfs node
    let unixfs = UnixFS.unmarshal(Data);

    if (!allowDir && unixfs.isDirectory()) {
      throw new Error(`cid ${cid} is a directory, only files allowed`);
    }

    if (unixfs.data) {
      return unixfs.data.length;
    } else if (!unixfs.isDirectory()) {
      return unixfs.fileSize();
    } else {
      return unixfs.blockSizes.reduce((a, b) => a + b, 0);
    }
  }

  async createDirLinks(files) {
    const names = Object.keys(files);
    if (!names.length) {
      return [];
    }
    names.sort();

    return await Promise.all(
      names.map(async (Name) => {
        const { cid, size } = files[Name];

        const Tsize = size !== undefined ? size : await this.getSize(cid, true);

        return {
          Name,
          Hash: cid,
          Tsize: Number(Tsize)
        };
      })
    );
  }
}
