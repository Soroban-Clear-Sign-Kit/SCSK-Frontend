import { useState } from 'react'
import { ClearSignModal, useClearSign } from '@clearsign/react'
import { freighterAdapter } from '@clearsign/react/adapters/freighter'
import '@clearsign/react/styles.css'

function App() {
  const [xdr, setXdr] = useState('');
  const [lastSigned, setLastSigned] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const {
    open,
    preview,
    loading,
    isSigning,
    signedXdr,
    error,
    signTransaction,
    onApprove,
    onReject,
  } = useClearSign({
    networkPassphrase: "Test SDF Network ; September 2015",
    rpcUrl: "https://soroban-testnet.stellar.org",
    adapter: freighterAdapter(),
  });

  const handleSign = async () => {
    setStatusMessage(null);
    setLastSigned(null);
    try {
      const result = await signTransaction(xdr);
      setLastSigned(result);
      setStatusMessage("Transaction signed successfully on testnet with Freighter!");
    } catch (err) {
      setStatusMessage(`Signing failed: ${(err as Error).message}`);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Soroban Clear-Sign Kit Demo</h1>
      <p>Enter a Soroban Transaction XDR to preview and sign safely using Freighter on testnet.</p>
      
      <textarea 
        value={xdr} 
        onChange={e => setXdr(e.target.value)} 
        rows={6} 
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', fontFamily: 'monospace' }}
        placeholder="AAAA..."
      />
      <br/>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button 
          onClick={handleSign}
          disabled={!xdr.trim() || loading || isSigning}
          style={{ 
            padding: '0.6rem 1.2rem', 
            fontSize: '1rem', 
            fontWeight: 600, 
            cursor: (!xdr.trim() || loading || isSigning) ? 'not-allowed' : 'pointer' 
          }}
        >
          {loading ? 'Simulating...' : isSigning ? 'Signing with Freighter...' : 'Preview & Sign (Freighter)'}
        </button>
      </div>

      {statusMessage && (
        <div 
          style={{ 
            padding: '0.75rem 1rem', 
            borderRadius: '4px', 
            marginBottom: '1rem',
            backgroundColor: error ? '#fee2e2' : '#f0fdf4',
            color: error ? '#991b1b' : '#166534',
            border: `1px solid ${error ? '#f87171' : '#86efac'}`
          }}
        >
          {statusMessage}
        </div>
      )}

      {(lastSigned || signedXdr) && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Signed Transaction XDR:</h3>
          <textarea 
            readOnly 
            value={lastSigned || signedXdr || ''} 
            rows={4} 
            style={{ width: '100%', padding: '0.5rem', fontFamily: 'monospace' }} 
          />
        </div>
      )}

      {open && (
        <ClearSignModal
          preview={preview}
          loading={loading}
          isSigning={isSigning}
          onApprove={onApprove}
          onReject={onReject}
        />
      )}
    </div>
  )
}

export default App
