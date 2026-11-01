from diffusers import UNet2DConditionModel
from torch import nn


class AttrEncoder(nn.Module):
	def __init__(self, num_attributes=8, embedding_dim=256):
		super().__init__()
		self.attr_embedding = nn.Embedding(num_attributes, embedding_dim)
		self.value_embedding = nn.Embedding(3, embedding_dim)

	def forward(self, attribute_ids, attribute_values):
		return self.attr_embedding(attribute_ids) + self.value_embedding(attribute_values)


def create_unet():
	return UNet2DConditionModel(
		sample_size=64,
		in_channels=3,
		out_channels=3,
		layers_per_block=2,
		block_out_channels=(64, 128, 256),
		down_block_types=(
			'DownBlock2D',
			'CrossAttnDownBlock2D',
			'CrossAttnDownBlock2D',
		),
		up_block_types=(
			'CrossAttnUpBlock2D',
			'CrossAttnUpBlock2D',
			'UpBlock2D',
		),
		cross_attention_dim=256,
		attention_head_dim=8,
		norm_num_groups=8,
	)
