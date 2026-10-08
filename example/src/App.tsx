import { useState } from 'react'
import { ClearSignModal } from '@clearsign/react'
import '@clearsign/react/styles.css'

function App() {
  const [xdr, setXdr] = useState('');
  const [isOpen, setIsOpen] = useState(false);

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
        onClick={() => setIsOpen(true)}
        disabled={!xdr}
        style={{ padding: '0.5rem 1rem', fontSize: '1.2rem', cursor: 'pointer' }}
      >
        Preview Transaction
      </button>

      {isOpen && (
        <ClearSignModal 
          xdr={xdr} 
          networkPassphrase="Test SDF Network ; September 2015"
          rpcUrl="https://soroban-testnet.stellar.org"
          onClose={() => setIsOpen(false)}
          onSign={() => {
            alert('Signed!');
            setIsOpen(false);
          }}
        />
      )}
    </div>
  )
}

export default App
