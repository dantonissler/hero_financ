import { useRef } from 'react';
import { parseOfx } from '../lib/ofxParser';
import type { Transaction } from '../types';

interface Props {
  onLoad: (transactions: Transaction[]) => void;
  loading?: boolean;
}

export function FileUploader({ onLoad, loading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    const parsed = await Promise.all(
      [...files].map(async (file) => {
        const content = await file.text();
        return parseOfx(content);
      }),
    );

    const merged = parsed.flat();
    const unique = new Map<string, Transaction>();
    for (const transaction of merged) {
      unique.set(transaction.id, transaction);
    }

    onLoad([...unique.values()].sort((a, b) => b.date.getTime() - a.date.getTime()));
  }

  return (
    <div
      className="upload-zone"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".ofx"
        multiple
        hidden
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <div>
        <strong>Importar extratos OFX</strong>
        <p>Arraste arquivos do Nubank ou clique para selecionar</p>
      </div>
      <button type="button" disabled={loading} onClick={() => inputRef.current?.click()}>
        {loading ? 'Carregando...' : 'Selecionar arquivos'}
      </button>
    </div>
  );
}
