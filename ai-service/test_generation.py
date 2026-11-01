from pathlib import Path

import torch
from PIL import Image

from model.inference import generate_images, load_models


def main():
	unet, attr_encoder, device = load_models()
	attribute_values = torch.tensor(
		[[0, 0, 1, 0, 1, 2, 2, 2]],
		dtype=torch.long,
		device=device,
	)

	with torch.inference_mode():
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
	saved_path = Path(__file__).resolve().parent / 'generated_test.png'
	Image.fromarray(image_array, mode='RGB').save(saved_path)

	print(f'Output tensor shape: {tuple(images.shape)}')
	print(f'Minimum value: {images.min().item():.6f}')
	print(f'Maximum value: {images.max().item():.6f}')
	print(f'Saved image: {saved_path}')


if __name__ == '__main__':
	main()