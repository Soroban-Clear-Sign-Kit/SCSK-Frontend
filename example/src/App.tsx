import { useState } from 'react'
import { ClearSignModal, useClearSign } from '@clearsign/react'
import '@clearsign/react/styles.css'

function App() {
  const [xdr, setXdr] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { preview, loading, requestApproval } = useClearSign({
    networkPassphrase: "Test SDF Network ; September 2015",
    rpcUrl: "https://soroban-testnet.stellar.org"
  });

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Soroban Clear-Sign Kit Demo</h1>
      <p>Enter a Soroban Transaction XDR to preview it safely.</p>
      
      <textarea 
        value={xdr} 
        onChange={e => setXdr(e.target.value)} 
        rows={6} 
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        placeholder="AAAA..."
      />
      <br/>
      <button 
        onClick={() => {
          setIsOpen(true);
          requestApproval(xdr).then(approved => {
            if (approved) alert('Signed!');
            setIsOpen(false);
          }).catch(console.error);
        }}
        disabled={!xdr}
        style={{ padding: '0.5rem 1rem', fontSize: '1.2rem', cursor: 'pointer' }}
      >
        Preview Transaction
      </button>

      {isOpen && preview && (
        <ClearSignModal 
          preview={preview}
          onApprove={() => {
            // Internal callback logic is handled by hook's promise
          }}
          onReject={() => {
            // Internal callback logic is handled by hook's promise
          }}
        />
      )}
      {isOpen && loading && <p>Loading preview...</p>}
    </div>
  )
}

export default App
