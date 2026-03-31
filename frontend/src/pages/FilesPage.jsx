import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, Download, Trash2, FileIcon } from 'lucide-react';
import { Spinner } from '../components/UI/Spinner';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function FilesPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const fetchFiles = useCallback(async () => {
    try {
      const { data } = await api.get('/files');
      setFiles(data);
    } catch {
      setError('Nu s-au putut încărca fișierele');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const uploadFiles = async fileList => {
    setUploading(true);
    setError('');
    const form = new FormData();
    Array.from(fileList).forEach(f => form.append('files', f));
    try {
      const { data } = await api.post('/files/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFiles(prev => [...data, ...prev]);
    } catch (err) {
      setError(err.response?.data?.error || 'Eroare la upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = e => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  };

  const handleDelete = async id => {
    if (!window.confirm('Ștergi acest fișier?')) return;
    await api.delete(`/files/${id}`);
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const download = id => {
    window.open(`/api/files/${id}/download`, '_blank');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Fișiere</h1>
      </div>

      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={e => uploadFiles(e.target.files)}
        />
        <Upload size={24} />
        {uploading ? (
          <p>Se încarcă...</p>
        ) : (
          <p>Trage fișierele aici sau <strong>click pentru selectare</strong></p>
        )}
        <span className="upload-note">Max 50 MB per fișier</span>
      </div>

      {error && <div className="page-error">{error}</div>}

      {loading ? (
        <div className="loading-center"><Spinner /></div>
      ) : files.length === 0 ? (
        <div className="empty-state">
          <p>Niciun fișier încărcat încă.</p>
        </div>
      ) : (
        <div className="files-table">
          <div className="files-table-head">
            <span>Nume</span>
            <span>Dimensiune</span>
            <span>Încărcat de</span>
            <span>Data</span>
            <span></span>
          </div>
          {files.map(file => (
            <div key={file.id} className="files-table-row">
              <span className="file-name">
                <FileIcon size={14} />
                {file.original_name}
              </span>
              <span className="file-size">{formatBytes(file.size_bytes)}</span>
              <span className="file-uploader">{file.uploader_name}</span>
              <span className="file-date">{new Date(file.created_at).toLocaleDateString('ro-RO')}</span>
              <span className="file-actions">
                <button onClick={() => download(file.id)} title="Descarcă"><Download size={14} /></button>
                {(file.uploaded_by === user.id || user.role === 'admin') && (
                  <button onClick={() => handleDelete(file.id)} title="Șterge"><Trash2 size={14} /></button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
