import { useState } from 'react'
import { ClearSignModal, useClearSign } from '@clearsign/react'
import '@clearsign/react/styles.css'

function App() {
  const [xdr, setXdr] = useState('');
  const { open, preview, loading, requestApproval, onApprove, onReject } = useClearSign({
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
          requestApproval(xdr).then(approved => {
            if (approved) alert('Signed!');
          }).catch(console.error);
        }}
        disabled={!xdr}
        style={{ padding: '0.5rem 1rem', fontSize: '1.2rem', cursor: 'pointer' }}
      >
        Preview Transaction
      </button>

      {open && (
        <ClearSignModal
          preview={preview}
          loading={loading}
          onApprove={onApprove}
          onReject={onReject}
        />
      )}
    </div>
  )
}

export default App
