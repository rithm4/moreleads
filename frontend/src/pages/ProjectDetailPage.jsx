import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Upload, Download, Pencil, Check, X,
  Table2, Paperclip, FolderKanban
} from 'lucide-react';
import api from '../api/axios';
import { Modal } from '../components/UI/Modal';
import { Spinner } from '../components/UI/Spinner';

// ─── Spreadsheet ──────────────────────────────────────────────
function SpreadsheetView({ projectId, sheet, onDeleted }) {
  const [data, setData] = useState(null);
  const [editingCell, setEditingCell] = useState(null); // { rowId, colId }
  const [cellVal, setCellVal] = useState('');
  const [addColModal, setAddColModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState('text');

  useEffect(() => {
    api.get(`/projects/${projectId}/spreadsheets/${sheet.id}`)
      .then(r => setData(r.data));
  }, [projectId, sheet.id]);

  const refresh = () => api.get(`/projects/${projectId}/spreadsheets/${sheet.id}`).then(r => setData(r.data));

  const addRow = async () => {
    await api.post(`/projects/${projectId}/spreadsheets/${sheet.id}/rows`, { data: {} });
    refresh();
  };

  const addCol = async () => {
    if (!newColName.trim()) return;
    await api.post(`/projects/${projectId}/spreadsheets/${sheet.id}/columns`, { name: newColName, col_type: newColType });
    setNewColName(''); setNewColType('text'); setAddColModal(false);
    refresh();
  };

  const deleteCol = async (colId) => {
    if (!confirm('Ștergi coloana?')) return;
    await api.delete(`/projects/${projectId}/spreadsheets/${sheet.id}/columns/${colId}`);
    refresh();
  };

  const deleteRow = async (rowId) => {
    await api.delete(`/projects/${projectId}/spreadsheets/${sheet.id}/rows/${rowId}`);
    refresh();
  };

  const startEdit = (rowId, colId, val) => {
    setEditingCell({ rowId, colId });
    setCellVal(val ?? '');
  };

  const saveCell = async (row, colId) => {
    const newData = { ...row.data, [colId]: cellVal };
    await api.patch(`/projects/${projectId}/spreadsheets/${sheet.id}/rows/${row.id}`, { data: newData });
    setEditingCell(null);
    refresh();
  };

  if (!data) return <div className="sheet-loading"><Spinner /></div>;

  return (
    <div className="spreadsheet-wrapper">
      <div className="spreadsheet-toolbar">
        <button className="btn-secondary btn-sm" onClick={addRow}><Plus size={14} /> Rând</button>
        <button className="btn-secondary btn-sm" onClick={() => setAddColModal(true)}><Plus size={14} /> Coloană</button>
        <button className="btn-danger btn-sm" onClick={() => onDeleted(sheet.id)}><Trash2 size={14} /> Șterge tabel</button>
      </div>

      <div className="spreadsheet-scroll">
        <table className="spreadsheet-table">
          <thead>
            <tr>
              <th className="row-num">#</th>
              {data.columns.map(col => (
                <th key={col.id}>
                  <div className="th-inner">
                    <span>{col.name}</span>
                    <button className="col-delete" onClick={() => deleteCol(col.id)}><X size={11} /></button>
                  </div>
                </th>
              ))}
              <th className="row-actions-th" />
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 ? (
              <tr><td colSpan={data.columns.length + 2} className="empty-row">Niciun rând. Apasă + Rând.</td></tr>
            ) : data.rows.map((row, idx) => (
              <tr key={row.id}>
                <td className="row-num">{idx + 1}</td>
                {data.columns.map(col => {
                  const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;
                  return (
                    <td key={col.id} className="cell" onDoubleClick={() => startEdit(row.id, col.id, row.data[col.id])}>
                      {isEditing ? (
                        <div className="cell-edit">
                          <input autoFocus value={cellVal} onChange={e => setCellVal(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveCell(row, col.id); if (e.key === 'Escape') setEditingCell(null); }} />
                          <button onClick={() => saveCell(row, col.id)}><Check size={12} /></button>
                          <button onClick={() => setEditingCell(null)}><X size={12} /></button>
                        </div>
                      ) : (
                        <span className="cell-value">{row.data[col.id] ?? ''}</span>
                      )}
                    </td>
                  );
                })}
                <td className="row-actions-td">
                  <button className="btn-icon danger" onClick={() => deleteRow(row.id)}><Trash2 size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addColModal && (
        <Modal title="Coloană nouă" onClose={() => setAddColModal(false)}>
          <div className="form-group">
            <label>Nume coloană</label>
            <input autoFocus value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="Ex: Status" />
          </div>
          <div className="form-group">
            <label>Tip</label>
            <select value={newColType} onChange={e => setNewColType(e.target.value)}>
              <option value="text">Text</option>
              <option value="number">Număr</option>
              <option value="date">Dată</option>
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setAddColModal(false)}>Anulează</button>
            <button className="btn-primary" onClick={addCol}>Adaugă</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Files Section ─────────────────────────────────────────────
function FilesSection({ projectId }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');
  const [pendingFile, setPendingFile] = useState(null); // file object waiting for name
  const [pendingName, setPendingName] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    api.get(`/projects/${projectId}/files`).then(r => setFiles(r.data));
  }, [projectId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPendingFile(file);
    setPendingName(file.name);
    e.target.value = '';
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', pendingFile);
    fd.append('display_name', pendingName || pendingFile.name);
    const res = await api.post(`/projects/${projectId}/files`, fd);
    setFiles(prev => [res.data, ...prev]);
    setPendingFile(null); setPendingName('');
    setUploading(false);
  };

  const startRename = (f) => { setRenamingId(f.id); setRenameVal(f.display_name); };
  const saveRename = async (id) => {
    const res = await api.patch(`/projects/${projectId}/files/${id}`, { display_name: renameVal });
    setFiles(prev => prev.map(f => f.id === id ? { ...f, display_name: res.data.display_name } : f));
    setRenamingId(null);
  };

  const download = (f) => {
    window.open(`/api/projects/${projectId}/files/${f.id}/download`, '_blank');
  };

  const deleteFile = async (id) => {
    if (!confirm('Ștergi fișierul?')) return;
    await api.delete(`/projects/${projectId}/files/${id}`);
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const fmt = (b) => b > 1048576 ? `${(b/1048576).toFixed(1)} MB` : `${(b/1024).toFixed(0)} KB`;

  return (
    <div className="files-section">
      <div className="section-toolbar">
        <h3><Paperclip size={16} /> Fișiere</h3>
        <button className="btn-secondary btn-sm" onClick={() => fileRef.current.click()} disabled={uploading}>
          <Upload size={14} /> Adaugă fișier
        </button>
        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>

      {pendingFile && (
        <div className="upload-confirm">
          <span>Nume afișat:</span>
          <input value={pendingName} onChange={e => setPendingName(e.target.value)} autoFocus
            onKeyDown={e => e.key === 'Enter' && confirmUpload()} />
          <button className="btn-primary btn-sm" onClick={confirmUpload} disabled={uploading}>
            {uploading ? '...' : <><Check size={13} /> Salvează</>}
          </button>
          <button className="btn-secondary btn-sm" onClick={() => setPendingFile(null)}><X size={13} /></button>
        </div>
      )}

      {files.length === 0 ? (
        <p className="empty-hint">Niciun fișier. Apasă "Adaugă fișier".</p>
      ) : (
        <table className="files-table">
          <thead><tr><th>Nume</th><th>Mărime</th><th>Adăugat de</th><th /></tr></thead>
          <tbody>
            {files.map(f => (
              <tr key={f.id}>
                <td>
                  {renamingId === f.id ? (
                    <div className="cell-edit">
                      <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveRename(f.id); if (e.key === 'Escape') setRenamingId(null); }} />
                      <button onClick={() => saveRename(f.id)}><Check size={12} /></button>
                      <button onClick={() => setRenamingId(null)}><X size={12} /></button>
                    </div>
                  ) : (
                    <span className="file-name">{f.display_name}</span>
                  )}
                </td>
                <td className="file-size">{fmt(f.size_bytes)}</td>
                <td className="file-uploader">{f.uploader_name}</td>
                <td className="file-actions">
                  <button className="btn-icon" onClick={() => startRename(f)} title="Redenumește"><Pencil size={13} /></button>
                  <button className="btn-icon" onClick={() => download(f)} title="Descarcă"><Download size={13} /></button>
                  <button className="btn-icon danger" onClick={() => deleteFile(f.id)} title="Șterge"><Trash2 size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState(null);
  const [newSheetModal, setNewSheetModal] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');

  useEffect(() => {
    api.get('/projects').then(r => {
      const p = r.data.find(x => x.id === parseInt(id));
      if (p) setProject(p);
    });
    api.get(`/projects/${id}/spreadsheets`).then(r => {
      setSheets(r.data);
      if (r.data.length > 0) setActiveSheet(r.data[0]);
    });
  }, [id]);

  const createSheet = async () => {
    if (!newSheetName.trim()) return;
    const res = await api.post(`/projects/${id}/spreadsheets`, { name: newSheetName });
    setSheets(prev => [...prev, res.data]);
    setActiveSheet(res.data);
    setNewSheetName(''); setNewSheetModal(false);
  };

  const deleteSheet = async (sheetId) => {
    if (!confirm('Ștergi tabelul?')) return;
    await api.delete(`/projects/${id}/spreadsheets/${sheetId}`);
    const remaining = sheets.filter(s => s.id !== sheetId);
    setSheets(remaining);
    setActiveSheet(remaining.length > 0 ? remaining[0] : null);
  };

  if (!project) return <div className="page-loading"><Spinner /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/projects')}>
          <ArrowLeft size={16} /> Proiecte
        </button>
        <div className="project-detail-title" style={{ borderLeftColor: project.color }}>
          <FolderKanban size={20} style={{ color: project.color }} />
          <h1>{project.name}</h1>
        </div>
      </div>

      {project.description && <p className="project-desc-banner">{project.description}</p>}

      {/* Files */}
      <FilesSection projectId={id} />

      {/* Spreadsheets */}
      <div className="spreadsheets-section">
        <div className="section-toolbar">
          <h3><Table2 size={16} /> Tabele</h3>
          <button className="btn-secondary btn-sm" onClick={() => setNewSheetModal(true)}>
            <Plus size={14} /> Tabel nou
          </button>
        </div>

        {sheets.length === 0 ? (
          <p className="empty-hint">Niciun tabel. Apasă "Tabel nou".</p>
        ) : (
          <>
            <div className="sheet-tabs">
              {sheets.map(s => (
                <button key={s.id} className={`sheet-tab ${activeSheet?.id === s.id ? 'active' : ''}`}
                  onClick={() => setActiveSheet(s)}>
                  {s.name}
                </button>
              ))}
            </div>
            {activeSheet && (
              <SpreadsheetView projectId={id} sheet={activeSheet} onDeleted={deleteSheet} />
            )}
          </>
        )}
      </div>

      {newSheetModal && (
        <Modal title="Tabel nou" onClose={() => setNewSheetModal(false)}>
          <div className="form-group">
            <label>Nume tabel</label>
            <input autoFocus value={newSheetName} onChange={e => setNewSheetName(e.target.value)}
              placeholder="Ex: Buget, Contacte, KPIs..." onKeyDown={e => e.key === 'Enter' && createSheet()} />
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setNewSheetModal(false)}>Anulează</button>
            <button className="btn-primary" onClick={createSheet}>Creează</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
