import React, { useState, useEffect } from 'react';
import type { DatabaseBackupRecord, UserProfile } from '../types/expense';
import { getErrorMessage } from '../lib/errors';
import { X, ShieldAlert, Database, History, RefreshCw, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';

interface AdminBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  users: UserProfile[];
  onDataRestored: () => void;
}

export const AdminBackupModal: React.FC<AdminBackupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onDataRestored,
}) => {
  const [backups, setBackups] = useState<DatabaseBackupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/admin/backup');
      const data = await res.json();
      if (data.status === 'ok') {
        setBackups(data.backups || []);
      }
    } catch (err) {
      console.error('Failed to load backups:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBackups();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateBackup = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createdById: currentUser?.id,
          notes: `Snapshot created by ${currentUser?.name || 'Admin'} at ${new Date().toLocaleTimeString()}`,
        }),
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setStatusMessage(`Cloud backup snapshot created with ${data.backup.recordCount} records.`);
        fetchBackups();
      } else {
        setErrorMessage(data.message || 'Backup failed');
      }
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, 'Backup failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!window.confirm('Restore database from this snapshot? Current database records will be replaced.')) {
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId }),
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setStatusMessage(`Successfully restored ${data.restoredCount} database records.`);
        onDataRestored();
      } else {
        setErrorMessage(data.message || 'Restore failed');
      }
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, 'Restore failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--ha-line)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShieldAlert size={20} color="var(--ha-blue)" />
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ha-ink)', lineHeight: 1.1 }}>
                Admin & Database Backup
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--ha-muted)', marginTop: '2px' }}>
                Prisma PostgreSQL database snapshot & recovery
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Status Feedback */}
          {statusMessage && (
            <div style={{
              backgroundColor: 'var(--ha-lime-tint)',
              border: '1px solid var(--ha-lime)',
              borderRadius: 'var(--ha-radius-sm)',
              padding: '0.65rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--ha-ink)',
              fontSize: '0.82rem',
              fontWeight: 500,
            }}>
              <CheckCircle2 size={16} />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div style={{
              backgroundColor: 'var(--ha-red-tint)',
              border: '1px solid var(--ha-red)',
              borderRadius: 'var(--ha-radius-sm)',
              padding: '0.65rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--ha-red)',
              fontSize: '0.82rem',
              fontWeight: 500,
            }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Household Users Summary */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ha-ink)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck size={16} color="var(--ha-blue)" />
              <span>Configured Household Accounts ({users.length})</span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
              {users.map((u) => (
                <div
                  key={u.id}
                  style={{
                    backgroundColor: '#fafaf7',
                    border: '1px solid var(--ha-line)',
                    borderRadius: 'var(--ha-radius-sm)',
                    padding: '0.65rem 0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                      {u.name}
                    </span>
                    <span className={u.role === 'ADMIN' ? 'ha-badge ha-badge-blue' : u.role === 'BACKUP_ADMIN' ? 'ha-badge ha-badge-red' : 'ha-badge ha-badge-neutral'} style={{ fontSize: '0.65rem' }}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--ha-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {u.email}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Create Cloud Snapshot Button */}
          <div style={{
            backgroundColor: '#fafaf7',
            border: '1px solid var(--ha-line)',
            borderRadius: 'var(--ha-radius-md)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Database size={16} color="var(--ha-blue)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                  Prisma PostgreSQL Database
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', marginTop: '2px' }}>
                Create a full cloud database point-in-time snapshot
              </div>
            </div>

            <button
              onClick={handleCreateBackup}
              disabled={isLoading}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem' }}
            >
              <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
              <span>Create Cloud Snapshot</span>
            </button>
          </div>

          {/* Backups List */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ha-ink)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <History size={16} color="var(--ha-muted)" />
              <span>Available Cloud Snapshots ({backups.length})</span>
            </h4>

            {backups.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--ha-muted)', backgroundColor: '#fafaf7', borderRadius: 'var(--ha-radius-sm)', border: '1px solid var(--ha-line)' }}>
                <p style={{ fontSize: '0.82rem' }}>No cloud snapshots recorded yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                {backups.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--ha-radius-sm)',
                      backgroundColor: 'var(--ha-white)',
                      border: '1px solid var(--ha-line)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ha-ink)' }}>
                        {b.notes || 'Point-in-time Snapshot'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ha-muted)' }}>
                        {new Date(b.createdAt).toLocaleString()} • {b.recordCount} records
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestoreBackup(b.id)}
                      disabled={isLoading}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
