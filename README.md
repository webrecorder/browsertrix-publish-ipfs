# Browsertrix Publish IPFS

This image is a small utility designed to run as a Job on [Browsertrix Cloud](https://github.com/webrecorder/browsertrix-cloud)
and is designed to publish a public collection to IPFS.

The job does the following:
1. Get list of public collections and their WACZ files from Browsertrix Cloud
2. Upload individual WACZ files to IPFS
3. Generate [Multi WACZ](https://github.com/webrecorder/specs/issues/112) compatible-spec JSON manifests for each collection.
4. Generate [web-replay-gen](https://github.com/webrecorder/web-replay-gen) config manifest for use with web-replay-gen.
5. Merge the config + collections with a base web-replay-gen template by adding links to existing IPFS directory, based on ideas in [ipfs-composite-files](https://github.com/webrecorder/ipfs-composite-files)
6. Update Browsertrix Cloud db with root CID of new merged directory, containing all public collections.
