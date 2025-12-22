export async function getPresignedUrl(axiosClient, imageExtension, filePath) {
	const url = `${import.meta.env.VITE_APP_API_URL}/upload/s3/presignedUrl?imageExtension=${imageExtension}&filePath=${filePath}`;

	const res = await axiosClient.get(url); // GET 요청

	// if (!res.ok) {
	// 	throw new Error(`Presigned URL 요청 실패: ${res.status}`);
	// }
	// const data = res.json();

	const data = res.data;

	return {
		uploadUrl: data.uploadUrl,
		publicUrl: data.publicUrl,
		keyName: data.keyName,
	};
}
