export function getHealth(request, response) {
  response.status(200).json({
    success: true,
    message: 'FaceForge AI backend is running',
  })
}