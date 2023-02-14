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

  // Publishing using the Keychain toolset modificaion
  const keypair = `keypair-${Date.now()}`;
  const IPNSPrivateKey = 'd7ee8c9b306fd2761cad8a0385b41efa96c131ad67adc9327f928a29f57205fd';
  const IPNSKey = await ctrl.deriveIPNSKeypair(keypair, IPNSPrivateKey);
  console.log('[IPNSKey]', IPNSKey); // deterministic
  const ipfsAddr = `/ipfs/${CID[0].path}`;
  try {
    // by default the lifetime is set to "3day". it can be modified by passing a 4th arg opts { lifetime: '2min' } to "linkToIPNS"
    const ipnsLink = await ctrl.linkToIPNS(
      ipfsAddr,
      keypair,
      IPNSKey.id,
      // { lifetime: '2min' }
    );
    console.log('[Keychain IPNS Publish]', ipnsLink);
    const resolvedIPNS = await ctrl.resolveIPNS(`/ipns/${ipnsLink.name}`);
    console.log('[Keychain] resolvedIPNS', resolvedIPNS);
  } catch (e) {
    console.log('[EXPECTED_ERROR] in block #1 since subs happens first time', e)
  }
  try {
    const ipnsLinkII = await ctrl.linkToIPNS(
      ipfsAddr,
      keypair,
      IPNSKey.id,
    );
    console.log('[Keychain IPNS Publish]', ipnsLinkII);
    const resolvedIPNSII = await ctrl.resolveIPNS(`/ipns/${ipnsLinkII.name}`);
    console.log('[Keychain] resolvedIPNSII', resolvedIPNSII);
  } catch (e) {
    console.log('[UNEXPECTED_ERROR] in block #2', e)
  }
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
