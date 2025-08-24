import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'

const MEM0_API_KEY = process.env.MEM0_API_KEY;
const MEM0_BASE_URL = 'https://api.mem0.ai';

// Helper function to make fetch request with proper error handling
async function makeMem0Request(url: string, method: string, body?: any, headers?: Record<string, string>) {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${MEM0_API_KEY}`,
        ...headers
      },
      ...(body && { body: JSON.stringify(body) })
    });

    return { success: true, response, error: null };
  } catch (error) {
    console.error(`Mem0 API request failed for ${url}:`, error);
    
    // Check if it's a TLS/certificate error
    if (error instanceof Error && error.message.includes('certificate')) {
      return { 
        success: false, 
        response: null, 
        error: `TLS Certificate Error: ${error.message}` 
      };
    }
    
    // Check if it's a network error
    if (error instanceof Error && error.message.includes('fetch failed')) {
      return { 
        success: false, 
        response: null, 
        error: `Network Error: ${error.message}` 
      };
    }
    
    return { 
      success: false, 
      response: null, 
      error: `Request Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}



export async function GET(request: NextRequest) {
  // Test endpoint to check Mem0 API connectivity
  if (!MEM0_API_KEY) {
    return NextResponse.json({ error: 'Mem0 API key not configured' }, { status: 500 });
  }

  try {
    console.log('Testing Mem0 API connectivity...');
    
    // Try to make a simple request to test connectivity
    const { success, response, error } = await makeMem0Request(`${MEM0_BASE_URL}/v1/memories/`, 'GET');
    
    if (!success) {
      return NextResponse.json({
        status: 'failed',
        error: error,
        message: 'Mem0 API is not accessible'
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Mem0 API is accessible',
      endpoint: MEM0_BASE_URL,
      responseStatus: response?.status
    });

  } catch (error) {
    console.error('Mem0 connectivity test failed:', error);
    return NextResponse.json({
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Mem0 API connectivity test failed'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  
  if (!MEM0_API_KEY) {
    return NextResponse.json({ error: 'Mem0 API key not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { action, ...data } = body;

    let mem0Url: string;
    let mem0Method: string;
    let mem0Body: any;

    switch (action) {
      case 'add':
        mem0Url = `${MEM0_BASE_URL}/v1/memories/`;
        mem0Method = 'POST';
        mem0Body = {
          messages: data.messages,
          user_id: data.user_id,
          metadata: data.metadata
        };
        break;

      case 'search':
        mem0Url = `${MEM0_BASE_URL}/v2/memories/search/`;
        mem0Method = 'POST';
        mem0Body = {
          query: data.query,
          filters: data.filters,
          limit: data.limit || 10,
          threshold: data.threshold || 0.3,
          rerank: data.rerank || false,
          keyword_search: data.keyword_search || false
        };
        break;

      case 'getAll':
        mem0Url = `${MEM0_BASE_URL}/v1/memories/?user_id=${data.user_id}`;
        mem0Method = 'GET';
        break;

      case 'deleteAll':
        mem0Url = `${MEM0_BASE_URL}/v1/memories/?user_id=${data.user_id}`;
        mem0Method = 'DELETE';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    console.log(`Making Mem0 API call to ${mem0Url} with method ${mem0Method}`);

    const { success, response, error } = await makeMem0Request(mem0Url, mem0Method, mem0Body);

    if (!success) {
      console.error(`Mem0 API request failed: ${error}`);
      return NextResponse.json(
        { 
          error: 'Mem0 API request failed', 
          details: error,
          suggestion: 'Check your internet connection and verify the Mem0 API endpoint is accessible'
        },
        { status: 500 }
      );
    }

    if (!response) {
      return NextResponse.json(
        { error: 'No response from Mem0 API' },
        { status: 500 }
      );
    }

    console.log(`Mem0 API call to ${mem0Url}: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Mem0 API error (${response.status}):`, errorText);
      return NextResponse.json(
        { error: `Mem0 API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Mem0 proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Check the server logs for more details'
      },
      { status: 500 }
    );
  }
}
