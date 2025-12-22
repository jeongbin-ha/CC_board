export async function uploadImageToS3(file, extension, uploadUrl) {
    const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': `image/${extension}`,
            'x-amz-meta-content-type': `image/${extension}`,
            'x-amz-meta-filetype': `image/${extension}`,
        },
        body: file,
    });

    if (!putRes.ok) {
        const errorText = await putRes.text();
        throw new Error(`S3 업로드 실패: ${putRes.status} - ${errorText}`);
    }
}