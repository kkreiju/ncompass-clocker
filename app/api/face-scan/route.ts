import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Get Python URL from environment
    const pythonUrl = process.env.PYTHON_URL;

    if (!pythonUrl) {
      console.error('PYTHON_URL environment variable not set');
      return NextResponse.json(
        { error: 'Face recognition service not configured' },
        { status: 500 }
      );
    }

    // Forward the image data to Python service as form data
    const formData = new FormData();
    formData.append('image', imageData);

    const response = await fetch(`${pythonUrl}/scan`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('Python service error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Face recognition service unavailable' },
        { status: 503 }
      );
    }

    const data = await response.json();

    // Check if Python service returned an error message
    if (data.error && data.error.includes('No matching face found')) {
      return NextResponse.json(
        { error: data.error },
        { status: 404 } // Not Found - appropriate for face not recognized
      );
    }

    // Return the response from Python service
    return NextResponse.json(data);

  } catch (error) {
    console.error('Face scan API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
