import logo from './logo.svg';
import './App.css';
// client lib of the Keychain toolset ecosystem
import { IPFS } from '@mdip/client';
import axios from 'axios';

// Ensure these flags are set. ipfs daemon --enable-namesys-pubsub --enable-pubsub-experiment
// Plug in IPFS node address here. Ensure the IPFS config has ws port set.
const IPFS_NODE = 'http://localhost:5001';
const IPFS_WS_PORT = 4001;

/**
 * IPFS is a class created by us that works as a wrapper for all the IPFS functionalities with some sanity checks added to it.
 */
const ctrl = new IPFS({ url: IPFS_NODE, wsPort: IPFS_WS_PORT });

// Starts the browser/nodejs IPFS node and connects it to the local/remote IPFS node for ensuring propagation even after the browser/nodejs IPFS node stops.
ctrl.connect().then(async (res) => {
  console.log('[Keychain] connect', res);
  // Sample object. In actual implementation this will be replaced by the Keychain DID Doc.
  const doc = { toolsetName: 'Keychain', ts: new Date().toISOString() };
  /**
   * If "lifetime" value is not set it defaults to "3day" and reproduces the consistency problem we are facing.
   * but if "lifetime" is set to "2min", the resolution becomes consistence
   * End goal is to have consistency no matter what the lifetime value is and ALSO, ensure that IPNS names and records persist for very long periods of time such as 10 years or even more.
   */
  const lifetimeObj = { lifetime: '' };
  console.log('[Keychain] doc', doc);
  const CID = await ctrl.sendJSONToIPFS([doc]);
  console.log('[Keychain] CID', CID[0].path);
  console.log('[Keychain] IPFS URL: https://ipfs.io/ipfs/' + CID[0].path);

  // Publishing using the Keychain toolset modificaion
  const keypair = `keypair-${Date.now()}`;
  // k1 private key hex. please plug in a new private key for experimentation.
  const IPNSPrivateKey = '931eb2d4ddcc62a0dec22a8cacb1a586bba477a2ca521b83d7f9d3f5510d1ec3';
  const IPNSKey = await ctrl.deriveIPNSKeypair(keypair, IPNSPrivateKey);
  // deterministic IPNS keypair generation. for the same private key, same IPNS name(pub key hash) gets generated.
  console.log('[IPNSKey]', IPNSKey);
  const ipfsAddr = `/ipfs/${CID[0].path}`;
  try {
    // by default the lifetime is set to "3day". it can be modified by passing a 4th arg opts { lifetime: '2min' } to "linkToIPNS"
    const ipnsLink = await ctrl.linkToIPNS(ipfsAddr, keypair, IPNSKey.id, lifetimeObj);
    // linkToIPNS is a wrapper for the IPNS publish function
    console.log('[Keychain IPNS Publish] name', ipnsLink.name);
    console.log('[Keychain IPNS Publish] value', ipnsLink.value);
    console.log('[Keychain] IPFS URL: https://ipfs.io' + ipnsLink.value);
    console.log('[Keychain] IPFS URL: https://ipfs.io/ipns/' + ipnsLink.name);
    console.log('[Keychain] ---Observations Below---');
    console.log('[Keychain] lifetime value', lifetimeObj);
    if (!lifetimeObj.lifetime) {
      console.info('[Keychain] lifetime value not set. default value of "3day" will be used');
    }
    console.log('[Keychain] DID Doc data', JSON.stringify(doc));

    // Resolving the published IPNS name.
    const resolvedIPNS = await ctrl.resolveIPNS(`/ipns/${ipnsLink.name}`);
    console.log('[Keychain] resolvedIPNS', resolvedIPNS);

    console.log('[Keychain] Does new data match resolved IPNS data(local ipfs node):', JSON.stringify(doc) === resolvedIPNS);

    // for verifying if the published IPNS name resolves via ipfs.io public gateway or not.
    const IPNSConfig = {
      method: 'get',
      url: `https://ipfs.io/ipns/${ipnsLink.name}`,
      headers: {},
    };

    const respIPNS = await axios(IPNSConfig);
    const respIPNSData = respIPNS.data;
    console.log('[Keychain] ipfs.io/ipns', respIPNSData);

    console.log('[Keychain] Does local ipfs node IPNS data equal ipfs.io IPNS data: ', resolvedIPNS === JSON.stringify(respIPNSData));
  } catch (e) {
    console.log('[EXPECTED_ERROR] in block #1 since subs happens first time', e);
  }
  try {
    /**
     * We publish and resolve here again since we were told by the IPFS devs that the PubSub subscription to IPNS name happens the first time hence it will only resolve the second time. Another issue to look at.
     */
    const ipnsLinkII = await ctrl.linkToIPNS(ipfsAddr, keypair, IPNSKey.id, lifetimeObj);
    console.log('[Keychain IPNS Publish]', ipnsLinkII);
    console.log('[Keychain] DID Doc data  ', JSON.stringify(doc));

    const resolvedIPNSII = await ctrl.resolveIPNS(`/ipns/${ipnsLinkII.name}`);
    console.log('[Keychain] resolvedIPNSII', resolvedIPNSII);

    console.log('[Keychain] Does new data match resolved IPNS data(local ipfs node):', JSON.stringify(doc) === resolvedIPNSII);

    const IPNSConfigII = {
      method: 'get',
      url: `https://ipfs.io/ipns/${ipnsLinkII.name}`,
      headers: {},
    };

    const respIPNSII = await axios(IPNSConfigII);
    const respIPNSDataII = respIPNSII.data;
    console.log('[Keychain] ipfs.io/ipns  ', respIPNSDataII);

    console.log('[Keychain] Does local ipfs node IPNS data equal ipfs.io IPNS data: ', resolvedIPNSII === JSON.stringify(respIPNSDataII));
  } catch (e) {
    console.log('[UNEXPECTED_ERROR] in block #2', e);
  }
});

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
