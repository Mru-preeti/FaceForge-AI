
import torch

checkpoint_path = "checkpoints/training_checkpoint_step_4000.pt"

checkpoint = torch.load(
    checkpoint_path,
    map_location="cpu",
    weights_only=False
)

print("\n========== TRAINING CONFIGURATION ==========")

for key, value in checkpoint["config"].items():
    print(f"{key}: {value}")

print("\n========== GLOBAL STEP ==========")
print(checkpoint["global_step"])

print("\n========== EPOCH ==========")
print(checkpoint["epoch"])

print("\n========== U-NET WEIGHT COUNT ==========")
print(len(checkpoint["ema_unet"]))

print("\n========== ATTRIBUTE ENCODER WEIGHT COUNT ==========")
print(len(checkpoint["ema_attr_encoder"]))

print("\n========== INSPECTION COMPLETE ==========")
