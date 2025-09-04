import { NextRequest, NextResponse } from 'next/server';
import { webSearchAgentService } from '@/lib/web-search-agent';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { query, conversationHistory = [], stream = false } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (stream) {
      // Stream the response
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          try {
            const searchStream = await webSearchAgentService.streamSearch(query, conversationHistory);
            
            for await (const chunk of searchStream) {
              const data = JSON.stringify(chunk) + '\n';
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
            
            controller.close();
          } catch (error) {
            console.error('Web search streaming error:', error);
            const errorData = JSON.stringify({
              type: 'error',
              data: { message: error instanceof Error ? error.message : 'Unknown error' }
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const result = await webSearchAgentService.search(query, conversationHistory);
      
      return NextResponse.json({
        success: true,
        data: result
      });
    }
  } catch (error) {
    console.error('Web search API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
