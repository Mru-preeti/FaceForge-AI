import logging
from io import BytesIO
from threading import Lock

import torch
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from PIL import Image

from model.inference import generate_images, load_models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('faceforge.model_service')

app = FastAPI(title='FaceForge AI model service')
_models_lock = Lock()
_cached_models = None


class GenerateRequest(BaseModel):
	model_config = ConfigDict(extra='forbid')

	Brown_Hair: int = Field(strict=True, ge=0, le=2)
	Black_Hair: int = Field(strict=True, ge=0, le=2)
	Blond_Hair: int = Field(strict=True, ge=0, le=2)
	Gray_Hair: int = Field(strict=True, ge=0, le=2)
	Smiling: int = Field(strict=True, ge=0, le=2)
	Eyeglasses: int = Field(strict=True, ge=0, le=2)
	Wearing_Hat: int = Field(strict=True, ge=0, le=2)
	Heavy_Makeup: int = Field(strict=True, ge=0, le=2)


def get_cached_models():
	global _cached_models

	if _cached_models is None:
		with _models_lock:
			if _cached_models is None:
				_cached_models = load_models()

	return _cached_models

app.add_middleware(
	CORSMiddleware,
	allow_origins=['http://localhost:5000'],
	allow_credentials=True,
	allow_methods=['*'],
	allow_headers=['*'],
)


@app.get('/health')
async def health():
	logger.info('Health check requested')
	return {
		'success': True,
		'service': 'FaceForge AI model service',
		'status': 'ready',
	}


@app.post('/generate')
def generate(request: GenerateRequest):
	try:
		unet, attr_encoder, device = get_cached_models()
		attribute_values = torch.tensor(
			[[
				request.Brown_Hair,
				request.Black_Hair,
				request.Blond_Hair,
				request.Gray_Hair,
				request.Smiling,
				request.Eyeglasses,
				request.Wearing_Hat,
				request.Heavy_Makeup,
			]],
			dtype=torch.long,
			device=device,
		)
		images = generate_images(
			attribute_values,
			unet,
			attr_encoder,
			device=device,
			num_inference_steps=50,
			guidance_scale=3.0,
		)

		image_array = (
			images[0]
			.detach()
			.cpu()
			.clamp(0, 1)
			.mul(255)
			.round()
			.to(torch.uint8)
			.permute(1, 2, 0)
			.numpy()
		)
		image_buffer = BytesIO()
		Image.fromarray(image_array).save(image_buffer, format='PNG')
		return Response(content=image_buffer.getvalue(), media_type='image/png')
	except Exception as error:
		logger.exception('Image generation failed')
		raise HTTPException(
			status_code=500,
			detail='Image generation failed. See server logs for details.',
		) from error


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, error: Exception):
	logger.exception(
		'Unhandled error while processing %s %s',
		request.method,
		request.url.path,
	)
	return JSONResponse(
		status_code=500,
		content={
			'success': False,
			'message': 'Internal server error',
		},
	)
