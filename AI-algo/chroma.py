import requests
from io import BytesIO
from PIL import Image
import chromadb
from sklearn.metrics.pairwise import cosine_similarity
from embeddings import extract_features
import numpy as np
import time

# Initialize persistent client
chroma_client = chromadb.PersistentClient(path="./storage")
collection = chroma_client.get_or_create_collection(name="soulbase")

def download_image(url):
    response = requests.get(url)
    if response.status_code == 200:
        return Image.open(BytesIO(response.content))
    else:
        return None
    
def store_and_compare_embeddings(image_url):
    image = download_image(image_url)
    if image is None:
        raise ValueError("Could not download image from URL")

    start_time = time.time()

    current_embedding = extract_features(image).tolist()

    # Check if embedding already exists
    existing = collection.get(ids=[image_url])
    is_existing_image = bool(existing['documents'])  # Check if the image already exists

    # Set success to false if image already exists in the collection
    success = not is_existing_image

    # Compare the current embedding with all existing embeddings
    all_embeddings = collection.query(
        query_embeddings=[current_embedding],
        include=["documents", "embeddings"]
    )

    similarities = []
    for i, doc_url in enumerate(all_embeddings['documents'][0]):
        before_embedding = all_embeddings['embeddings'][0][i]
        similarity = cosine_similarity(
            np.array([current_embedding]).reshape(1, -1), 
            np.array([before_embedding]).reshape(1, -1)
        )[0][0]

        # Add to similarities list
        similarities.append({"file": doc_url, "similarity": similarity})

        # Further check for similarity with other images
        if doc_url != image_url and similarity >= 0.95:
            success = False

    # Store the embedding only if it's a new image and success is true
    if success and not is_existing_image:
        collection.add(embeddings=[current_embedding], documents=[image_url], ids=[image_url])

    end_time = time.time()
    print(f"Time taken for computation: {end_time - start_time} seconds")

    return {"embeddings": similarities, "success": success}
