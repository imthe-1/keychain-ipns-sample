
import logo from "./logo.svg";
import "./App.css";
import axios from "axios";
import { create } from "ipfs-http-client";
require("./generatePrivKey.js");
const { toString: uint8ArrayToString } = require("uint8arrays/to-string");

const httpClient = create({ url: "http://127.0.0.1:5001/api/v0" });

async function sendJSONToIPFS(data) {
    if (!Array.isArray(data)) {
        throw new Error("Input must be an array");
    }
    const sanitizedData = data.map((obj, i) => {
        if (typeof obj !== "object") {
            throw new Error(`Invalid input at index ${i}`);
        }
        return JSON.stringify(obj);
    });
    const storedCIDs = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const result of httpClient.addAll(sanitizedData)) {
        storedCIDs.push(result);
    }
    return storedCIDs;
}

async function deriveIPNSKeypair(name, privateKey) {
    const keypair = await httpClient.key.gen(name, {
        // type: "secp256k1",
        optPrivateKey: Buffer.from(privateKey, "hex"),
    });
    return keypair;
}

async function linkToIPNS(ipfsAddr, keyName, keyId, opts = {}) {
    for await (const chunk of httpClient.cat(ipfsAddr)) {
        console.log("[linkToIPNS] [Checking for CID resolution] ", uint8ArrayToString(chunk));
    }

    const resp = await httpClient.name.publish(ipfsAddr, {
        key: keyName,
        resolve: false,
        lifetime: opts.lifetime || "3day",
    });
    return resp;
}

async function resolveIPNS(ipnsPubKey) {
    let cid;
    // eslint-disable-next-line no-restricted-syntax
    for await (const name of httpClient.name.resolve(ipnsPubKey)) {
        cid = name;
    }
    let dData;
    // eslint-disable-next-line no-restricted-syntax
    for await (const chunk of httpClient.cat(cid)) {
        dData = chunk;
    }
    // return dData.toString();
    return uint8ArrayToString(dData);
}

async function testIPNSUploadAndResolve() {
    const doc = { toolsetName: "Keychain", ts: new Date().toISOString() };
    //10 days expiry
    const lifetimeObj = { lifetime: "240h" };
    console.log("[Keychain] doc", doc);
    const CID = await sendJSONToIPFS([doc]);
    console.log("[Keychain] CID", CID[0].path);
    console.log("[Keychain] IPFS URL: https://ipfs.io/ipfs/" + CID[0].path);

    // Publishing using the Keychain toolset modificaion
    const keypair = `keypair-${Date.now()}`;
    const IPNSPrivateKey =
        "E1A2A51434882FA38B369163A38EB9C64FAB966C693A203555E8C3517B1A90546B3B218DAA361AD405892D6C6763CEB3CC9535591A7BC7E4E1EEA3B0B8180197DD81CB14ED92EE6DECDB891031D06AA7909F26B8560FAFE787A39E50500F4955A011351DB08E33C86062EB2639B0A95DCD8366ED7670DE461B6A23D6DCDFF58EB70436E03599AC2FC0078798BAAD147B56A8D44357AC79E1D808AE8F7857492F1F89A4CD03B413E175D559A87D3EEBC1EC961E28A1484507FA771DB3EC496FBDF78F2C9B544760FBE4324D2D2A4FC008EBA41C495A5BE25D5B0433D86B9829ECCB36AD037B2B387F3E4F25BDD449F325A122679F23D9DA4D206CA0D9BFF141BB";
    const IPNSKey = await deriveIPNSKeypair(keypair, IPNSPrivateKey);
    console.log("[IPNSKey]", IPNSKey); // deterministic
    const ipfsAddr = `/ipfs/${CID[0].path}`;
    try {
        // by default the lifetime is set to "24h". it can be modified by passing a 4th arg opts { lifetime: '2m' } to "linkToIPNS"
        const ipnsLink = await linkToIPNS(ipfsAddr, keypair, IPNSKey.id, lifetimeObj);
        console.log("[Keychain IPNS Publish] name", ipnsLink.name);
        console.log("[Keychain IPNS Publish] value", ipnsLink.value);
        console.log("[Keychain] IPFS URL: https://ipfs.io" + ipnsLink.value);
        console.log("[Keychain] IPFS URL: https://ipfs.io/ipns/" + ipnsLink.name);
        console.log("[Keychain] ---Observations Below---");
        console.log("[Keychain] lifetime value", lifetimeObj);
        if (!lifetimeObj.lifetime) {
            console.info('[Keychain] lifetime value not set. default value of "24h" will be used');
        }
        console.log("[Keychain] DID Doc data", JSON.stringify(doc));

        const resolvedIPNS = await resolveIPNS(`/ipns/${ipnsLink.name}`);
        console.log("[Keychain] resolvedIPNS", resolvedIPNS);

        console.log(
            "[Keychain] Does new data match resolved IPNS data(local/kubo ipfs node):",
            JSON.stringify(doc) === resolvedIPNS
        );

        const IPNSConfig = {
            method: "get",
            url: `https://ipfs.io/ipns/${ipnsLink.name}`,
            headers: {},
        };

        const respIPNS = await axios(IPNSConfig);
        const respIPNSData = respIPNS.data;
        console.log("[Keychain] ipfs.io/ipns", respIPNSData);

        console.log(
            "[Keychain] Does local/kubo ipfs node IPNS data equal ipfs.io IPNS data: ",
            resolvedIPNS === JSON.stringify(respIPNSData)
        );
    } catch (e) {
        console.log("[EXPECTED_ERROR] in block #1 since subs happens first time", e);
    }

    try {
        const ipnsLinkII = await linkToIPNS(ipfsAddr, keypair, IPNSKey.id, lifetimeObj);
        console.log("[Keychain IPNS Publish]", ipnsLinkII);
        console.log("[Keychain] DID Doc data  ", JSON.stringify(doc));

        const resolvedIPNSII = await resolveIPNS(`/ipns/${ipnsLinkII.name}`);
        console.log("[Keychain] resolvedIPNSII", resolvedIPNSII);

        console.log(
            "[Keychain] Does new data match resolved IPNS data(local/kubo ipfs node):",
            JSON.stringify(doc) === resolvedIPNSII
        );

        const IPNSConfigII = {
            method: "get",
            url: `https://ipfs.io/ipns/${ipnsLinkII.name}`,
            headers: {},
        };

        const respIPNSII = await axios(IPNSConfigII);
        const respIPNSDataII = respIPNSII.data;
        console.log("[Keychain] ipfs.io/ipns  ", resolvedIPNSII);

        console.log(
            "[Keychain] Does local ipfs node IPNS data equal ipfs.io IPNS data: ",
            resolvedIPNSII === JSON.stringify(respIPNSDataII)
        );
    } catch (e) {
        console.log("[UNEXPECTED_ERROR] in block #2", e);
    }
}

testIPNSUploadAndResolve();

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>please go to console in dev tools to see the publishing and resolution logs</p>
            </header>
        </div>
    );
}

export default App;
