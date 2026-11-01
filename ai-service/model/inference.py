from pathlib import Path

import torch
from diffusers import DDIMScheduler, DDPMScheduler

from .architecture import AttrEncoder, create_unet


def load_models():
	"""Load EMA models on CPU; future forward passes should use torch.inference_mode()."""
	device = torch.device('cpu')
	checkpoint_path = (
		Path(__file__).resolve().parents[1]
		/ 'checkpoints'
		/ 'training_checkpoint_step_4000.pt'
	)

	if not checkpoint_path.is_file():
		raise FileNotFoundError(f'FaceForge checkpoint not found: {checkpoint_path}')

	try:
		# This trusted training checkpoint contains NumPy metadata not accepted by weights_only=True.
		checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)
		unet = create_unet()
		attr_encoder = AttrEncoder(num_attributes=8, embedding_dim=256)

		unet.load_state_dict(checkpoint['ema_unet'], strict=True)
		attr_encoder.load_state_dict(checkpoint['ema_attr_encoder'], strict=True)
	except Exception as error:
		raise RuntimeError(
			f'Failed to load FaceForge EMA models from {checkpoint_path}: {error}'
		) from error

	unet.to(device)
	attr_encoder.to(device)
	unet.eval()
	attr_encoder.eval()

	return unet, attr_encoder, device


@torch.inference_mode()
def generate_images(
	attribute_values,
	unet,
	attr_encoder,
	device=None,
	num_inference_steps=50,
	guidance_scale=3.0,
):
	if not isinstance(attribute_values, torch.Tensor):
		raise TypeError('attribute_values must be a torch.Tensor')
	if attribute_values.ndim != 2 or attribute_values.shape[1] != 8:
		raise ValueError('attribute_values must have shape [batch_size, 8]')
	if attribute_values.shape[0] == 0:
		raise ValueError('attribute_values must contain at least one batch item')
	if attribute_values.dtype not in {
		torch.uint8,
		torch.int8,
		torch.int16,
		torch.int32,
		torch.int64,
	}:
		raise TypeError('attribute_values must contain integer attribute values')
	if not isinstance(num_inference_steps, int) or isinstance(num_inference_steps, bool) or num_inference_steps < 1:
		raise ValueError('num_inference_steps must be a positive integer')

	device = torch.device(device) if device is not None else next(unet.parameters()).device
	unet.to(device).eval()
	attr_encoder.to(device).eval()
	attribute_values = attribute_values.to(device=device, dtype=torch.long)
	if torch.any((attribute_values < 0) | (attribute_values > 2)):
		raise ValueError('attribute values must be 0, 1, or 2')

	batch_size = attribute_values.shape[0]
	attribute_ids = torch.arange(8, device=device).unsqueeze(0).expand(batch_size, -1)
	unconditional_values = torch.full(
		(batch_size, 8),
		2,
		dtype=torch.long,
		device=device,
	)

	conditional_states = attr_encoder(attribute_ids, attribute_values)
	unconditional_states = attr_encoder(attribute_ids, unconditional_values)

	noise_scheduler = DDPMScheduler(
		num_train_timesteps=1000,
		beta_schedule='squaredcos_cap_v2',
		prediction_type='epsilon',
		clip_sample=True,
	)
	scheduler = DDIMScheduler.from_config(noise_scheduler.config)
	scheduler.alphas_cumprod = scheduler.alphas_cumprod.to(device)
	scheduler.final_alpha_cumprod = scheduler.final_alpha_cumprod.to(device)
	scheduler.set_timesteps(num_inference_steps, device=device)

	sample = torch.randn((batch_size, 3, 64, 64), device=device)
	sample = sample * scheduler.init_noise_sigma
	encoder_states = torch.cat((unconditional_states, conditional_states), dim=0)

	for timestep in scheduler.timesteps:
		model_input = torch.cat((sample, sample), dim=0)
		model_input = scheduler.scale_model_input(model_input, timestep)
		noise_prediction = unet(
			model_input,
			timestep,
			encoder_hidden_states=encoder_states,
		).sample
		unconditional_prediction, conditional_prediction = noise_prediction.chunk(2)
		guided_prediction = unconditional_prediction + guidance_scale * (
			conditional_prediction - unconditional_prediction
		)
		sample = scheduler.step(guided_prediction, timestep, sample).prev_sample

	return (sample.clamp(-1, 1) + 1) / 2
