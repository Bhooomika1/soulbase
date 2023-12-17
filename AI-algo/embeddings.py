import torch
import torchvision.models as models
import torchvision.transforms as transforms
from torchvision.models import ResNet50_Weights
from PIL import Image

# Load a pre-trained ResNet50 model with the new weights parameter
weights = ResNet50_Weights.DEFAULT
model = models.resnet50(weights=weights)
model.eval()

# Define a transform to preprocess the image
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


# Define your extract_features function here
def extract_features(image):
    # Convert RGBA to RGB
    if image.mode == 'RGBA':
        image = image.convert('RGB')

    # Apply the transformations
    image = transform(image).unsqueeze(0)

    # Forward pass through the model
    with torch.no_grad():
        features = model(image)

    return features.squeeze(0)
