import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  ExternalLink,
  Lock,
  Cpu,
  RefreshCw,
  Sparkles,
  Zap,
  Activity,
  Terminal,
} from 'lucide-react';
import {
  AIProvider,
  VaultKeyMetadata,
  storeKeyInVault,
  listVaultKeys,
  removeKeyFromVault,
  purgeVault,
  maskKey,
} from '../../services/cryptoVault';
import { validateBYOKKey } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onKeysChanged?: () => void;
}

interface ProviderMeta {
  id: AIProvider;
  name: string;
  badge: string;
  defaultModel: string;
  models: string[];
  placeholder: string;
  docUrl: string;
  prefix: string;
  description: string;
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Gemini 3.6',
    defaultModel: 'gemini-3.6-flash',
    models: ['gemini-3.6-flash', 'gemini-3.6-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    placeholder: 'AIzaSy...',
    docUrl: 'https://aistudio.google.com/app/apikey',
    prefix: 'AIzaSy',
    description: 'High-speed multi-agent decomposition with structured JSON schema mode.',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    badge: 'GPT-4o',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'o3-mini'],
    placeholder: 'sk-proj-...',
    docUrl: 'https://platform.openai.com/api-keys',
    prefix: 'sk-',
    description: 'Deterministic reasoning and contract-first mock API routes.',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    badge: 'Claude 3.5',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    placeholder: 'sk-ant-...',
    docUrl: 'https://console.anthropic.com/settings/keys',
    prefix: 'sk-ant-',
    description: 'Complex architectural graph modeling and code synthesis.',
  },
  {
    id: 'github',
    name: 'GitHub Personal Token',
    badge: 'PAT',
    defaultModel: 'REST API v3',
    models: ['repo', 'workflow', 'read:user'],
    placeholder: 'ghp_...',
    docUrl: 'https://github.com/settings/tokens',
    prefix: 'ghp_',
    description: 'Direct GitHub repository generation, branch isolation, and PR sync.',
  },
];

