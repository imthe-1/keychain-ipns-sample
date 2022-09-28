import logo from './logo.svg';
import './App.css';
import { IPFS } from '@mdip/client';

const IPFS_NODE = 'http://localhost:5001';
const IPFS_WS_PORT = 4001;

const ctrl = new IPFS({ url: IPFS_NODE, wsPort: IPFS_WS_PORT });

ctrl.connect().then(async (res) => {
  console.log('[Keychain] connect', res);
  const doc = { toolsetName: 'Keychain', ts: new Date().toISOString() };
  console.log('[Keychain] doc', doc);
  const CID = await ctrl.sendJSONToIPFS([doc]);
  console.log('[Keychain] CID', CID);
  // Publishing using default 'self' key
  const publishResp = await ctrl.coreClient.name.publish(`/ipfs/${CID[0].path}`)
  console.log('[Keychain] publishResp', publishResp);
  const resolvedIPNSII = await ctrl.resolveIPNS(ipnsLink);

  // Publishing using the Keychain toolset modificaion
  const keypair = `keypair-${Date.now()}`;
  const IPNSPrivateKey = 'b04ae926d8d76e94c446049959376a64a7e5acb3c33a26e76aeb1d6bbc9fc67e';
  const IPNSKey = await ctrl.deriveIPNSKeypair(keypair, IPNSPrivateKey);
  console.log('[IPNSKey]', IPNSKey); // deterministic
  const ipfsAddr = `/ipfs/${CID[0].path}`;
  const ipnsLink = await ctrl.linkToIPNS(
    ipfsAddr,
    keypair,
    IPNSKey.id,
  );
  console.log('[Keychain IPNS Publish]', ipnsLink);
});

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
