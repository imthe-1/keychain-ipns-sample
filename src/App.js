import logo from './logo.svg';
import './App.css';
import { IPFS } from '@mdip/client';
import axios from 'axios';

const IPFS_NODE = 'http://localhost:5001';
const IPFS_WS_PORT = 4001;

const ctrl = new IPFS({ url: IPFS_NODE, wsPort: IPFS_WS_PORT });

ctrl.connect().then(async (res) => {
  console.log('[Keychain] connect', res);
  const doc = { toolsetName: 'Keychain', ts: new Date().toISOString() };
  const lifetimeObj = { lifetime: '' };
  console.log('[Keychain] doc', doc);
  const CID = await ctrl.sendJSONToIPFS([doc]);
  console.log('[Keychain] CID', CID[0].path);
  console.log('[Keychain] IPFS URL: https://ipfs.io/ipfs/' + CID[0].path);

  // Publishing using the Keychain toolset modificaion
  const keypair = `keypair-${Date.now()}`;
  const IPNSPrivateKey = '296a16e3fcea976fe7fb480580ff4fbb909858815b7644b6fb1ac092aaab3aa1';
  const IPNSKey = await ctrl.deriveIPNSKeypair(keypair, IPNSPrivateKey);
  console.log('[IPNSKey]', IPNSKey); // deterministic
  const ipfsAddr = `/ipfs/${CID[0].path}`;
  try {
    // by default the lifetime is set to "3day". it can be modified by passing a 4th arg opts { lifetime: '2min' } to "linkToIPNS"
    const ipnsLink = await ctrl.linkToIPNS(
      ipfsAddr,
      keypair,
      IPNSKey.id,
      lifetimeObj
    );
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

    const resolvedIPNS = await ctrl.resolveIPNS(`/ipns/${ipnsLink.name}`);
    console.log('[Keychain] resolvedIPNS', resolvedIPNS);

    console.log('[Keychain] Does new data match resolved IPNS data(local ipfs node):', JSON.stringify(doc) === resolvedIPNS);

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
    console.log('[EXPECTED_ERROR] in block #1 since subs happens first time', e)
  }
  try {
    const ipnsLinkII = await ctrl.linkToIPNS(
      ipfsAddr,
      keypair,
      IPNSKey.id,
      lifetimeObj
    );
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
    console.log('[UNEXPECTED_ERROR] in block #2', e)
  }
});

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          please go to console in dev tools to see the publishing and resolution logs
        </p>
      </header>
    </div>
  );
}

export default App;