export const KeyVaultModal: React.FC<Props> = ({ isOpen, onClose, onKeysChanged }) => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('gemini');
  const [inputKey, setInputKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.6-flash');
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    valid: boolean;
    message: string;
    latencyMs?: number;
    models?: string[];
  } | null>(null);

  const [activeKeys, setActiveKeys] = useState<VaultKeyMetadata[]>([]);
  const [confirmPurge, setConfirmPurge] = useState(false);

  useEffect(() => {
    if (isOpen) {
      refreshKeys();
      setVerifyResult(null);
      setInputKey('');
    }
  }, [isOpen]);

  const refreshKeys = () => {
    const keys = listVaultKeys();
    setActiveKeys(keys);
    if (onKeysChanged) onKeysChanged();
  };

  const currentProviderMeta = PROVIDERS.find((p) => p.id === selectedProvider) || PROVIDERS[0];

  const handleProviderSelect = (providerId: AIProvider) => {
    setSelectedProvider(providerId);
    const meta = PROVIDERS.find((p) => p.id === providerId);
    if (meta) {
      setSelectedModel(meta.defaultModel);
    }
    setVerifyResult(null);
    setInputKey('');
  };

  const handleVerifyAndSave = async () => {
    if (!inputKey.trim()) return;
    setIsVerifying(true);
    setVerifyResult(null);

    try {
      const res = await validateBYOKKey(selectedProvider, inputKey.trim(), selectedModel);
      setVerifyResult({
        valid: res.valid,
        message: res.message,
        latencyMs: res.latency_ms,
        models: res.available_models,
      });

      if (res.valid) {
        await storeKeyInVault(
          selectedProvider,
          inputKey.trim(),
          selectedModel,
          true,
          res.latency_ms
        );
        refreshKeys();
        setInputKey('');
      }
    } catch (err: any) {
      setVerifyResult({
        valid: false,
        message: err.message || 'Key validation probe failed',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeleteKey = (provider: AIProvider) => {
    removeKeyFromVault(provider);
    refreshKeys();
  };

  const handlePurgeAll = () => {
    purgeVault();
    refreshKeys();
    setConfirmPurge(false);
    setVerifyResult(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden z-10 my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Key className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                  Bring Your Own Key (BYOK) Vault
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    AES-256-GCM Encrypted
                  </span>
                </h3>
                <p className="text-[11px] font-mono text-zinc-400">
                  Zero-knowledge client encryption. Keys are never stored on backend servers or logged.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Provider Selector Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                1. Select AI Provider
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PROVIDERS.map((p) => {
                  const isSelected = selectedProvider === p.id;
                  const isConfigured = activeKeys.some((k) => k.provider === p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleProviderSelect(p.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-zinc-900 border-cyan-500/60 shadow-sm'
                          : 'bg-zinc-900/40 border-white/10 hover:border-white/20 hover:bg-zinc-900/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white font-sans truncate">
                          {p.name}
                        </span>
                        {isConfigured && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Key Stored" />
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                        {p.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Provider Details & Input */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white font-sans">
                    {currentProviderMeta.name} Credentials
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    {currentProviderMeta.description}
                  </div>
                </div>
                <a
                  href={currentProviderMeta.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 shrink-0"
                >
                  <span>Get Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Model Target Selector */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-400 shrink-0">Model Target:</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentProviderMeta.models.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedModel(m)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border cursor-pointer ${
                        selectedModel === m
                          ? 'bg-zinc-800 text-white border-white/20 font-semibold'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-white/5'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Input */}
              <div className="space-y-1.5">
                <div className="relative flex items-center">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder={`Enter ${currentProviderMeta.name} API Key (${currentProviderMeta.placeholder})`}
                    className="w-full pr-20 pl-3.5 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                      title={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-zinc-400" />
                  <span>Key is encrypted with AES-GCM-256 before writing to local storage.</span>
                </div>
              </div>

              {/* Action Button: Verify and Store */}
              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleVerifyAndSave}
                  disabled={isVerifying || !inputKey.trim()}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-mono font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      <span>Verifying with {currentProviderMeta.name}...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-zinc-950" />
                      <span>Verify & Encrypt Key</span>
                    </>
                  )}
                </button>
              </div>

              {/* Live Probe Feedback */}
              {verifyResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                    verifyResult.valid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      {verifyResult.valid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                      )}
                      {verifyResult.message}
                    </span>
                    {verifyResult.latencyMs !== undefined && (
                      <span className="text-[10px] text-zinc-400">
                        Latency: {verifyResult.latencyMs}ms
                      </span>
                    )}
                  </div>
                  {verifyResult.models && verifyResult.models.length > 0 && (
                    <div className="text-[10px] text-zinc-400 pt-1">
                      Available models: {verifyResult.models.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Configured Keys Table */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Active Stored Keys ({activeKeys.length})
                </span>
                {activeKeys.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmPurge(true)}
                    className="text-[10px] font-mono text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All Stored Keys</span>
                  </button>
                )}
              </div>

              {activeKeys.length > 0 ? (
                <div className="space-y-2">
                  {activeKeys.map((keyMeta) => (
                    <div
                      key={keyMeta.provider}
                      className="p-3 rounded-xl bg-zinc-900/60 border border-white/10 flex items-center justify-between font-mono text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white uppercase text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10">
                            {keyMeta.provider}
                          </span>
                          <span className="text-cyan-400 font-semibold">
                            {keyMeta.maskedKey}
                          </span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            Verified
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Fingerprint: {keyMeta.fingerprint} • Target: {keyMeta.model}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteKey(keyMeta.provider)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                        title="Delete this key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs font-mono text-zinc-500">
                  No custom API keys stored. Daedalus will use the built-in deterministic multi-domain engine.
                </div>
              )}
            </div>

            {/* Confirm Purge Warning */}
            {confirmPurge && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono space-y-2">
                <div className="text-red-300 font-bold">
                  Are you sure you want to clear all stored keys?
                </div>
                <p className="text-[11px] text-zinc-400">
                  This will remove all stored API keys from your browser's local storage.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handlePurgeAll}
                    className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs cursor-pointer transition-colors"
                  >
                    Clear All Keys
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmPurge(false)}
                    className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Security Architecture Invariants */}
            <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-white/5 space-y-2 text-xs font-mono text-zinc-400">
              <div className="text-[11px] uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Security Architecture Guarantees
              </div>
              <ul className="space-y-1 text-[11px] list-disc list-inside text-zinc-400">
                <li><strong className="text-zinc-300">Client-First Web Crypto</strong>: Encrypted using AES-256-GCM with 100k PBKDF2 iterations.</li>
                <li><strong className="text-zinc-300">Zero Server-Side Storage</strong>: Keys are never persisted in the database.</li>
                <li><strong className="text-zinc-300">Transit Redaction</strong>: Backend middleware sanitizes stdout and error tracebacks.</li>
                <li><strong className="text-zinc-300">Fail-Safe Resilience</strong>: Automatic fallback to deterministic engine if rate limited.</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-6 py-4 border-t border-white/10 bg-zinc-900/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
