import lighthouse from '@lighthouse-web3/sdk'

export const POST = async (req) => {
  const data = await req.formData();
  const file = data.get('file');
  const fileType = data.get('fileType');

  if (!file) {
    return new Response(JSON.stringify({ error: 'File is required' }), {
      status: 400,
    });
  }

  if (fileType !== 'image') {
    return new Response(
      JSON.stringify({ error: 'Only image files are allowed' }),
      { status: 400 }
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const response = await lighthouse.uploadBuffer(
      buffer, 
      process.env.LIGHTHOUSE_API_KEY
    );

    console.log('Lighthouse result:', response);

    if (response.data) {
      return new Response(
        JSON.stringify({ success: true, ipfsHash: response.data.Hash }),
        { status: 200 }
      );
    } else {
      throw new Error('Failed to upload to Lighthouse');
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response('Failed to upload to Lighthouse', { status: 500 });
  }
}
