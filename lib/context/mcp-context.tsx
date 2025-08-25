"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// Types for MCP servers and tools
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: any;
}

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  type: 'sse' | 'http';
  command?: string;
  args?: string[];
  env?: KeyValuePair[];
  headers?: KeyValuePair[];
  status?: ServerStatus;
  errorMessage?: string;
  tools?: MCPTool[];
}

export interface KeyValuePair {
  key: string;
  value: string;
}

export type ServerStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface MCPState {
  servers: MCPServer[];
  selectedServers: string[];
  isInitialized: boolean;
}

type MCPAction =
  | { type: 'SET_SERVERS'; payload: MCPServer[] }
  | { type: 'ADD_SERVER'; payload: MCPServer }
  | { type: 'UPDATE_SERVER'; payload: { id: string; updates: Partial<MCPServer> } }
  | { type: 'REMOVE_SERVER'; payload: string }
  | { type: 'SET_SELECTED_SERVERS'; payload: string[] }
  | { type: 'TOGGLE_SERVER_SELECTION'; payload: string }
  | { type: 'SET_INITIALIZED'; payload: boolean };

const initialState: MCPState = {
  servers: [],
  selectedServers: [],
  isInitialized: false,
};

function mcpReducer(state: MCPState, action: MCPAction): MCPState {
  switch (action.type) {
    case 'SET_SERVERS':
      return { ...state, servers: action.payload };
    case 'ADD_SERVER':
      return { ...state, servers: [...state.servers, action.payload] };
    case 'UPDATE_SERVER':
      return {
        ...state,
        servers: state.servers.map(server =>
          server.id === action.payload.id
            ? { ...server, ...action.payload.updates }
            : server
        ),
      };
    case 'REMOVE_SERVER':
      return {
        ...state,
        servers: state.servers.filter(server => server.id !== action.payload),
        selectedServers: state.selectedServers.filter(id => id !== action.payload),
      };
    case 'SET_SELECTED_SERVERS':
      return { ...state, selectedServers: action.payload };
    case 'TOGGLE_SERVER_SELECTION':
      return {
        ...state,
        selectedServers: state.selectedServers.includes(action.payload)
          ? state.selectedServers.filter(id => id !== action.payload)
          : [...state.selectedServers, action.payload],
      };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    default:
      return state;
  }
}

interface MCPContextType {
  state: MCPState;
  servers: MCPServer[];
  selectedServers: string[];
  addServer: (server: Omit<MCPServer, 'id'>) => void;
  updateServer: (id: string, updates: Partial<MCPServer>) => void;
  removeServer: (id: string) => void;
  setSelectedServers: (serverIds: string[]) => void;
  toggleServerSelection: (serverId: string) => void;
  startServer: (serverId: string) => Promise<boolean>;
  stopServer: (serverId: string) => Promise<boolean>;
  updateServerStatus: (serverId: string, status: ServerStatus, errorMessage?: string) => void;
}

const MCPContext = createContext<MCPContextType | undefined>(undefined);

export function MCPProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(mcpReducer, initialState);

  // Load servers from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('zen0-mcp-servers');
      if (stored) {
        const servers = JSON.parse(stored);
        dispatch({ type: 'SET_SERVERS', payload: servers });
      }
    } catch (error) {
      console.error('Failed to load MCP servers from localStorage:', error);
    }

    try {
      const stored = localStorage.getItem('zen0-mcp-selected-servers');
      if (stored) {
        const selectedServers = JSON.parse(stored);
        dispatch({ type: 'SET_SELECTED_SERVERS', payload: selectedServers });
      }
    } catch (error) {
      console.error('Failed to load selected MCP servers from localStorage:', error);
    }

    dispatch({ type: 'SET_INITIALIZED', payload: true });
  }, []);

  // Save servers to localStorage whenever they change
  useEffect(() => {
    if (state.isInitialized) {
      try {
        localStorage.setItem('zen0-mcp-servers', JSON.stringify(state.servers));
      } catch (error) {
        console.error('Failed to save MCP servers to localStorage:', error);
      }
    }
  }, [state.servers, state.isInitialized]);

  // Save selected servers to localStorage whenever they change
  useEffect(() => {
    if (state.isInitialized) {
      try {
        localStorage.setItem('zen0-mcp-selected-servers', JSON.stringify(state.selectedServers));
      } catch (error) {
        console.error('Failed to save selected MCP servers to localStorage:', error);
      }
    }
  }, [state.selectedServers, state.isInitialized]);

  const addServer = useCallback((server: Omit<MCPServer, 'id'>) => {
    const newServer: MCPServer = {
      ...server,
      id: crypto.randomUUID(),
      status: 'disconnected',
    };
    dispatch({ type: 'ADD_SERVER', payload: newServer });
  }, []);

  const updateServer = useCallback((id: string, updates: Partial<MCPServer>) => {
    dispatch({ type: 'UPDATE_SERVER', payload: { id, updates } });
  }, []);

  const removeServer = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_SERVER', payload: id });
  }, []);

  const setSelectedServers = useCallback((serverIds: string[]) => {
    dispatch({ type: 'SET_SELECTED_SERVERS', payload: serverIds });
  }, []);

  const toggleServerSelection = useCallback((serverId: string) => {
    dispatch({ type: 'TOGGLE_SERVER_SELECTION', payload: serverId });
  }, []);

  const updateServerStatus = useCallback((serverId: string, status: ServerStatus, errorMessage?: string) => {
    updateServer(serverId, { status, errorMessage });
  }, [updateServer]);

  const startServer = useCallback(async (serverId: string): Promise<boolean> => {
    const server = state.servers.find(s => s.id === serverId);
    if (!server) return false;

    try {
      // Update status to connecting
      updateServerStatus(serverId, 'connecting');

      // Make a request to the MCP health check endpoint
      const response = await fetch('/api/mcp/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: server.url }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ready && data.tools) {
          updateServer(serverId, {
            status: 'connected',
            tools: data.tools,
            errorMessage: undefined,
          });
          return true;
        } else {
          updateServerStatus(serverId, 'error', data.error || 'Server not ready');
          return false;
        }
      } else {
        const errorData = await response.json();
        updateServerStatus(serverId, 'error', errorData.error || 'Failed to connect');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateServerStatus(serverId, 'error', errorMessage);
      return false;
    }
  }, [state.servers, updateServer, updateServerStatus]);

  const stopServer = useCallback(async (serverId: string): Promise<boolean> => {
    try {
      updateServerStatus(serverId, 'disconnected');
      updateServer(serverId, { tools: undefined, errorMessage: undefined });
      return true;
    } catch (error) {
      console.error('Error stopping server:', error);
      return false;
    }
  }, [updateServer, updateServerStatus]);

  const value: MCPContextType = {
    state,
    servers: state.servers,
    selectedServers: state.selectedServers,
    addServer,
    updateServer,
    removeServer,
    setSelectedServers,
    toggleServerSelection,
    startServer,
    stopServer,
    updateServerStatus,
  };

  return <MCPContext.Provider value={value}>{children}</MCPContext.Provider>;
}

export function useMCP(): MCPContextType {
  const context = useContext(MCPContext);
  if (context === undefined) {
    throw new Error('useMCP must be used within an MCPProvider');
  }
  return context;
}
